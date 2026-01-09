import { KeycloakAdminService } from '../auth/keycloak-admin.service';

describe('KeycloakAdminService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws when admin config is missing', async () => {
    delete process.env.KEYCLOAK_URL;
    delete process.env.KEYCLOAK_ADMIN_CLIENT_ID;
    delete process.env.KEYCLOAK_ADMIN_CLIENT_SECRET;
    const service = new KeycloakAdminService();

    await expect(
      service.createUser({ username: 'mila', password: 'pass', email: 'm@example.com' }),
    ).rejects.toThrow('Keycloak admin client is not configured');
  });

  it('creates users with admin token', async () => {
    process.env.KEYCLOAK_URL = 'https://keycloak.local';
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'admin';
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';
    const service = new KeycloakAdminService();
    jest
      .spyOn(service as any, 'request')
      .mockResolvedValueOnce({ status: 200, body: '{"access_token":"token"}', headers: {} })
      .mockResolvedValueOnce({ status: 201, body: '', headers: {} });

    await expect(
      service.createUser({ username: 'mila', password: 'pass', email: 'm@example.com' }),
    ).resolves.toBeUndefined();
  });

  it('finds users by username', async () => {
    process.env.KEYCLOAK_URL = 'https://keycloak.local';
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'admin';
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';
    const service = new KeycloakAdminService();
    jest
      .spyOn(service as any, 'request')
      .mockResolvedValueOnce({ status: 200, body: '{"access_token":"token"}', headers: {} })
      .mockResolvedValueOnce({
        status: 200,
        body: '[{"id":"1","username":"mila"}]',
        headers: {},
      });

    await expect(service.findUserByUsername('mila')).resolves.toEqual({
      id: '1',
      username: 'mila',
    });
  });

  it('returns null for missing users', async () => {
    process.env.KEYCLOAK_URL = 'https://keycloak.local';
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'admin';
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';
    const service = new KeycloakAdminService();
    jest
      .spyOn(service as any, 'request')
      .mockResolvedValueOnce({ status: 200, body: '{"access_token":"token"}', headers: {} })
      .mockResolvedValueOnce({ status: 200, body: '[]', headers: {} });

    await expect(service.findUserByUsername('missing')).resolves.toBeNull();
  });

  it('searches users and maps fields', async () => {
    process.env.KEYCLOAK_URL = 'https://keycloak.local';
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'admin';
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';
    const service = new KeycloakAdminService();
    jest
      .spyOn(service as any, 'request')
      .mockResolvedValueOnce({ status: 200, body: '{"access_token":"token"}', headers: {} })
      .mockResolvedValueOnce({
        status: 200,
        body: '[{"id":"1","username":"mila","firstName":"M","lastName":"L"}]',
        headers: {},
      });

    await expect(service.searchUsers('mi')).resolves.toEqual([
      { id: '1', username: 'mila', firstName: 'M', lastName: 'L', email: undefined },
    ]);
  });

  it('rejects token responses without access_token', async () => {
    process.env.KEYCLOAK_URL = 'https://keycloak.local';
    process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'admin';
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET = 'secret';
    const service = new KeycloakAdminService();
    (service as any).loadConfig();
    jest
      .spyOn(service as any, 'request')
      .mockResolvedValueOnce({ status: 200, body: '{}', headers: {} });

    await expect((service as any).fetchAdminToken()).rejects.toThrow(
      'Keycloak token response missing access_token',
    );
  });
});
