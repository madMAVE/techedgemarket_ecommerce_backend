import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { CookieJwtAuthGuard } from "./admin-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/guards/roles.decorator";

@ApiTags("Admin")
@ApiCookieAuth("admin_session")
@ApiBearerAuth("jwt")
@Controller()
@UseGuards(CookieJwtAuthGuard, RolesGuard)
@Roles("admin", "manager")
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get("inventory")
  @ApiOperation({ summary: "Get all inventory items" })
  @ApiResponse({ status: 200, description: "Inventory list retrieved" })
  async getInventory() {
    return this.adminService.getInventory();
  }

  @Get("inventory/low-stock")
  @ApiOperation({ summary: "Get low stock inventory items" })
  @ApiResponse({ status: 200, description: "Low stock items retrieved" })
  async getLowStock() {
    return this.adminService.getLowStock();
  }

  @Patch("inventory/:id")
  @ApiOperation({ summary: "Update inventory item" })
  @ApiParam({ name: "id", example: "inv-uuid-here" })
  @ApiBody({ schema: { example: { currentStock: 100, reorderPoint: 20 } } })
  @ApiResponse({ status: 200, description: "Inventory updated" })
  @ApiResponse({ status: 404, description: "Inventory item not found" })
  async updateInventory(@Param("id") id: string, @Body() data: Record<string, unknown>) {
    return this.adminService.updateInventory(id, data);
  }

  @Get("procurement")
  @ApiOperation({ summary: "Get all procurement orders" })
  @ApiResponse({ status: 200, description: "Procurement orders retrieved" })
  async getProcurement() {
    return this.adminService.getProcurement();
  }

  @Get("procurement/:id")
  @ApiOperation({ summary: "Get procurement order by ID" })
  @ApiParam({ name: "id", example: "po-uuid-here" })
  @ApiResponse({ status: 200, description: "Procurement order found" })
  @ApiResponse({ status: 404, description: "Not found" })
  async getProcurementById(@Param("id") id: string) {
    return this.adminService.getProcurementById(id);
  }

  @Post("procurement")
  @ApiOperation({ summary: "Create a new procurement order" })
  @ApiBody({
    schema: {
      example: {
        supplierId: "sup-uuid",
        supplierName: "Supplier Corp",
        items: [{ productId: "prod-uuid", productName: "Widget", sku: "WGT-001", quantity: 50, unitCost: 100 }],
        currency: "INR",
        requestedBy: "John Doe",
        notes: "Urgent requirement",
      },
    },
  })
  @ApiResponse({ status: 201, description: "Procurement order created" })
  async createProcurement(@Body() dto: {
    supplierId: string;
    supplierName: string;
    items: { productId: string; productName: string; sku: string; quantity: number; unitCost: number }[];
    currency: string;
    requestedBy: string;
    notes?: string;
  }) {
    return this.adminService.createProcurement(dto);
  }

  @Patch("procurement/:id/status")
  @ApiOperation({ summary: "Update procurement order status" })
  @ApiParam({ name: "id", example: "po-uuid-here" })
  @ApiBody({ schema: { example: { status: "approved" } } })
  @ApiResponse({ status: 200, description: "Status updated" })
  async updateProcurementStatus(@Param("id") id: string, @Body() body: { status: string }) {
    return this.adminService.updateProcurementStatus(id, body.status);
  }

  @Get("prospects")
  @ApiOperation({ summary: "Get all sales prospects" })
  @ApiResponse({ status: 200, description: "Prospects retrieved" })
  async getProspects() {
    return this.adminService.getProspects();
  }

  @Get("prospects/:id")
  @ApiOperation({ summary: "Get prospect by ID" })
  @ApiParam({ name: "id", example: "prospect-uuid" })
  @ApiResponse({ status: 200, description: "Prospect found" })
  @ApiResponse({ status: 404, description: "Not found" })
  async getProspectById(@Param("id") id: string) {
    return this.adminService.getProspectById(id);
  }

  @Post("prospects")
  @ApiOperation({ summary: "Create a new sales prospect" })
  @ApiBody({
    schema: {
      example: {
        name: "Jane Smith",
        company: "Acme Industries",
        email: "jane@acme.com",
        phone: "+91 9876543210",
        industry: "Manufacturing",
        source: "Website",
        value: 500000,
        probability: 60,
        assignedTo: "Sales Rep",
        requirements: "Need 100 PLC units",
        tags: ["hot-lead", "q4-target"],
      },
    },
  })
  @ApiResponse({ status: 201, description: "Prospect created" })
  async createProspect(@Body() dto: {
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
    return this.adminService.createProspect(dto);
  }

  @Patch("prospects/:id")
  @ApiOperation({ summary: "Update a prospect" })
  @ApiParam({ name: "id", example: "prospect-uuid" })
  @ApiResponse({ status: 200, description: "Prospect updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  async updateProspect(@Param("id") id: string, @Body() dto: Record<string, unknown>) {
    return this.adminService.updateProspect(id, dto);
  }

  @Delete("prospects/:id")
  @ApiOperation({ summary: "Delete a prospect" })
  @ApiParam({ name: "id", example: "prospect-uuid" })
  @ApiResponse({ status: 200, description: "Prospect deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  async deleteProspect(@Param("id") id: string) {
    return this.adminService.deleteProspect(id);
  }

  @Get("tickets")
  @ApiOperation({ summary: "Get all service tickets" })
  @ApiResponse({ status: 200, description: "Tickets retrieved" })
  async getTickets() {
    return this.adminService.getTickets();
  }

  @Get("tickets/:id")
  @ApiOperation({ summary: "Get ticket by ID" })
  @ApiParam({ name: "id", example: "ticket-uuid" })
  @ApiResponse({ status: 200, description: "Ticket found" })
  @ApiResponse({ status: 404, description: "Not found" })
  async getTicketById(@Param("id") id: string) {
    return this.adminService.getTicketById(id);
  }

  @Post("tickets")
  @ApiOperation({ summary: "Create a new service ticket" })
  @ApiBody({
    schema: {
      example: {
        title: "PLC not responding",
        description: "S7-1200 PLC stopped communicating after firmware update",
        priority: "high",
        category: "technical-support",
        customerId: "cust-uuid",
        customerName: "John Doe",
        company: "Acme Corp",
        estimatedHours: 4,
        assignedTo: "Tech Team",
      },
    },
  })
  @ApiResponse({ status: 201, description: "Ticket created" })
  async createTicket(@Body() dto: {
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
    return this.adminService.createTicket(dto);
  }

  @Patch("tickets/:id")
  @ApiOperation({ summary: "Update a service ticket" })
  @ApiParam({ name: "id", example: "ticket-uuid" })
  @ApiResponse({ status: 200, description: "Ticket updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  async updateTicket(@Param("id") id: string, @Body() dto: Record<string, unknown>) {
    return this.adminService.updateTicket(id, dto);
  }

  @Get("analytics")
  @ApiOperation({ summary: "Get dashboard analytics & stats" })
  @ApiResponse({ status: 200, description: "Analytics data retrieved" })
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }
}
