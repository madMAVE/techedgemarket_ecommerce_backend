import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public client: PrismaClient;
  public pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      // @ts-expect-error family is a valid net.Socket option
      family: 4,
    });
    const adapter = new PrismaPg(this.pool);
    this.client = new PrismaClient({ adapter });
    console.log(`[PrismaService] DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':***@')}`);
  }

  get user() {
    return this.client.user;
  }

  get admin() {
    return this.client.admin;
  }

  get brand() {
    return this.client.brand;
  }

  get keyword() {
    return this.client.keyword;
  }

  get product() {
    return this.client.product;
  }

  get order() {
    return this.client.order;
  }

  get orderItem() {
    return this.client.orderItem;
  }

  get inventory() {
    return this.client.inventory;
  }

  get procurementOrder() {
    return this.client.procurementOrder;
  }

  get prospect() {
    return this.client.prospect;
  }

  get serviceTicket() {
    return this.client.serviceTicket;
  }

  get refreshToken() {
    return this.client.refreshToken;
  }

  get country() {
    return this.client.country;
  }

  get state() {
    return this.client.state;
  }

  get city() {
    return this.client.city;
  }

  get $transaction() {
    return this.client.$transaction.bind(this.client);
  }

  get $queryRaw() {
    return this.client.$queryRaw.bind(this.client);
  }

  get $executeRaw() {
    return this.client.$executeRaw.bind(this.client);
  }

  async onModuleInit() {
    await this.client.$connect();
    const check = await this.client.$queryRaw`SELECT id, image, images FROM products WHERE id = 'e57cc003-e0eb-456f-8289-16348df656c3'`;
    console.log(`[PrismaService] On connect - product e57cc003: ${JSON.stringify(check)}`);
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
