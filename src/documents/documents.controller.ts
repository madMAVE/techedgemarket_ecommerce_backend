import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { DocumentsService } from "./documents.service";
import { CookieJwtAuthGuard } from "../admin/admin-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/guards/roles.decorator";
import { CreateContactDto, CreateDocumentDto, UpdateContactDto, UpdateDocumentPayloadDto } from "./dto/document.dto";
import type { TokenPayload } from "../common/types";

interface AdminRequest extends Request {
  user?: TokenPayload;
}

@ApiTags("Documents")
@ApiCookieAuth("admin_session")
@ApiBearerAuth("jwt")
@Controller("admin")
@UseGuards(CookieJwtAuthGuard, RolesGuard)
@Roles("admin", "manager")
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post("documents")
  @ApiOperation({ summary: "Create a document (invoice/quotation/PO); auto-provisions customer and contacts" })
  @ApiBody({ type: CreateDocumentDto })
  @ApiResponse({ status: 201, description: "Document created" })
  @ApiResponse({ status: 409, description: "Order already has a document" })
  async create(@Req() req: AdminRequest, @Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto, req.user?.userId ?? "admin");
  }

  @Get("documents")
  @ApiOperation({ summary: "List documents with filters" })
  @ApiQuery({ name: "type", required: false, enum: ["INVOICE", "QUOTATION", "PURCHASE_ORDER"] })
  @ApiQuery({ name: "status", required: false, enum: ["DRAFT", "ISSUED", "CANCELLED"] })
  @ApiQuery({ name: "customerId", required: false })
  @ApiQuery({ name: "q", required: false, description: "Partial match on document number or party name" })
  @ApiQuery({ name: "from", required: false, description: "issueDate >= date (YYYY-MM-DD)" })
  @ApiQuery({ name: "to", required: false, description: "issueDate <= date (YYYY-MM-DD)" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  @ApiResponse({ status: 200, description: "Documents retrieved" })
  async findAll(
    @Query()
    query: {
      type?: string;
      status?: string;
      customerId?: string;
      q?: string;
      from?: string;
      to?: string;
      page?: string;
      limit?: string;
    },
  ) {
    return this.documentsService.findAll(query);
  }

  @Get("documents/from-order/:orderId")
  @ApiOperation({ summary: "Pre-fill invoice data from a website order (does not save)" })
  @ApiParam({ name: "orderId", example: "order-uuid-here" })
  @ApiResponse({ status: 200, description: "Pre-fill data returned" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async getFromOrder(@Param("orderId") orderId: string) {
    return this.documentsService.getFromOrder(orderId);
  }

  @Get("documents/:id")
  @ApiOperation({ summary: "Get a single document" })
  @ApiParam({ name: "id", example: "doc-uuid-here" })
  @ApiResponse({ status: 200, description: "Document found" })
  @ApiResponse({ status: 404, description: "Document not found" })
  async findOne(@Param("id") id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch("documents/:id")
  @ApiOperation({ summary: "Replace document payload (only while DRAFT)" })
  @ApiParam({ name: "id", example: "doc-uuid-here" })
  @ApiBody({ type: UpdateDocumentPayloadDto })
  @ApiResponse({ status: 200, description: "Document updated" })
  @ApiResponse({ status: 400, description: "Document is not editable" })
  async updateDraft(@Param("id") id: string, @Body() dto: UpdateDocumentPayloadDto) {
    return this.documentsService.updateDraft(id, dto.payload);
  }

  @Post("documents/:id/issue")
  @ApiOperation({ summary: "Issue a document (locks the payload)" })
  @ApiParam({ name: "id", example: "doc-uuid-here" })
  @ApiResponse({ status: 200, description: "Document issued" })
  async issue(@Param("id") id: string) {
    return this.documentsService.issue(id);
  }

  @Post("documents/:id/cancel")
  @ApiOperation({ summary: "Cancel a document" })
  @ApiParam({ name: "id", example: "doc-uuid-here" })
  @ApiResponse({ status: 200, description: "Document cancelled" })
  async cancel(@Param("id") id: string) {
    return this.documentsService.cancel(id);
  }

  @Get("customers")
  @ApiOperation({ summary: "List customer companies with active contacts" })
  @ApiResponse({ status: 200, description: "Customers retrieved" })
  async listCustomers() {
    return this.documentsService.listCustomers();
  }

  @Get("customers/:id/contacts")
  @ApiOperation({ summary: "List contacts of a customer" })
  @ApiParam({ name: "id", example: "customer-uuid-here" })
  @ApiResponse({ status: 200, description: "Contacts retrieved" })
  async listContacts(@Param("id") id: string) {
    return this.documentsService.listContacts(id);
  }

  @Post("customers/:id/contacts")
  @ApiOperation({ summary: "Add a contact person to a customer" })
  @ApiParam({ name: "id", example: "customer-uuid-here" })
  @ApiBody({ type: CreateContactDto })
  @ApiResponse({ status: 201, description: "Contact added" })
  async addContact(@Param("id") id: string, @Body() dto: CreateContactDto) {
    return this.documentsService.addContacts(id, dto);
  }

  @Patch("customers/:customerId/contacts/:contactId")
  @ApiOperation({ summary: "Update a contact (edit, set primary, restore)" })
  @ApiParam({ name: "customerId", example: "customer-uuid-here" })
  @ApiParam({ name: "contactId", example: "contact-uuid-here" })
  @ApiBody({ type: UpdateContactDto })
  @ApiResponse({ status: 200, description: "Contact updated" })
  async updateContact(
    @Param("customerId") customerId: string,
    @Param("contactId") contactId: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.documentsService.updateContact(customerId, contactId, dto);
  }

  @Delete("customers/:customerId/contacts/:contactId")
  @ApiOperation({ summary: "Soft-delete a contact" })
  @ApiParam({ name: "customerId", example: "customer-uuid-here" })
  @ApiParam({ name: "contactId", example: "contact-uuid-here" })
  @ApiResponse({ status: 200, description: "Contact deactivated" })
  async deleteContact(@Param("customerId") customerId: string, @Param("contactId") contactId: string) {
    return this.documentsService.deleteContact(customerId, contactId);
  }
}
