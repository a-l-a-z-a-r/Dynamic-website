import { UnauthorizedException } from '@nestjs/common';
import { KeycloakAuthGuard } from '../auth/keycloak.guard';
import { jwtVerify } from 'jose';

type MockRequest = {
  headers: Record<string, string | undefined>;
  user?: unknown;
};

type MockContext = {
  switchToHttp: () => {
    getRequest: () => MockRequest;
  };
};

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'jwks'),
  jwtVerify: jest.fn(),
}));

describe('KeycloakAuthGuard', () => {
  const originalEnv = process.env;

  const makeContext = (headers: Record<string, string | undefined>): MockContext => {
    const request: MockRequest = { headers };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects missing KEYCLOAK_URL', async () => {
    delete process.env.KEYCLOAK_URL;
    const guard = new KeycloakAuthGuard();

    await expect(guard.canActivate(makeContext({}) as any)).rejects.toThrow(
      new UnauthorizedException('KEYCLOAK_URL is not configured'),
    );
  });

  it('rejects missing bearer token', async () => {
    process.env.KEYCLOAK_URL = 'https://keycloak.local';
    const guard = new KeycloakAuthGuard();

    await expect(guard.canActivate(makeContext({}) as any)).rejects.toThrow(
      new UnauthorizedException('Missing bearer token'),
    );
  });

  it('rejects invalid token', async () => {
    process.env.KEYCLOAK_URL = 'https://keycloak.local';
    (jwtVerify as jest.Mock).mockRejectedValue(new Error('bad'));
    const guard = new KeycloakAuthGuard();

    await expect(
      guard.canActivate(makeContext({ authorization: 'Bearer bad.token' }) as any),
    ).rejects.toThrow(new UnauthorizedException('Invalid or expired token'));
  });

  it('accepts valid token and attaches user payload', async () => {
    process.env.KEYCLOAK_URL = 'https://keycloak.local';
    const payload = { sub: 'user-1', preferred_username: 'mila' };
    (jwtVerify as jest.Mock).mockResolvedValue({ payload });
    const guard = new KeycloakAuthGuard();
    const context = makeContext({ authorization: 'Bearer good.token' });

    await expect(guard.canActivate(context as any)).resolves.toBe(true);
    expect(context.switchToHttp().getRequest().user).toEqual(payload);
  });
});
