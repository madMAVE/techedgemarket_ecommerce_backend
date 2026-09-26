import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

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
