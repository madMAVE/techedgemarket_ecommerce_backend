import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import type { TokenPayload, UserRole } from "../types";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>("roles", context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: TokenPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("Access denied");
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`Access denied. Required role: ${requiredRoles.join(" or ")}`);
    }

    return true;
  }
}
