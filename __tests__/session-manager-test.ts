import type { AuthApi, AuthSession } from '@/api/auth';
import { ApiError, NetworkError } from '@/api/errors';
import type { Http } from '@/api/http';
import { withSessionRetry } from '@/session/authorized-http';
import { SessionManager } from '@/session/session-manager';
import type { TokenStorage } from '@/session/token-storage';

function memoryStorage(initial: string | null = null): TokenStorage & { value: string | null } {
  const storage = {
    value: initial,
    read: async () => storage.value,
    write: async (token: string) => {
      storage.value = token;
    },
    clear: async () => {
      storage.value = null;
    },
  };
  return storage;
}

let issued = 0;
const session = (): AuthSession => {
  issued += 1;
  return {
    accessToken: `access-${issued}`,
    accessTokenExpiresAt: '2026-11-16T13:15:00Z',
    refreshToken: `refresh-${issued}`,
    user: { id: 'u1', email: 'ana@example.com', role: 'Student', studentId: 's1' },
  };
};

function fakeAuth(overrides: Partial<AuthApi> = {}): jest.Mocked<AuthApi> {
  return {
    register: jest.fn(async () => session()),
    login: jest.fn(async () => session()),
    refresh: jest.fn(async () => session()),
    logout: jest.fn(async () => undefined),
    ...overrides,
  } as jest.Mocked<AuthApi>;
}

const unauthorized = () => new ApiError(401, 'identity.refreshToken.invalid', 'Unauthorized');

beforeEach(() => {
  issued = 0;
});

describe('SessionManager', () => {
  it('entrar guarda o refresh token e deixa o access token só em memória', async () => {
    // Arrange
    const storage = memoryStorage();
    const manager = new SessionManager(fakeAuth(), storage);

    // Act
    await manager.signIn('ana@example.com', 'Senha@123');

    // Assert
    expect(manager.getState()).toMatchObject({
      status: 'signedIn',
      user: { email: 'ana@example.com' },
    });
    expect(manager.getAccessToken()).toBe('access-1');
    expect(storage.value).toBe('refresh-1');
  });

  it('ao abrir sem token guardado, vai para o login sem aviso e sem chamar o servidor', async () => {
    // Arrange
    const auth = fakeAuth();
    const manager = new SessionManager(auth, memoryStorage());

    // Act
    await manager.restore();

    // Assert
    expect(manager.getState()).toEqual({ status: 'signedOut', notice: null });
    expect(auth.refresh).not.toHaveBeenCalled();
  });

  it('ao abrir com token guardado, renova a sessão e troca o token guardado', async () => {
    // Arrange
    const storage = memoryStorage('refresh-antigo');
    const auth = fakeAuth();
    const manager = new SessionManager(auth, storage);

    // Act
    await manager.restore();

    // Assert
    expect(auth.refresh).toHaveBeenCalledWith('refresh-antigo');
    expect(manager.getState().status).toBe('signedIn');
    expect(storage.value).toBe('refresh-1');
  });

  it('se o servidor recusa o token, a sessão acaba, com o aviso, e o token é apagado', async () => {
    // Arrange
    const storage = memoryStorage('refresh-vencido');
    const manager = new SessionManager(
      fakeAuth({ refresh: jest.fn().mockRejectedValue(unauthorized()) }),
      storage,
    );

    // Act
    await manager.restore();

    // Assert
    expect(manager.getState()).toEqual({ status: 'signedOut', notice: 'expired' });
    expect(storage.value).toBeNull();
  });

  it('sem rede ao abrir, não apaga o token: ele pode ainda valer', async () => {
    // Arrange
    const storage = memoryStorage('refresh-bom');
    const manager = new SessionManager(
      fakeAuth({ refresh: jest.fn().mockRejectedValue(new NetworkError(false)) }),
      storage,
    );

    // Act
    await manager.restore();

    // Assert
    expect(manager.getState()).toEqual({ status: 'signedOut', notice: 'offline' });
    expect(storage.value).toBe('refresh-bom');
  });

  it('renovações pedidas ao mesmo tempo viram uma só chamada', async () => {
    // Arrange
    const auth = fakeAuth();
    const manager = new SessionManager(auth, memoryStorage('refresh-0'));

    // Act
    const outcomes = await Promise.all([manager.refresh(), manager.refresh(), manager.refresh()]);

    // Assert
    expect(outcomes).toEqual(['refreshed', 'refreshed', 'refreshed']);
    expect(auth.refresh).toHaveBeenCalledTimes(1);
  });

  it('sair apaga a sessão mesmo se o servidor não responder', async () => {
    // Arrange
    const storage = memoryStorage();
    const auth = fakeAuth({ logout: jest.fn().mockRejectedValue(new NetworkError(false)) });
    const manager = new SessionManager(auth, storage);
    await manager.signIn('ana@example.com', 'Senha@123');

    // Act
    await manager.signOut();

    // Assert
    expect(manager.getState()).toEqual({ status: 'signedOut', notice: null });
    expect(manager.getAccessToken()).toBeNull();
    expect(storage.value).toBeNull();
    expect(auth.logout).toHaveBeenCalledWith('refresh-1');
  });

  it('avisa quem está inscrito a cada mudança de estado', async () => {
    // Arrange
    const manager = new SessionManager(fakeAuth(), memoryStorage());
    const listener = jest.fn();
    const unsubscribe = manager.subscribe(listener);

    // Act
    await manager.signIn('ana@example.com', 'Senha@123');
    unsubscribe();
    await manager.signOut();

    // Assert
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('withSessionRetry', () => {
  /** Um HTTP que só aceita o access token mais novo, como o servidor depois que o antigo vence. */
  function expiringHttp(manager: SessionManager, validToken: () => string) {
    const get = jest.fn(async (path: string) => {
      if (manager.getAccessToken() !== validToken()) {
        throw new ApiError(401, null, 'Unauthorized');
      }
      return { path };
    });
    return { get, post: jest.fn() } as unknown as jest.Mocked<Http>;
  }

  it('num 401, renova a sessão uma vez e repete a chamada', async () => {
    // Arrange
    const auth = fakeAuth();
    const manager = new SessionManager(auth, memoryStorage());
    await manager.signIn('ana@example.com', 'Senha@123');
    const inner = expiringHttp(manager, () => 'access-2');
    const http = withSessionRetry(inner, manager);

    // Act
    const body = await http.get('/trail');

    // Assert
    expect(body).toEqual({ path: '/trail' });
    expect(auth.refresh).toHaveBeenCalledTimes(1);
    expect(inner.get).toHaveBeenCalledTimes(2);
  });

  it('várias chamadas com 401 ao mesmo tempo compartilham uma renovação', async () => {
    // Arrange
    const auth = fakeAuth();
    const manager = new SessionManager(auth, memoryStorage());
    await manager.signIn('ana@example.com', 'Senha@123');
    const http = withSessionRetry(
      expiringHttp(manager, () => 'access-2'),
      manager,
    );

    // Act
    const bodies = await Promise.all([
      http.get('/trail'),
      http.get('/me'),
      http.get('/reviews/due'),
    ]);

    // Assert
    expect(bodies).toHaveLength(3);
    expect(auth.refresh).toHaveBeenCalledTimes(1);
  });

  it('se a renovação é recusada, a sessão acaba e o 401 segue para quem chamou', async () => {
    // Arrange
    const manager = new SessionManager(
      fakeAuth({ refresh: jest.fn().mockRejectedValue(unauthorized()) }),
      memoryStorage(),
    );
    await manager.signIn('ana@example.com', 'Senha@123');
    const http = withSessionRetry(
      expiringHttp(manager, () => 'nunca'),
      manager,
    );

    // Act
    const error = await http.get('/trail').catch((e: unknown) => e);

    // Assert
    expect(error).toMatchObject({ status: 401 });
    expect(manager.getState()).toEqual({ status: 'signedOut', notice: 'expired' });
  });

  it('um erro que não é 401 passa direto, sem renovar', async () => {
    // Arrange
    const auth = fakeAuth();
    const manager = new SessionManager(auth, memoryStorage());
    const inner = {
      get: jest.fn().mockRejectedValue(new ApiError(403, 'student.topic.locked', 'Forbidden')),
      post: jest.fn(),
    };
    const http = withSessionRetry(inner as unknown as Http, manager);

    // Act
    const error = await http.get('/lessons/1').catch((e: unknown) => e);

    // Assert
    expect(error).toMatchObject({ status: 403 });
    expect(auth.refresh).not.toHaveBeenCalled();
  });
});
