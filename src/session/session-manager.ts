import type { AuthApi, AuthSession, SessionUser } from '@/api/auth';
import { ApiError } from '@/api/errors';

import type { TokenStorage } from './token-storage';

export type SessionState =
  | { status: 'loading' }
  /** `isNew` marca quem acabou de criar a conta: o app mostra as boas-vindas antes da trilha. */
  | { status: 'signedIn'; user: SessionUser; isNew?: boolean }
  /** `notice` diz por que o aluno está no login sem ter pedido para sair. */
  | { status: 'signedOut'; notice: 'expired' | 'offline' | null };

export type RefreshOutcome = 'refreshed' | 'expired' | 'offline';

/**
 * A sessão do aluno, fora do React para poder ser testada sozinha. O access token fica só em memória; o refresh token, no
 * armazenamento seguro. Cada renovação troca o refresh token (o usado deixa de valer no servidor), então nunca há duas
 * renovações ao mesmo tempo: quem pede uma enquanto outra corre espera a mesma.
 */
export class SessionManager {
  private state: SessionState = { status: 'loading' };
  private accessToken: string | null = null;
  private refreshing: Promise<RefreshOutcome> | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly auth: AuthApi,
    private readonly storage: TokenStorage,
  ) {}

  getState = (): SessionState => this.state;

  getAccessToken = (): string | null => this.accessToken;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Ao abrir o app: com um refresh token guardado, renova a sessão; sem ele, vai para o login. */
  async restore(): Promise<void> {
    const outcome = await this.refresh();
    if (outcome === 'offline') {
      // Sem rede não dá para saber se o token ainda vale: ele fica guardado para a próxima abertura.
      this.setState({ status: 'signedOut', notice: 'offline' });
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.start(await this.auth.login({ email, password }));
  }

  async signUp(name: string, email: string, password: string): Promise<void> {
    await this.start(await this.auth.register({ name, email, password }), true);
  }

  /** Sai neste aparelho. O servidor é avisado, mas a saída não depende dele: sem rede, o aluno sai do mesmo jeito. */
  async signOut(): Promise<void> {
    const token = await this.storage.read();
    await this.end(null);
    if (token) {
      await this.auth.logout(token).catch(() => undefined);
    }
  }

  /** Renova a sessão com o refresh token guardado. Chamadas concorrentes compartilham a mesma renovação. */
  refresh(): Promise<RefreshOutcome> {
    this.refreshing ??= this.doRefresh().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  private async doRefresh(): Promise<RefreshOutcome> {
    const token = await this.storage.read();
    if (!token) {
      await this.end(this.state.status === 'signedIn' ? 'expired' : null);
      return 'expired';
    }

    try {
      await this.start(await this.auth.refresh(token));
      return 'refreshed';
    } catch (error) {
      if (error instanceof ApiError) {
        // O servidor recusou o token (vencido, já usado ou de conta desabilitada): a sessão acabou.
        await this.end('expired');
        return 'expired';
      }
      return 'offline';
    }
  }

  private async start(session: AuthSession, isNew = false): Promise<void> {
    await this.storage.write(session.refreshToken);
    this.accessToken = session.accessToken;
    this.setState({ status: 'signedIn', user: session.user, isNew });
  }

  private async end(notice: 'expired' | null): Promise<void> {
    await this.storage.clear();
    this.accessToken = null;
    this.setState({ status: 'signedOut', notice });
  }

  private setState(state: SessionState): void {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }
}
