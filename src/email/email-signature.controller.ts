import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { EmailSignatureService } from "./email-signature.service";
import { CookieJwtAuthGuard } from "../admin/admin-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/guards/roles.decorator";
import { CreateEmailSignatureDto, UpdateEmailSignatureDto } from "./dto/email-signature.dto";

@ApiTags("Email Signatures")
@ApiCookieAuth("admin_session")
@ApiBearerAuth("jwt")
@Controller("admin/email-signatures")
@UseGuards(CookieJwtAuthGuard, RolesGuard)
@Roles("admin", "manager")
export class EmailSignatureController {
  constructor(private signatureService: EmailSignatureService) {}

  @Get()
  @ApiOperation({ summary: "Get all email signatures" })
  @ApiResponse({ status: 200, description: "Signatures retrieved" })
  async findAll() {
    return this.signatureService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get email signature by ID" })
  @ApiParam({ name: "id", example: "uuid-here" })
  @ApiResponse({ status: 200, description: "Signature found" })
  @ApiResponse({ status: 404, description: "Not found" })
  async findOne(@Param("id") id: string) {
    return this.signatureService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new email signature" })
  @ApiBody({ type: CreateEmailSignatureDto })
  @ApiResponse({ status: 201, description: "Signature created" })
  async create(@Body() dto: CreateEmailSignatureDto) {
    return this.signatureService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an email signature" })
  @ApiParam({ name: "id", example: "uuid-here" })
  @ApiBody({ type: UpdateEmailSignatureDto })
  @ApiResponse({ status: 200, description: "Signature updated" })
  @ApiResponse({ status: 404, description: "Not found" })
  async update(@Param("id") id: string, @Body() dto: UpdateEmailSignatureDto) {
    return this.signatureService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an email signature (hard delete)" })
  @ApiParam({ name: "id", example: "uuid-here" })
  @ApiResponse({ status: 200, description: "Signature deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  async remove(@Param("id") id: string) {
    return this.signatureService.remove(id);
  }
}
