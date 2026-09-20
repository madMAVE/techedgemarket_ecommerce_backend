import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class OrderItemDto {
  @ApiProperty({ example: "prod-uuid-here", description: "Product ID" })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ example: 5, minimum: 1 })
  @IsNotEmpty()
  quantity: number;
}

export class AddressDto {
  @ApiProperty({ example: "123 Industrial Area" })
  @IsNotEmpty()
  @IsString()
  street: string;

  @ApiProperty({ example: "Mumbai" })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: "Maharashtra" })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ example: "400001" })
  @IsNotEmpty()
  @IsString()
  zip: string;

  @ApiProperty({ example: "India" })
  @IsNotEmpty()
  @IsString()
  country: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: "customer-uuid-here" })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({ example: "Rajesh Kumar" })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({ example: "rajesh@acme.com" })
  @IsNotEmpty()
  @IsString()
  customerEmail: string;

  @ApiProperty({ example: "Acme Industries" })
  @IsNotEmpty()
  @IsString()
  customerCompany: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: "9876543210" })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  orgAddress: AddressDto;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress: AddressDto;

  @ApiPropertyOptional({ example: "https://maps.google.com/?q=..." })
  @IsOptional()
  @IsString()
  locationUrl?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  otpVerified: boolean;

  @ApiProperty({ example: "wire_transfer" })
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ example: "PO-2024-001" })
  @IsOptional()
  @IsString()
  poReference?: string;

  @ApiPropertyOptional({ example: "Deliver before 5 PM" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: "SAVE10" })
  @IsOptional()
  @IsString()
  discountCode?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ example: "shipped", enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"] })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: "TRACK123456789" })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ example: "2024-12-31" })
  @IsOptional()
  @IsString()
  estimatedDelivery?: string;
}
