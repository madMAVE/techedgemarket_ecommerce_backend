import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateEmailSignatureDto {
  @ApiProperty({ example: "Standard Signature", description: "Signature name" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: "<p>Best regards,<br/>TechEdge Market Team</p>", description: "Signature HTML content" })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: false, description: "Set as active signature" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEmailSignatureDto {
  @ApiPropertyOptional({ example: "Standard Signature", description: "Signature name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "<p>Best regards,<br/>TechEdge Market Team</p>", description: "Signature HTML content" })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: false, description: "Set as active signature" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
