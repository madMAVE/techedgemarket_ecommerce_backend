import { Controller, Get, Post, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OrderTrackingService } from "./order-tracking.service";
import { CookieJwtAuthGuard } from "../admin/admin-auth.guard";
import { UpdateOrderTrackingStatusDto } from "../common/dto/order.dto";

@ApiTags("Order Tracking")
@ApiBearerAuth("admin-jwt")
@Controller("order-tracking")
export class OrderTrackingController {
  constructor(private orderTrackingService: OrderTrackingService) {}

  @Get("order/:orderId")
  @ApiOperation({ summary: "Get tracking history for an order" })
  @ApiParam({ name: "orderId", example: "order-uuid-here" })
  @ApiResponse({ status: 200, description: "Tracking history retrieved successfully" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async getTrackingByOrderId(@Param("orderId") orderId: string) {
    return this.orderTrackingService.getTrackingByOrderId(orderId);
  }

  @Post(":orderId")
  @UseGuards(CookieJwtAuthGuard)
  @ApiOperation({ summary: "Create tracking entry for an order (admin only)" })
  @ApiParam({ name: "orderId", example: "order-uuid-here" })
  @ApiBody({ type: UpdateOrderTrackingStatusDto })
  @ApiResponse({ status: 201, description: "Order tracking entry created" })
  @ApiResponse({ status: 400, description: "Invalid status" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createTrackingEntry(
    @Param("orderId") orderId: string,
    @Body() dto: UpdateOrderTrackingStatusDto,
  ) {
    return this.orderTrackingService.createTrackingEntry(
      orderId,
      dto.status as any,
      dto.message ?? "",
      dto.location ?? [],
    );
  }

  @Patch(":trackingId")
  @UseGuards(CookieJwtAuthGuard)
  @ApiOperation({ summary: "Update order tracking status (admin only)" })
  @ApiParam({ name: "trackingId", example: "tracking-uuid-here" })
  @ApiBody({ type: UpdateOrderTrackingStatusDto })
  @ApiResponse({ status: 200, description: "Order tracking status updated" })
  @ApiResponse({ status: 400, description: "Invalid status" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Tracking entry not found" })
  async updateTrackingStatus(
    @Param("trackingId") trackingId: string,
    @Body() dto: UpdateOrderTrackingStatusDto,
  ) {
    return this.orderTrackingService.updateTrackingStatus(trackingId, dto);
  }
}
