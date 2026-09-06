import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import type { ProcurementStatus, ServiceStatus, ServicePriority } from "../common/types";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getInventory() {
    return this.prisma.inventory.findMany();
  }

  async getLowStock() {
    return this.prisma.inventory.findMany({
      where: { status: { not: "in_stock" } },
    });
  }

  async updateInventory(id: string, data: { currentStock?: number; reorderPoint?: number; maxStock?: number; location?: string; supplier?: string }) {
    try {
      return await this.prisma.inventory.update({
        where: { id },
        data,
      });
    } catch {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
  }

  async getProcurement() {
    return this.prisma.procurementOrder.findMany();
  }

  async getProcurementById(id: string) {
    const item = await this.prisma.procurementOrder.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Procurement order with ID ${id} not found`);
    }
    return item;
  }

  async createProcurement(dto: {
    supplierId: string;
    supplierName: string;
    items: { productId: string; productName: string; sku: string; quantity: number; unitCost: number }[];
    currency: string;
    requestedBy: string;
    notes?: string;
  }) {
    const totalAmount = dto.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const poNumber = `PO-${Date.now()}`;

    return this.prisma.procurementOrder.create({
      data: {
        poNumber,
        supplierId: dto.supplierId,
        supplierName: dto.supplierName,
        items: dto.items.map(item => ({
          ...item,
          totalCost: item.quantity * item.unitCost,
        })),
        status: "draft",
        totalAmount,
        currency: dto.currency,
        requestedBy: dto.requestedBy,
        notes: dto.notes ?? null,
      },
    });
  }

  async updateProcurementStatus(id: string, status: string) {
    const validStatuses: ProcurementStatus[] = ["draft", "submitted", "approved", "ordered", "received", "cancelled"];
    if (!validStatuses.includes(status as ProcurementStatus)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    try {
      return await this.prisma.procurementOrder.update({
        where: { id },
        data: { status: status as ProcurementStatus },
      });
    } catch {
      throw new NotFoundException(`Procurement order with ID ${id} not found`);
    }
  }

  async getProspects() {
    return this.prisma.prospect.findMany();
  }

  async getProspectById(id: string) {
    const item = await this.prisma.prospect.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Prospect with ID ${id} not found`);
    }
    return item;
  }

  async createProspect(dto: {
    name: string;
    company: string;
    email: string;
    phone: string;
    industry: string;
    source: string;
    value: number;
    probability: number;
    assignedTo: string;
    requirements?: string;
    notes?: string;
    tags?: string[];
  }) {
    return this.prisma.prospect.create({
      data: {
        ...dto,
        status: "new",
        tags: dto.tags ?? [],
      },
    });
  }

  async updateProspect(id: string, dto: Record<string, unknown>) {
    try {
      return await this.prisma.prospect.update({
        where: { id },
        data: dto,
      });
    } catch {
      throw new NotFoundException(`Prospect with ID ${id} not found`);
    }
  }

  async deleteProspect(id: string) {
    try {
      await this.prisma.prospect.delete({ where: { id } });
      return { message: "Prospect deleted" };
    } catch {
      throw new NotFoundException(`Prospect with ID ${id} not found`);
    }
  }

  async getTickets() {
    return this.prisma.serviceTicket.findMany();
  }

  async getTicketById(id: string) {
    const item = await this.prisma.serviceTicket.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    return item;
  }

  async createTicket(dto: {
    title: string;
    description: string;
    priority: string;
    category: string;
    customerId: string;
    customerName: string;
    company: string;
    estimatedHours: number;
    assignedTo?: string;
  }) {
    const ticketNumber = `TK-${Date.now()}`;
    return this.prisma.serviceTicket.create({
      data: {
        ticketNumber,
        title: dto.title,
        description: dto.description,
        status: "open",
        priority: dto.priority as ServicePriority,
        category: dto.category,
        customerId: dto.customerId,
        customerName: dto.customerName,
        company: dto.company,
        assignedTo: dto.assignedTo ?? null,
        estimatedHours: dto.estimatedHours,
      },
    });
  }

  async updateTicket(id: string, dto: Record<string, unknown>) {
    try {
      return await this.prisma.serviceTicket.update({
        where: { id },
        data: dto,
      });
    } catch {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
  }

  async getAnalytics() {
    const [products, orders, inventory, prospects, tickets] = await Promise.all([
      this.prisma.product.findMany(),
      this.prisma.order.findMany(),
      this.prisma.inventory.findMany(),
      this.prisma.prospect.findMany(),
      this.prisma.serviceTicket.findMany(),
    ]);

    const totalRevenue = orders.reduce((sum: number, o: { totalAmount: number }) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const lowStockCount = inventory.filter((i: { status: string }) => i.status !== "in_stock").length;
    const pendingTickets = tickets.filter((t: { status: string }) => t.status === "open" || t.status === "in_progress").length;
    const qualifiedProspects = prospects.filter((p: { status: string }) => p.status === "qualified" || p.status === "proposal" || p.status === "negotiation").length;

    return {
      revenue: { total: totalRevenue, currency: "INR" },
      orders: { total: totalOrders, avgValue: avgOrderValue },
      inventory: { total: inventory.length, lowStock: lowStockCount },
      prospects: { total: prospects.length, qualified: qualifiedProspects },
      tickets: { total: tickets.length, pending: pendingTickets },
      products: { total: products.length, active: products.filter((p: { isActive: boolean }) => p.isActive).length },
    };
  }
}
