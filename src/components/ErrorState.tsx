import { NetworkError } from '@/api/errors';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';

type Props = { error: unknown; onRetry: () => void };

/** O que a tela mostra quando os dados não chegam: o motivo em linguagem do aluno e "Tentar de novo". */
export function ErrorState({ error, onRetry }: Props) {
  const offline = error instanceof NetworkError;

  return (
    <Card>
      <AppText variant="heading" accessibilityRole="header">
        {offline ? 'Sem conexão' : 'Algo deu errado'}
      </AppText>
      <AppText variant="support" color="inkStrong">
        {offline
          ? 'Não foi possível falar com o servidor. Confira a internet e tente de novo.'
          : 'Não foi possível carregar esta tela. Tente de novo em instantes.'}
      </AppText>
      <Button label="Tentar de novo" variant="secondary" onPress={onRetry} />
    </Card>
  );
}
