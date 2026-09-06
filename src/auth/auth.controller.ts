import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RegisterDto, LoginDto } from "../common/dto/auth.dto";
import { Request } from "express";
import type { TokenPayload } from "../common/types";

interface AuthRequest extends Request {
  user?: TokenPayload;
}

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new customer account" })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 400, description: "Invalid input or email already exists" })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @ApiOperation({ summary: "Login and receive JWT tokens" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: "Login successful, returns access & refresh tokens" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token using refresh token" })
  @ApiBody({ schema: { example: { refreshToken: "eyJhbGciOiJIUzI1NiIs..." } } })
  @ApiResponse({ status: 200, description: "New access token generated" })
  @ApiResponse({ status: 401, description: "Invalid or expired refresh token" })
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Logout and revoke refresh token" })
  @ApiHeader({ name: "X-Refresh-Token", required: false, description: "Refresh token to revoke" })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async logout(@Headers("x-refresh-token") refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Get current authenticated user profile" })
  @ApiResponse({ status: 200, description: "User profile retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async me(@Req() req: AuthRequest) {
    return this.authService.getMe(req.user!.userId);
  }
}
