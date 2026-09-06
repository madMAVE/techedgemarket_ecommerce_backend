import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../common/database/prisma.service";
import { AppConfig } from "../common/config/app.config";
import { RegisterDto, LoginDto } from "../common/dto/auth.dto";
import type { TokenPayload } from "../common/types";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: AppConfig,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new UnauthorizedException("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: "customer",
        company: dto.company ?? null,
        phone: dto.phone ?? null,
        gstin: dto.gstin ?? null,
        isActive: true,
      },
    });

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const tokens = await this.generateTokens(stored.user);
    return tokens;
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
    return { message: "Logged out successfully" };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return this.sanitizeUser(user);
  }

  private async generateTokens(user: { id: string; email: string; role: string }) {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as TokenPayload["role"],
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.jwt.secret,
      expiresIn: this.config.jwt.expiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.jwt.refreshSecret,
      expiresIn: this.config.jwt.refreshExpiresIn,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: { id: string; name: string; email: string; role: string; company: string | null; phone: string | null; gstin: string | null; isActive: boolean; createdAt: Date; updatedAt: Date }) {
    const { password: _, ...result } = user as Record<string, unknown>;
    return result;
  }
}
