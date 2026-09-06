import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../common/database/prisma.service";
import { AppConfig } from "../common/config/app.config";
import { AdminLoginDto } from "../common/dto/admin-auth.dto";
import type { TokenPayload } from "../common/types";

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: AppConfig,
  ) {}

  async login(dto: AdminLoginDto, res: Response) {
    const admin = await this.prisma.admin.findUnique({
      where: { username: dto.username },
    });

    if (!admin) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(dto.password, admin.password);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload: TokenPayload = {
      userId: admin.id,
      email: admin.username,
      role: "admin",
    };

    const token = this.jwtService.sign(payload, {
      secret: this.config.jwt.secret,
      expiresIn: this.config.jwt.expiresIn,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: !this.config.server.isDev,
      sameSite: "none" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    };

    res.cookie("admin_session", token, cookieOptions);

    return {
      message: "Login successful",
      token,
      user: this.sanitizeAdmin(admin),
    };
  }

  logout(res: Response) {
    res.clearCookie("admin_session", { path: "/" });
    return { message: "Logged out successfully" };
  }

  async getMe(adminId: string) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new UnauthorizedException("Admin not found");
    }
    return this.sanitizeAdmin(admin);
  }

  private sanitizeAdmin(admin: { id: string; username: string; contact: string | null; createdAt: Date; updatedAt: Date }) {
    const { password: _, ...result } = admin as Record<string, unknown>;
    return result;
  }
}
