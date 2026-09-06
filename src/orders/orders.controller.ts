import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/guards/roles.decorator";
import { CreateOrderDto, UpdateOrderStatusDto } from "../common/dto/order.dto";
import { Request } from "express";
import type { TokenPayload } from "../common/types";

interface AuthRequest extends Request {
  user?: TokenPayload;
}

@ApiTags("Orders")
@ApiBearerAuth("jwt")
@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: "List orders (customers see own, admin/manager see all)" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  @ApiQuery({ name: "status", required: false, enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"] })
  @ApiResponse({ status: 200, description: "Orders retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(@Req() req: AuthRequest, @Query() query: { page?: string; limit?: string; status?: string }) {
    return this.ordersService.findAll(req.user!.userId, req.user!.role, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single order by ID" })
  @ApiParam({ name: "id", example: "order-uuid-here" })
  @ApiResponse({ status: 200, description: "Order found" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async findOne(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.ordersService.findOne(id, req.user!.userId, req.user!.role);
  }

  @Post()
  @ApiOperation({ summary: "Create a new order" })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input or insufficient stock" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(@Req() req: AuthRequest, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto, req.user!);
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles("admin", "manager")
  @ApiOperation({ summary: "Update order status (admin/manager only)" })
  @ApiParam({ name: "id", example: "order-uuid-here" })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({ status: 200, description: "Order status updated" })
  @ApiResponse({ status: 400, description: "Invalid status transition" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async updateStatus(@Param("id") id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
