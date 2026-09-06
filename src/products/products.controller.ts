import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from "@nestjs/common";
import { FilesInterceptor, FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/guards/roles.decorator";
import { CreateProductDto, UpdateProductDto, BulkProductDto } from "../common/dto/product.dto";

@ApiTags("Products")
@Controller("products")
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get("brands")
  @ApiOperation({ summary: "List all brands" })
  @ApiResponse({ status: 200, description: "Brands retrieved successfully" })
  async findAllBrands() {
    return this.productsService.findAllBrands();
  }

  @Put("brands/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager")
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Update a brand (admin/manager only)" })
  @ApiParam({ name: "id", example: "brand-uuid-here" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "Siemens" },
        description: { type: "string", example: "Global leader in automation" },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Brand updated successfully" })
  @ApiResponse({ status: 404, description: "Brand not found" })
  async updateBrand(@Param("id") id: string, @Body() dto: { name?: string; description?: string }) {
    return this.productsService.updateBrand(id, dto);
  }

  @Post("brands/:id/logo")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager")
  @ApiBearerAuth("jwt")
  @UseInterceptors(
    FileInterceptor("logo", {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|gif)$/)) {
          cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: "Upload logo for a brand (admin/manager only)" })
  @ApiParam({ name: "id", example: "brand-uuid-here" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["logo"],
      properties: {
        logo: { type: "string", format: "binary", description: "Brand logo image (JPEG, PNG, WebP, GIF) - max 5MB" },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Logo uploaded successfully" })
  @ApiResponse({ status: 404, description: "Brand not found" })
  async uploadBrandLogo(@Param("id") id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error("No logo provided");
    }
    return this.productsService.uploadBrandLogo(id, file);
  }

  @Delete("brands/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Delete a brand (admin only)" })
  @ApiParam({ name: "id", example: "brand-uuid-here" })
  @ApiResponse({ status: 200, description: "Brand deleted successfully" })
  @ApiResponse({ status: 404, description: "Brand not found" })
  async deleteBrand(@Param("id") id: string) {
    return this.productsService.deleteBrand(id);
  }

  @Get()
  @ApiOperation({ summary: "List all products with pagination, keyword filter & category/brand filters" })
  @ApiQuery({ name: "page", required: false, example: 1, description: "Page number (default: 1)" })
  @ApiQuery({ name: "limit", required: false, example: 20, description: "Items per page (default: 20, max: 100)" })
  @ApiQuery({ name: "keyword", required: false, description: "Filter products by keyword (increments keyword score)" })
  @ApiQuery({ name: "sort", required: false, example: "createdAt", description: "Sort field (default: createdAt)" })
  @ApiQuery({ name: "order", required: false, enum: ["asc", "desc"], description: "Sort order (default: asc)" })
  @ApiQuery({ name: "category", required: false, description: "Filter by category" })
  @ApiQuery({ name: "brand", required: false, description: "Filter by brand name" })
  @ApiResponse({ status: 200, description: "Products retrieved successfully" })
  async findAll(@Query() query: { page?: string; limit?: string; keyword?: string; sort?: string; order?: string; category?: string; brand?: string }) {
    return this.productsService.findAll(query);
  }

  @Get("keywords/suggest")
  @ApiOperation({ summary: "Autocomplete: get keyword suggestions by partial match" })
  @ApiQuery({ name: "q", required: true, example: "plc", description: "Partial keyword to search" })
  @ApiQuery({ name: "limit", required: false, example: 10, description: "Max suggestions (default: 10)" })
  @ApiResponse({ status: 200, description: "Keyword suggestions returned" })
  async suggestKeywords(@Query("q") q: string, @Query("limit") limit?: string) {
    return this.productsService.suggestKeywords(q, limit);
  }

  @Get("sku/:sku")
  @ApiOperation({ summary: "Get a product by SKU" })
  @ApiParam({ name: "sku", example: "SIE-AUT-S71200" })
  @ApiResponse({ status: 200, description: "Product found" })
  @ApiResponse({ status: 404, description: "Product not found" })
  async findBySku(@Param("sku") sku: string) {
    return this.productsService.findBySku(sku);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a product by ID" })
  @ApiParam({ name: "id", example: "prod-uuid-here" })
  @ApiResponse({ status: 200, description: "Product found" })
  @ApiResponse({ status: 404, description: "Product not found" })
  async findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager")
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Create a new product (admin/manager only)" })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: "Product created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - insufficient role" })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Post("bulk")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager")
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Bulk upload products without images (admin/manager only)" })
  @ApiBody({
    type: BulkProductDto,
    examples: {
      single: {
        summary: "Single product in bulk format",
        value: {
          products: [
            {
              name: "Siemens PLC S7-1200",
              description: "Compact CPU for automation tasks",
              price: 12500,
              category: "Automation",
              brandId: "brand-uuid-here",
              model: "S7-1200",
              partNumber: "6ES7211-1AE40-0XB0",
              stock: 50,
            },
          ],
        },
      },
      multiple: {
        summary: "Multiple products",
        value: {
          products: [
            {
              name: "Siemens PLC S7-1200",
              description: "Compact CPU for automation tasks",
              price: 12500,
              category: "Automation",
              brandId: "brand-uuid-here",
              model: "S7-1200",
              partNumber: "6ES7211-1AE40-0XB0",
              stock: 50,
            },
            {
              name: "ABB Contactor A9",
              description: "3-pole contactor 9A",
              price: 1500,
              category: "Switchgear",
              brandId: "brand-uuid-here",
              model: "A9",
              partNumber: "1SBL12345",
              stock: 200,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: "Bulk products created. Returns success & error counts." })
  @ApiResponse({ status: 400, description: "Invalid input or empty list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async bulkCreate(@Body() dto: BulkProductDto) {
    return this.productsService.bulkCreate(dto.products);
  }

  @Post(":id/images")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager")
  @UseInterceptors(
    FilesInterceptor("images", 10, {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|gif)$/)) {
          cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Upload images for a product (max 10 files, 5MB each)" })
  @ApiParam({ name: "id", example: "prod-uuid-here" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["images"],
      properties: {
        images: {
          type: "array",
          items: { type: "string", format: "binary" },
          description: "Product images (JPEG, PNG, WebP, GIF) - max 10 files, 5MB each",
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: "Images uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid file type or size" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Product not found" })
  async uploadImages(@Param("id") id: string, @UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new Error("No images provided");
    }
    return this.productsService.uploadImages(id, files);
  }

  @Delete(":id/images/:imageUrl")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager")
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Delete a product image (removes from Supabase if it exists, always removes from DB)" })
  @ApiParam({ name: "id", example: "prod-uuid-here" })
  @ApiParam({ name: "imageUrl", description: "URL-encoded image URL to delete" })
  @ApiResponse({ status: 200, description: "Image deleted successfully" })
  @ApiResponse({ status: 404, description: "Product not found" })
  async deleteImage(@Param("id") id: string, @Param("imageUrl") imageUrl: string) {
    return this.productsService.deleteImage(id, imageUrl);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager")
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Update a product (admin/manager only)" })
  @ApiParam({ name: "id", example: "prod-uuid-here" })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: "Product updated successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Product not found" })
  async update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Soft delete a product (admin only)" })
  @ApiParam({ name: "id", example: "prod-uuid-here" })
  @ApiResponse({ status: 200, description: "Product deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Product not found" })
  async remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }

  @Patch(":id/featured")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager")
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Toggle product featured status (admin/manager only)" })
  @ApiParam({ name: "id", example: "prod-uuid-here" })
  @ApiResponse({ status: 200, description: "Featured status toggled" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Product not found" })
  async toggleFeatured(@Param("id") id: string) {
    return this.productsService.toggleFeatured(id);
  }
}
