import * as http from "node:http";

export type RecordedRequest = {
  method: string;
  url: string;
  headers: http.IncomingHttpHeaders;
  body: string;
};

export type FakeDownstreamService = {
  url: string;
  getLastRequest: () => RecordedRequest | null;
  setResponse: (status: number, body: unknown, headers?: Record<string, string | string[]>) => void;
  close: () => Promise<void>;
};

/**
 * Server giả đóng vai "service đích" (auth-service/trip-service/catalog-service/apps/api) —
 * ghi lại request gateway forward tới (method/url/headers/body) để assert, và trả response
 * tuỳ chỉnh được (kể cả header nhiều giá trị như `Set-Cookie`) để verify gateway copy đúng
 * response về browser, không chỉ status/body mà cả header.
 */
export async function startFakeDownstreamService(port: number): Promise<FakeDownstreamService> {
  let lastRequest: RecordedRequest | null = null;
  let responseStatus = 200;
  let responseBody: unknown = { data: { ok: true } };
  let responseHeaders: Record<string, string | string[]> = {};

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      lastRequest = {
        method: req.method ?? "",
        url: req.url ?? "",
        headers: req.headers,
        body: Buffer.concat(chunks).toString("utf-8"),
      };
      for (const [key, value] of Object.entries(responseHeaders)) {
        res.setHeader(key, value);
      }
      res.writeHead(responseStatus, { "Content-Type": "application/json" });
      res.end(JSON.stringify(responseBody));
    });
  });

  await new Promise<void>((resolve) => server.listen(port, resolve));

  return {
    url: `http://localhost:${port}`,
    getLastRequest: () => lastRequest,
    setResponse: (status, body, headers = {}) => {
      responseStatus = status;
      responseBody = body;
      responseHeaders = headers;
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
