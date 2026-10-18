import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { DocumentType } from "@prisma/client";

export class DocPartyDto {
  @ApiProperty({ example: "Acme Industries Ltd" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "Mr. R. Sharma" })
  @IsOptional()
  @IsString()
  attention?: string;

  @ApiPropertyOptional({ example: "9876543210" })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: "purchase@acme.co.in" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: "Plot 12, Industrial Area" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: "Kolkata" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: "West Bengal" })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: "19" })
  @IsOptional()
  @IsString()
  stateCode?: string;

  @ApiPropertyOptional({ example: "19AAACB1234A1Z5" })
  @IsOptional()
  @IsString()
  gstin?: string;
}

export class DocContactDto {
  @ApiProperty({ example: "R. Sharma" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "Purchase Manager" })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: "9876543210" })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: "r.sharma@acme.co.in" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: "Only one primary contact per customer" })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateDocumentDto {
  @ApiProperty({ enum: DocumentType, example: DocumentType.INVOICE })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({ example: "2026-10-18" })
  @IsDateString()
  issueDate: string;

  @ApiPropertyOptional({ example: "Acme Industries Ltd", description: "Defaults to party.name" })
  @IsOptional()
  @IsString()
  partyName?: string;

  @ApiProperty({ type: DocPartyDto })
  @ValidateNested()
  @Type(() => DocPartyDto)
  party: DocPartyDto;

  @ApiPropertyOptional({ description: "Link to a website order (invoices)" })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ description: "Full document shape as built by the frontend (items, terms, totals, ...)" })
  @IsObject()
  payload: object;

  @ApiPropertyOptional({ type: [DocContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocContactDto)
  contacts?: DocContactDto[];
}

export class UpdateDocumentPayloadDto {
  @ApiProperty({ description: "Replacement payload; only allowed while document is DRAFT" })
  @IsObject()
  payload: object;
}

export class CreateContactDto {
  @ApiProperty({ type: DocContactDto })
  @ValidateNested()
  @Type(() => DocContactDto)
  contact: DocContactDto;
}

export class UpdateContactDto {
  @ApiPropertyOptional({ example: "R. Sharma" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "Purchase Manager" })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: "9876543210" })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: "r.sharma@acme.co.in" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
