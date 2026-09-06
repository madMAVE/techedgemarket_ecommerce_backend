import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class AdminLoginDto {
  @ApiProperty({ example: "admin" })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: "admin123" })
  @IsNotEmpty()
  @IsString()
  password: string;
}
