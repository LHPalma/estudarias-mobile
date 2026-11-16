import { ApiError, NetworkError, isApiError } from '@/api/errors';
import { createHttp } from '@/api/http';
import { hasLink } from '@/api/links';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('createHttp', () => {
  it('devolve o JSON da resposta e manda o token da sessão', async () => {
    // Arrange
    const fetchFn = jest.fn().mockResolvedValue(json(200, { ok: true }));
    const http = createHttp({ baseUrl: 'http://api/', getAccessToken: () => 'abc', fetchFn });

    // Act
    const body = await http.get<{ ok: boolean }>('/trail');

    // Assert
    expect(body).toEqual({ ok: true });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('http://api/trail');
    expect(init.headers.Authorization).toBe('Bearer abc');
  });

  it('sem sessão, não manda Authorization', async () => {
    // Arrange
    const fetchFn = jest.fn().mockResolvedValue(json(200, {}));
    const http = createHttp({ baseUrl: 'http://api', fetchFn });

    // Act
    await http.post('/exercises/1/attempts', { alternativeId: 'a' });

    // Assert
    const [, init] = fetchFn.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"alternativeId":"a"}');
  });

  it('uma resposta de erro vira ApiError com o code do ProblemDetails', async () => {
    // Arrange
    const problem = {
      status: 403,
      title: 'Forbidden',
      detail: 'Tópico bloqueado.',
      code: 'student.topic.locked',
    };
    const http = createHttp({
      baseUrl: 'http://api',
      fetchFn: jest.fn().mockResolvedValue(json(403, problem)),
    });

    // Act
    const error = await http.get('/lessons/1').catch((e: unknown) => e);

    // Assert
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 403,
      code: 'student.topic.locked',
      detail: 'Tópico bloqueado.',
    });
    expect(isApiError(error, 'student.topic.locked')).toBe(true);
  });

  it('um erro sem ProblemDetails vira ApiError só com o status', async () => {
    // Arrange
    const fetchFn = jest.fn().mockResolvedValue(new Response('<html>erro</html>', { status: 502 }));
    const http = createHttp({ baseUrl: 'http://api', fetchFn });

    // Act
    const error = await http.get('/trail').catch((e: unknown) => e);

    // Assert
    expect(error).toMatchObject({ status: 502, code: null, message: 'HTTP 502' });
  });

  it('sem resposta do servidor, lança NetworkError', async () => {
    // Arrange
    const http = createHttp({
      baseUrl: 'http://api',
      fetchFn: jest.fn().mockRejectedValue(new TypeError('Network request failed')),
    });

    // Act
    const error = await http.get('/trail').catch((e: unknown) => e);

    // Assert
    expect(error).toBeInstanceOf(NetworkError);
    expect(error).toMatchObject({ timedOut: false });
  });

  it('passado o tempo limite, desiste e lança NetworkError de tempo esgotado', async () => {
    // Arrange
    const fetchFn = jest.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          init.signal?.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    );
    const http = createHttp({
      baseUrl: 'http://api',
      timeoutMs: 10,
      fetchFn: fetchFn as typeof fetch,
    });

    // Act
    const error = await http.get('/trail').catch((e: unknown) => e);

    // Assert
    expect(error).toBeInstanceOf(NetworkError);
    expect(error).toMatchObject({ timedOut: true });
  });
});

describe('hasLink', () => {
  const resource = {
    links: [{ href: 'http://api/lessons/1', rel: 'lesson', method: 'GET' as const }],
  };

  it('diz se a ação veio nos links do recurso', () => {
    // Act & Assert
    expect(hasLink(resource, 'lesson')).toBe(true);
    expect(hasLink(resource, 'answer')).toBe(false);
    expect(hasLink(undefined, 'lesson')).toBe(false);
  });
});
