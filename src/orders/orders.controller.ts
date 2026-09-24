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
import { CreateOrderDto, UpdateOrderStatusDto, SendOtpDto, VerifyOtpDto, GetOrdersByMobileDto } from "../common/dto/order.dto";
import { Request } from "express";
import type { TokenPayload } from "../common/types";

interface AuthRequest extends Request {
  user?: TokenPayload;
}

@ApiTags("Orders")
@ApiBearerAuth("jwt")
@Controller("orders")
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post("otp/send")
  @ApiOperation({ summary: "Send OTP to mobile number" })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ status: 200, description: "OTP sent successfully" })
  @ApiResponse({ status: 400, description: "Invalid mobile number" })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.ordersService.sendOtp(dto.mobile);
  }

  @Post("otp/verify")
  @ApiOperation({ summary: "Verify OTP and get verification token" })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: "OTP verified, token returned" })
  @ApiResponse({ status: 400, description: "Invalid or expired OTP" })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.ordersService.verifyOtp(dto.mobile, dto.otp);
  }

  @Post("by-mobile")
  @ApiOperation({ summary: "Get orders by mobile number with OTP verification" })
  @ApiBody({ type: GetOrdersByMobileDto })
  @ApiResponse({ status: 200, description: "Orders retrieved successfully" })
  @ApiResponse({ status: 400, description: "Invalid mobile number or OTP not verified" })
  async findByMobile(@Body() dto: GetOrdersByMobileDto) {
    return this.ordersService.findByMobile(dto.mobile, dto.otp);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
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
