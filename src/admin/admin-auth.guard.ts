import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { AppConfig } from "../common/config/app.config";
import type { TokenPayload } from "../common/types";

@Injectable()
export class CookieJwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private config: AppConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: TokenPayload; cookies?: Record<string, string> }>();

    let token: string | undefined;

    // 1. Try httpOnly cookie first
    token = request.cookies?.["admin_session"];

    // 2. Fallback to Authorization header (for SPA reload / cross-origin)
    if (!token) {
      const header = request.headers.authorization;
      if (header?.startsWith("Bearer ")) {
        token = header.split(" ")[1];
      }
    }

    if (!token) {
      throw new UnauthorizedException("No session cookie or token provided");
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.jwt.secret,
      });
      request.user = payload as TokenPayload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired session");
    }
  }
}
