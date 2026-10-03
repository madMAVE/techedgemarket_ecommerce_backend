import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsArray } from "class-validator";

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

export class SendEmailWithAttachmentsDto {
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

  @ApiPropertyOptional({ type: "array", items: { type: "string", format: "binary" }, description: "Email attachments (PDF, XLSX, CSV, DOCX, JPG, JPEG, WEBP, PNG)" })
  @IsOptional()
  @IsArray()
  attachments?: any[];
}
