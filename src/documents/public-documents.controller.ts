import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DocumentsService } from "./documents.service";

@ApiTags("Documents (public)")
@Controller("public/documents")
export class PublicDocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get(":token")
  @ApiOperation({ summary: "View a document payload by public token (QR target, no auth)" })
  @ApiParam({ name: "token", example: "cuid-token-from-document" })
  @ApiResponse({ status: 200, description: "Document data" })
  @ApiResponse({ status: 404, description: "Document not found" })
  async findByToken(@Param("token") token: string) {
    return this.documentsService.findByPublicToken(token);
  }
}
