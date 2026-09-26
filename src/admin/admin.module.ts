import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminAuthController } from "./admin-auth.controller";
import { AdminAuthService } from "./admin-auth.service";
import { CookieJwtAuthGuard } from "./admin-auth.guard";
import { AppConfigModule } from "../common/config/config.module";
import { AppConfig } from "../common/config/app.config";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [
    AppConfigModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        secret: config.jwt.secret,
        signOptions: { expiresIn: config.jwt.expiresIn },
      }),
    }),
  ],
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService, AdminAuthService, CookieJwtAuthGuard],
  exports: [CookieJwtAuthGuard],
})
export class AdminModule {}
