import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { AppConfig } from "../config/app.config";
import type { TokenPayload } from "../types";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private config: AppConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: TokenPayload }>();
    let token: string | undefined;

    const header = request.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    } else if (request.headers.cookie) {
      const match = request.headers.cookie.match(/admin_session=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.jwt.secret,
      });
      request.user = payload as TokenPayload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
