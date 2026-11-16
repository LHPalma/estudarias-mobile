import { NetworkError } from '@/api/errors';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';

type Props = {
  error: unknown;
  onRetry: () => void;
  /** Para um erro que tentar de novo não resolve (um tópico bloqueado, algo que não existe mais): o que dizer e para onde ir. */
  override?: { title: string; message: string; actionLabel: string; onAction: () => void };
};

/** O que a tela mostra quando os dados não chegam: o motivo em linguagem do aluno e uma saída. */
export function ErrorState({ error, onRetry, override }: Props) {
  const offline = error instanceof NetworkError;
  const title = override?.title ?? (offline ? 'Sem conexão' : 'Algo deu errado');
  const message =
    override?.message ??
    (offline
      ? 'Não foi possível falar com o servidor. Confira a internet e tente de novo.'
      : 'Não foi possível carregar esta tela. Tente de novo em instantes.');

  return (
    <Card>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="support" color="inkStrong">
        {message}
      </AppText>
      <Button
        label={override?.actionLabel ?? 'Tentar de novo'}
        variant="secondary"
        onPress={override?.onAction ?? onRetry}
      />
    </Card>
  );
}
