import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { OrderTrackingController } from "./order-tracking.controller";
import { OrderTrackingService } from "./order-tracking.service";
import { AdminModule } from "../admin/admin.module";
import { AppConfigModule } from "../common/config/config.module";
import { AppConfig } from "../common/config/app.config";

@Module({
  imports: [
    AdminModule,
    AppConfigModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        secret: config.jwt.secret,
        signOptions: { expiresIn: config.jwt.expiresIn },
      }),
    }),
  ],
  controllers: [OrderTrackingController],
  providers: [OrderTrackingService],
  exports: [OrderTrackingService],
})
export class OrderTrackingModule {}
