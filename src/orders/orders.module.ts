import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { EmailModule } from "../email/email.module";
import { OrderTrackingModule } from "../order-tracking/order-tracking.module";

@Module({
  imports: [EmailModule, OrderTrackingModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
