import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { UpdateOrderTrackingStatusDto } from "../common/dto/order.dto";
import type { OrderTrackingStatus } from "../common/types";

@Injectable()
export class OrderTrackingService {
  constructor(private prisma: PrismaService) {}

  async createInitialTracking(orderId: string) {
    return this.prisma.orderTracking.create({
      data: {
        orderId,
        status: "purchased",
        location: [],
        message: "Order has been placed successfully",
      },
    });
  }

  async getTrackingByOrderId(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const tracking = await this.prisma.orderTracking.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });

    return tracking;
  }

  async updateTrackingStatus(trackingId: string, dto: UpdateOrderTrackingStatusDto) {
    const validStatuses: OrderTrackingStatus[] = ["purchased", "dispatched", "on_the_way", "delivered"];
    if (!validStatuses.includes(dto.status as OrderTrackingStatus)) {
      throw new BadRequestException(`Invalid status: ${dto.status}`);
    }

    const tracking = await this.prisma.orderTracking.findUnique({ where: { id: trackingId } });
    if (!tracking) {
      throw new NotFoundException(`Order tracking with ID ${trackingId} not found`);
    }

    return this.prisma.orderTracking.update({
      where: { id: trackingId },
      data: {
        status: dto.status as OrderTrackingStatus,
        message: dto.message ?? tracking.message,
        location: dto.location ?? tracking.location,
      },
    });
  }
}
