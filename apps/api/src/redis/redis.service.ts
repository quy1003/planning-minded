import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createClient, type RedisClientType } from "redis";
import { ConfigService } from "../config/config.service";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  readonly client: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    this.client = createClient({ url: this.configService.redisUrl });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
