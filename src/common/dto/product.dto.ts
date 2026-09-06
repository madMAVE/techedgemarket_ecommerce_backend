import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CreateProductDto {
  @ApiProperty({ example: "Siemens PLC S7-1200", description: "Product name" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: "Compact CPU for automation tasks" })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 12500.0, description: "Selling price in INR" })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: 15000.0, description: "Original/MSRP price" })
  @IsOptional()
  @IsNumber()
  originalPrice?: number | null;

  @ApiProperty({ example: "Automation" })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: "PLC" })
  @IsOptional()
  @IsString()
  subcategory?: string | null;

  @ApiProperty({ example: "Siemens", description: "Brand name (not UUID)" })
  @IsNotEmpty()
  @IsString()
  brand: string;

  @ApiPropertyOptional({ example: "S7-1200" })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: "6ES7211-1AE40-0XB0" })
  @IsOptional()
  @IsString()
  partNumber?: string;

  @ApiPropertyOptional({ example: 50, description: "Initial stock quantity" })
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiPropertyOptional({ example: "2-3 days" })
  @IsOptional()
  @IsString()
  leadTime?: string | null;

  @ApiPropertyOptional({ example: ["plc", "siemens", "automation"], type: [String] })
  @IsOptional()
  @IsArray()
  keywords?: string[] | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean | null;

  @ApiPropertyOptional({ example: "New Arrival" })
  @IsOptional()
  @IsString()
  badge?: string | null;

  @ApiPropertyOptional({ example: { voltage: "24V DC", inputs: "14 DI" }, additionalProperties: { type: "string" } })
  @IsOptional()
  specs?: Record<string, string> | null;

  @ApiPropertyOptional({ example: "https://cdn.example.com/product.jpg" })
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiPropertyOptional({ example: ["https://cdn.example.com/1.jpg", "https://cdn.example.com/2.jpg"], type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[] | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: "Siemens PLC S7-1200 v2" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 11000.0 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: 15000.0 })
  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @ApiPropertyOptional({ example: "Automation" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadTime?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  keywords?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ additionalProperties: { type: "string" } })
  @IsOptional()
  specs?: Record<string, string>;

  @ApiPropertyOptional({ example: "https://cdn.example.com/product.jpg" })
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiPropertyOptional({ example: ["https://cdn.example.com/1.jpg", "https://cdn.example.com/2.jpg"], type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[] | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BulkProductItemDto {
  @ApiPropertyOptional({ description: "Ignored if provided - server generates ID" })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: "Siemens PLC S7-1200" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: "Compact CPU for automation tasks" })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 12500.0 })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: 15000.0 })
  @IsOptional()
  @IsNumber()
  originalPrice?: number | null;

  @ApiProperty({ example: "Automation" })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: "PLC" })
  @IsOptional()
  @IsString()
  subcategory?: string | null;

  @ApiProperty({ example: "Siemens", description: "Brand name (not UUID)" })
  @IsNotEmpty()
  @IsString()
  brand: string;

  @ApiPropertyOptional({ example: "S7-1200" })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: "6ES7211-1AE40-0XB0" })
  @IsOptional()
  @IsString()
  partNumber?: string;

  @ApiPropertyOptional({ description: "Ignored if provided - server generates SKU" })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiPropertyOptional({ example: "2-3 days" })
  @IsOptional()
  @IsString()
  leadTime?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  keywords?: string[] | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean | null;

  @ApiPropertyOptional({ example: "New Arrival" })
  @IsOptional()
  @IsString()
  badge?: string | null;

  @ApiPropertyOptional({ additionalProperties: { type: "string" } })
  @IsOptional()
  specs?: Record<string, string> | null;

  @ApiPropertyOptional({ example: "https://cdn.example.com/product.jpg" })
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiPropertyOptional({ example: ["https://cdn.example.com/1.jpg"], type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[] | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Ignored if provided - server sets default" })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({ description: "Ignored if provided - server manages reviews" })
  @IsOptional()
  @IsNumber()
  reviews?: number;
}

export class BulkProductDto {
  @ApiProperty({ type: [BulkProductItemDto], description: "Array of products to create", minItems: 1, maxItems: 500 })
  @IsArray()
  @IsNotEmpty({ each: true })
  @ValidateNested({ each: true })
  @Type(() => BulkProductItemDto)
  products: BulkProductItemDto[];
}
