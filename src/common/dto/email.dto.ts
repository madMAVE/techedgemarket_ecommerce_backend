import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsArray, Transform } from "class-validator";

export class SendEmailDto {
  @ApiProperty({ example: "customer@example.com", description: "Recipient email address" })
  @IsNotEmpty()
  @IsEmail()
  to: string;

  @ApiProperty({ example: "Important Update", description: "Email subject" })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: "<p>Hello, this is a test email.</p>", description: "Email content (HTML supported)" })
  @IsNotEmpty()
  @IsString()
  content: string;
}

function parseJsonArray(value: any): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return value ? [value] : undefined;
    }
  }
  return undefined;
}

export class SendEmailWithAttachmentsDto {
  @ApiProperty({ example: "customer@example.com", description: "Primary recipient email address" })
  @IsNotEmpty()
  @IsEmail()
  to: string;

  @ApiPropertyOptional({ example: ["cc1@example.com", "cc2@example.com"], description: "CC recipients" })
  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @IsEmail({}, { each: true })
  cc?: string[];

  @ApiPropertyOptional({ example: ["bcc1@example.com"], description: "BCC recipients" })
  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @IsEmail({}, { each: true })
  bcc?: string[];

  @ApiProperty({ example: "Important Update", description: "Email subject" })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: "<p>Hello, this is a test email.</p>", description: "Email content (HTML supported)" })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: "array", items: { type: "string", format: "binary" }, description: "Email attachments (PDF, XLSX, CSV, DOCX, JPG, JPEG, WEBP, PNG)" })
  @IsOptional()
  @IsArray()
  attachments?: any[];
}
