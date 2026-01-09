import { KeycloakAuthService } from '../auth/keycloak-auth.service';

describe('KeycloakAuthService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws when keycloak config is missing', async () => {
    delete process.env.KEYCLOAK_URL;
    delete process.env.KEYCLOAK_PUBLIC_CLIENT_ID;
    const service = new KeycloakAuthService();

    await expect(service.loginWithPassword('user', 'pass')).rejects.toThrow(
      'Keycloak public client is not configured',
    );
  });

  it('throws when login fails', async () => {
    process.env.KEYCLOAK_URL = 'https://keycloak.local';
    process.env.KEYCLOAK_PUBLIC_CLIENT_ID = 'web';
    const service = new KeycloakAuthService();
    jest
      .spyOn(service as any, 'request')
      .mockResolvedValue({ status: 401, body: 'nope', headers: {} });

    await expect(service.loginWithPassword('user', 'pass')).rejects.toMatchObject({
      message: 'nope',
      status: 401,
    });
  });

  it('returns token payload on success', async () => {
    process.env.KEYCLOAK_URL = 'https://keycloak.local';
    process.env.KEYCLOAK_PUBLIC_CLIENT_ID = 'web';
    const service = new KeycloakAuthService();
    jest
      .spyOn(service as any, 'request')
      .mockResolvedValue({ status: 200, body: '{"access_token":"token"}', headers: {} });

    await expect(service.loginWithPassword('user', 'pass')).resolves.toEqual({
      access_token: 'token',
    });
  });
});
