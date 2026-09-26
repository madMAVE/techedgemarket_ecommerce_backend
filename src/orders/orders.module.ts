import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { EmailModule } from "../email/email.module";
import { AppConfigModule } from "../common/config/config.module";
import { AppConfig } from "../common/config/app.config";

@Module({
  imports: [
    EmailModule,
    AppConfigModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        secret: config.jwt.secret,
        signOptions: { expiresIn: "1h" },
      }),
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
