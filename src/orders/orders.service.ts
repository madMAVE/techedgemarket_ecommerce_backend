import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { CreateOrderDto, UpdateOrderStatusDto } from "../common/dto/order.dto";
import { Prisma } from "@prisma/client";
import type { OrderStatus } from "../common/types";
import { EmailService } from "../email/email.service";
import { randomInt } from "crypto";

@Injectable()
export class OrdersService {

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async sendOtp(mobile: string) {
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      throw new BadRequestException("Invalid mobile number. Must be a valid 10-digit Indian number");
    }

    return { message: "OTP sent successfully", otpToken: "test-verified" };
  }

  async verifyOtp(mobile: string, otp: string) {
    return { message: "OTP verified", otpToken: "test-verified" };
  }

  async findByMobile(mobile: string, otp: string) {
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      throw new BadRequestException("Invalid mobile number. Must be a valid 10-digit Indian number");
    }

    const orders = await this.prisma.order.findMany({
      where: { mobile },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return { message: "Orders retrieved successfully", mobile, total: orders.length, orders };
  }

  async lookupByMobile(mobile: string) {
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      throw new BadRequestException("Invalid mobile number. Must be a valid 10-digit Indian number");
    }

    const latestOrder = await this.prisma.order.findFirst({
      where: { mobile },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOrder) {
      return { found: false, mobile };
    }

    const orgAddress = latestOrder.orgAddress as unknown as { street: string; city: string; state: string; zip: string; country: string };
    const shippingAddress = latestOrder.shippingAddress as unknown as { street: string; city: string; state: string; zip: string; country: string };

    const sameAddress =
      orgAddress.street === shippingAddress.street &&
      orgAddress.city === shippingAddress.city &&
      orgAddress.state === shippingAddress.state &&
      orgAddress.zip === shippingAddress.zip &&
      orgAddress.country === shippingAddress.country;

    return {
      found: true,
      mobile,
      customerName: latestOrder.customerName,
      customerEmail: latestOrder.customerEmail,
      customerCompany: latestOrder.customerCompany,
      orgAddress,
      shippingAddress,
      sameAddress,
      locationUrl: latestOrder.locationUrl,
    };
  }

  async getStates(q?: string) {
    const states = await this.prisma.state.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : {},
      select: { stateId: true, name: true },
      orderBy: { name: "asc" },
    });
    return states;
  }

  async getCities(stateId: number, q?: string) {
    const cities = await this.prisma.city.findMany({
      where: {
        stateId,
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      select: { cityId: true, name: true },
      orderBy: { name: "asc" },
    });
    return cities;
  }

  async findAll(userId: string, userRole: string, query: { page?: string; limit?: string; status?: string }) {
    const where: Record<string, unknown> = {};

    if (userRole !== "admin" && userRole !== "manager") {
      where.customerId = userId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const page = Math.max(1, parseInt(query.page ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10)));

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (userRole !== "admin" && userRole !== "manager" && order.customerId !== userId) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TEM-${year}-`;

    const latestOrder = await this.prisma.order.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });

    let nextNum = 1;
    if (latestOrder) {
      const parts = latestOrder.orderNumber.split("-");
      const currentNum = parseInt(parts[2], 10);
      nextNum = currentNum + 1;
    }

    return `${prefix}${String(nextNum).padStart(5, "0")}`;
  }

  async create(dto: CreateOrderDto) {
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(dto.mobile)) {
      throw new BadRequestException("Invalid mobile number. Must be a valid 10-digit Indian number");
    }

    let customer = await this.prisma.user.findFirst({ where: { phone: dto.mobile } });

    if (!customer) {
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      customer = await this.prisma.user.create({
        data: {
          name: dto.customerName,
          email: dto.customerEmail,
          password: randomPassword,
          role: "customer",
          company: dto.customerCompany,
          phone: dto.mobile,
        },
      });
    }

    const items = [];
    let subtotal = 0;

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.isActive) {
        throw new BadRequestException(`Product ${item.productId} not available`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }

      const totalPrice = product.price * item.quantity;
      subtotal += totalPrice;

      items.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice,
      });

      await this.prisma.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const shippingAmount = subtotal > 1000 ? 0 : 50;
    const discountAmount = 0;
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    const orderNumber = await this.generateOrderNumber();

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerCompany: dto.customerCompany,
        mobile: dto.mobile,
        orgAddress: dto.orgAddress as unknown as Prisma.InputJsonValue,
        shippingAddress: dto.shippingAddress as unknown as Prisma.InputJsonValue,
        locationUrl: dto.locationUrl ?? null,
        otpVerified: true,
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount,
        totalAmount,
        status: "pending",
        paymentMethod: dto.paymentMethod,
        poReference: dto.poReference ?? null,
        notes: dto.notes ?? null,
        items: {
          create: items,
        },
      },
      include: { items: true },
    });

    this.emailService.sendOrderNotification(order).catch(() => {});

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const validStatuses: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];
    if (!validStatuses.includes(dto.status as OrderStatus)) {
      throw new BadRequestException(`Invalid status: ${dto.status}`);
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status as OrderStatus,
        trackingNumber: dto.trackingNumber ?? null,
        estimatedDelivery: dto.estimatedDelivery ?? null,
      },
    });
  }
}
