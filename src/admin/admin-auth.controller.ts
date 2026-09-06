import { Controller, Post, Get, Body, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuthService } from "./admin-auth.service";
import { CookieJwtAuthGuard } from "./admin-auth.guard";
import { AdminLoginDto } from "../common/dto/admin-auth.dto";
import type { TokenPayload } from "../common/types";

interface AdminRequest extends Request {
  user?: TokenPayload;
}

@ApiTags("Admin Auth")
@Controller("admin")
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Admin login (returns session cookie)" })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({ status: 200, description: "Admin login successful, session cookie set" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() dto: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
    return this.adminAuthService.login(dto, res);
  }

  @Post("logout")
  @UseGuards(CookieJwtAuthGuard)
  @ApiCookieAuth("admin_session")
  @ApiOperation({ summary: "Admin logout (clears session cookie)" })
  @ApiResponse({ status: 200, description: "Admin logged out" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async logout(@Res({ passthrough: true }) res: Response) {
    return this.adminAuthService.logout(res);
  }

  @Get("me")
  @UseGuards(CookieJwtAuthGuard)
  @ApiCookieAuth("admin_session")
  @ApiOperation({ summary: "Get current admin profile" })
  @ApiResponse({ status: 200, description: "Admin profile retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async me(@Req() req: AdminRequest) {
    return this.adminAuthService.getMe(req.user!.userId);
  }
}
