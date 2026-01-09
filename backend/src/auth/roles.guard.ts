import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: Record<string, unknown> }>();
    const payload = request.user || {};
    const realmRoles = this.getRealmRoles(payload);
    const clientRoles = this.getClientRoles(payload);
    const allRoles = new Set([...realmRoles, ...clientRoles]);

    const hasRole = requiredRoles.some((role) => allRoles.has(role));
    if (!hasRole) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }

  private getRealmRoles(payload: Record<string, unknown>) {
    const access = payload.realm_access as { roles?: string[] } | undefined;
    return access?.roles ?? [];
  }

  private getClientRoles(payload: Record<string, unknown>) {
    const access = payload.resource_access as Record<string, { roles?: string[] }> | undefined;
    const clientId = process.env.KEYCLOAK_PUBLIC_CLIENT_ID;
    if (!access || !clientId) return [];
    return access[clientId]?.roles ?? [];
  }
}
