import { randomUUID } from "node:crypto";
import { HttpService } from "@nestjs/axios";
import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import type { Request, Response } from "express";
import { firstValueFrom } from "rxjs";

/** Timeout cho 1 lần gọi service đích — chặn gateway treo vô hạn nếu service đích không phản hồi.
 * Khác circuit breaker (task #8, Phase 3): timeout chỉ giới hạn 1 request, không nhớ trạng thái
 * "service này đang chết" giữa các request — circuit breaker làm sau, xây trên nền timeout này. */
const REQUEST_TIMEOUT_MS = 10_000;

/** Header KHÔNG forward nguyên văn khi gửi đi — host/content-length/connection phải do chính
 * HTTP client (axios) tự tính lại cho request mới, forward y hệt bản gốc sẽ sai (vd Content-Length
 * cũ không khớp body đã re-serialize). */
const HOP_BY_HOP_REQUEST_HEADERS = new Set(["host", "connection", "content-length", "transfer-encoding"]);

/** Header KHÔNG copy nguyên văn từ response service đích về — connection-level, không phải
 * business data, và có thể sai lệch sau khi Node/axios đã tự xử lý (vd content-encoding nếu
 * axios tự giải nén gzip). `set-cookie` PHẢI giữ (đây chính là chỗ hay bug — thiếu dòng này thì
 * refresh token cookie của auth-service không bao giờ tới được browser qua gateway). */
const HOP_BY_HOP_RESPONSE_HEADERS = new Set(["connection", "transfer-encoding", "content-encoding"]);

/**
 * Forward 1 request HTTP nguyên vẹn (method/headers/body) sang service đích, rồi copy nguyên
 * response (status/headers/body) về — gateway không tự diễn giải/bọc lại response, service đích
 * đã trả đúng format cuối cùng (kể cả lỗi problem+json) rồi.
 */
@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly httpService: HttpService) {}

  async forward(req: Request, res: Response, targetBaseUrl: string): Promise<void> {
    // Tôn trọng X-Request-Id nếu client/hạ tầng trước gateway đã gắn sẵn (vd load balancer) —
    // chỉ tự sinh khi chưa có, để 1 request đi xuyên nhiều lớp vẫn cùng 1 id trong log.
    const requestId = (req.headers["x-request-id"] as string | undefined) ?? randomUUID();
    const targetUrl = `${targetBaseUrl}${req.originalUrl}`;
    const startedAt = Date.now();

    const forwardHeaders: Record<string, string> = { "x-request-id": requestId };
    for (const [key, value] of Object.entries(req.headers)) {
      if (HOP_BY_HOP_REQUEST_HEADERS.has(key) || value === undefined) continue;
      forwardHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: req.method,
          url: targetUrl,
          headers: forwardHeaders,
          data: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
          timeout: REQUEST_TIMEOUT_MS,
          // Coi MỌI status HTTP là "thành công" ở tầng axios — 401/404/409 từ service đích là
          // response hợp lệ cần forward nguyên trạng, không phải lỗi gateway. Chỉ lỗi mạng thật
          // (ECONNREFUSED, timeout...) mới rơi xuống catch bên dưới.
          validateStatus: () => true,
        }),
      );

      for (const [key, value] of Object.entries(response.headers)) {
        if (HOP_BY_HOP_RESPONSE_HEADERS.has(key) || value === undefined) continue;
        res.setHeader(key, value as string | string[]);
      }
      res.setHeader("x-request-id", requestId);

      this.logger.log(
        `${req.method} ${req.originalUrl} -> ${targetUrl} ${response.status} ${Date.now() - startedAt}ms [${requestId}]`,
      );
      res.status(response.status).send(response.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `${req.method} ${req.originalUrl} -> ${targetUrl} FAILED ${Date.now() - startedAt}ms [${requestId}]: ${message}`,
      );
      throw new ServiceUnavailableException({ detail: "Upstream service unavailable" });
    }
  }
}
