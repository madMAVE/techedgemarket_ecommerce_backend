import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConsoleLogger, ValidationPipe } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { AppConfig } from "./common/config/app.config";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";

class QuietLogger extends ConsoleLogger {
  override log(message: string, context?: string) {
    if (message.includes("Mapped ")) return;
    super.log(message, context);
  }
}

function formatUptime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new QuietLogger(),
  });

  const config = app.get(AppConfig);
  const startTime = Date.now();

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(
    cors({
      origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return cb(null, true);
        if (config.cors.origins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: Origin ${origin} not allowed`));
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-request-time"],
      exposedHeaders: ["Set-Cookie"],
      credentials: true,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.setGlobalPrefix("api");

  const swaggerConfig = new DocumentBuilder()
    .setTitle("TechEdge Market API")
    .setDescription("TechEdge Market — REST API Documentation")
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "jwt")
    .addCookieAuth("admin_session", { type: "apiKey", in: "cookie", name: "admin_session" }, "cookie")
    .addTag("Authentication", "Customer auth: register, login, refresh, profile")
    .addTag("Products", "Product catalog: CRUD, search, filters")
    .addTag("Orders", "Order management: create, list, update status")
    .addTag("Admin Auth", "Admin panel authentication")
    .addTag("Admin", "Admin operations: inventory, procurement, prospects, tickets, analytics")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    deepScanRoutes: true,
  });
  SwaggerModule.setup("docs", app, document, {
    useGlobalPrefix: true,
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  });

  app.enableShutdownHooks();

  await app.listen(config.server.port, () => {
    console.log("\n╔══════════════════════════════════════════════╗");
    console.log("║   TechEdge Market API — Server Started       ║");
    console.log("╠══════════════════════════════════════════════╣");
    console.log(`║  Port   : ${config.server.port}                               ║`);
    console.log(`║  Env    : ${config.server.env}                        ║`);
    console.log(`║  URL    : http://localhost:${config.server.port}/api          ║`);
    console.log(`║  Health : http://localhost:${config.server.port}/health       ║`);
    console.log(`║  Swagger: http://localhost:${config.server.port}/api/docs     ║`);
    console.log("╚══════════════════════════════════════════════╝\n");
    console.log("  Endpoints:");
    console.log("  POST /api/auth/register");
    console.log("  POST /api/auth/login");
    console.log("  GET  /api/products");
    console.log("  GET  /api/orders        [auth required]");
    console.log("  GET  /api/analytics     [admin only]\n");

    setInterval(() => {
      process.stdout.write(`\r\x1b[36m⏱ Server running for: ${formatUptime(Date.now() - startTime)}\x1b[0m`);
    }, 1000);
  });
}

bootstrap();
