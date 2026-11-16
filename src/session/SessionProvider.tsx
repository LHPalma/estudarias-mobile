import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import type { SessionManager, SessionState } from './session-manager';

type SessionContextValue = {
  state: SessionState;
  signIn: SessionManager['signIn'];
  signUp: SessionManager['signUp'];
  signOut: SessionManager['signOut'];
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession precisa estar dentro de um SessionProvider.');
  }
  return value;
}

type Props = { manager: SessionManager; children: ReactNode };

/** Liga a sessão ao React: restaura ao abrir o app e limpa os dados em cache quando o aluno sai. */
export function SessionProvider({ manager, children }: Props) {
  const state = useSyncExternalStore(manager.subscribe, manager.getState, manager.getState);
  const queryClient = useQueryClient();

  useEffect(() => {
    manager.restore();
  }, [manager]);

  // Os dados em cache são do aluno que saiu: o próximo a entrar não pode vê-los.
  useEffect(() => {
    if (state.status === 'signedOut') {
      queryClient.clear();
    }
  }, [state.status, queryClient]);

  const value = useMemo(
    () => ({
      state,
      signIn: manager.signIn.bind(manager),
      signUp: manager.signUp.bind(manager),
      signOut: manager.signOut.bind(manager),
    }),
    [state, manager],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
