import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppConfig {
  constructor(private config: ConfigService) {}

  get server() {
    return {
      port: this.config.get<number>("PORT", 6000),
      env: this.config.get<string>("NODE_ENV", "development"),
      isDev: this.config.get<string>("NODE_ENV", "development") !== "production",
    };
  }

  get db() {
    return {
      type: this.config.get<string>("DB_TYPE", "sqlite"),
      sqlitePath: this.config.get<string>("SQLITE_PATH", "./src/db/techedge.db"),
      host: this.config.get<string>("DB_HOST", "localhost"),
      port: this.config.get<number>("DB_PORT", 5432),
      name: this.config.get<string>("DB_NAME", "techedge"),
      user: this.config.get<string>("DB_USER", "postgres"),
      password: this.config.get<string>("DB_PASSWORD", ""),
      mongoUri: this.config.get<string>("MONGO_URI", "mongodb://localhost:27017/techedge"),
    };
  }

  get jwt() {
    return {
      secret: this.config.get<string>("JWT_SECRET", "change_this_secret"),
      expiresIn: this.config.get<string>("JWT_EXPIRES_IN", "7d"),
      refreshSecret: this.config.get<string>("JWT_REFRESH_SECRET", "change_refresh_secret"),
      refreshExpiresIn: this.config.get<string>("JWT_REFRESH_EXPIRES_IN", "30d"),
    };
  }

  get cors() {
    const origins = this.config.get<string>("ALLOWED_ORIGINS", "http://localhost:3000");
    return { origins: origins.split(",") };
  }

  get rateLimit() {
    return {
      windowMs: this.config.get<number>("RATE_LIMIT_WINDOW_MS", 900000),
      max: this.config.get<number>("RATE_LIMIT_MAX", 100),
    };
  }

  get gst() {
    return {
      rate: this.config.get<number>("GST_RATE", 0.18),
      currency: this.config.get<string>("DEFAULT_CURRENCY", "INR"),
      gstin: this.config.get<string>("COMPANY_GSTIN", "36AABCT1234Z1Z5"),
    };
  }

  get email() {
    return {
      host: this.config.get<string>("EMAIL_HOST", "smtp.gmail.com"),
      port: this.config.get<number>("EMAIL_PORT", 587),
      secure: this.config.get<boolean>("EMAIL_SECURE", false),
      user: this.config.get<string>("EMAIL_USER", ""),
      pass: this.config.get<string>("EMAIL_PASS", ""),
      toAddress: this.config.get<string>("EMAIL_TO_ADDRESS", "techedgehelpdesk@gmail.com"),
    };
  }
}
