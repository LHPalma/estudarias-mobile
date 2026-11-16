/**
 * Toda falha da API vira um destes erros. As telas decidem pelo `code` (o do ProblemDetails, como
 * `student.topic.locked`), nunca pela mensagem, que é para quem desenvolve.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly detail: string | null;

  constructor(status: number, code: string | null, message: string, detail: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }

  /** Monta o erro a partir de um ProblemDetails (RFC 9457). Um corpo que não é ProblemDetails vira um erro só com o status. */
  static fromProblem(status: number, body: unknown): ApiError {
    const problem = (typeof body === 'object' && body !== null ? body : {}) as Record<
      string,
      unknown
    >;
    const text = (value: unknown) => (typeof value === 'string' && value.length > 0 ? value : null);
    return new ApiError(
      status,
      text(problem.code),
      text(problem.title) ?? `HTTP ${status}`,
      text(problem.detail),
    );
  }
}

/** Sem resposta do servidor: sem internet, servidor fora do ar ou tempo esgotado. A tela oferece "tentar de novo". */
export class NetworkError extends Error {
  readonly timedOut: boolean;

  constructor(timedOut: boolean, cause?: unknown) {
    super(timedOut ? 'A requisição demorou demais.' : 'Sem conexão com o servidor.', { cause });
    this.name = 'NetworkError';
    this.timedOut = timedOut;
  }
}

export function isApiError(error: unknown, code?: string): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code);
}
