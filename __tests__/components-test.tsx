import { fireEvent, render, screen } from '@testing-library/react-native';

import { AlternativeOption } from '@/components/AlternativeOption';
import { Button } from '@/components/Button';
import { ScoreBar } from '@/components/ScoreBar';
import { StatusBadge } from '@/components/StatusBadge';
import { TopicCard } from '@/components/TopicCard';

describe('<Button />', () => {
  it('chama a ação ao ser tocado', async () => {
    // Arrange
    const onPress = jest.fn();
    await render(<Button label="Responder" onPress={onPress} />);

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Responder' }));

    // Assert
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('desabilitado, não responde e diz que está desabilitado', async () => {
    // Arrange
    const onPress = jest.fn();
    await render(<Button label="Responder" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Responder' });

    // Act
    await fireEvent.press(button);

    // Assert
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('carregando, não responde e diz que está ocupado', async () => {
    // Arrange
    const onPress = jest.fn();
    await render(<Button label="Entrar" onPress={onPress} loading />);
    const button = screen.getByRole('button', { name: 'Entrar' });

    // Act
    await fireEvent.press(button);

    // Assert
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeBusy();
  });
});

describe('<StatusBadge />', () => {
  it.each([
    ['mastered', 'Dominado'],
    ['locked', 'Bloqueado'],
    ['fromError', 'Gerado por um erro seu'],
    ['hard', 'Difícil'],
  ] as const)('o selo %s diz "%s" em texto', async (kind, label) => {
    // Act
    await render(<StatusBadge kind={kind} />);

    // Assert
    expect(screen.getByText(label)).toBeTruthy();
  });
});

describe('<ScoreBar />', () => {
  it('é uma barra de progresso com a parte inteira da nota e a meta', async () => {
    // Act
    await render(<ScoreBar score={69.9} />);

    // Assert
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAccessibilityValue({ min: 0, max: 100, now: 69 });
    expect(screen.getByLabelText('Nota 69 de 100, meta 70')).toBeTruthy();
  });

  it('sem nota, diz que ainda não há nota', async () => {
    // Act
    await render(<ScoreBar score={null} />);

    // Assert
    expect(screen.getByLabelText('Sem nota ainda, meta 70')).toBeTruthy();
  });
});

describe('<AlternativeOption />', () => {
  it('é um rádio que marca a escolha', async () => {
    // Arrange
    const onPress = jest.fn();
    await render(<AlternativeOption letter="B" text="{5/6}" state="selected" onPress={onPress} />);
    const option = screen.getByRole('radio', { name: 'Alternativa B: 5 sobre 6' });

    // Act
    await fireEvent.press(option);

    // Assert
    expect(option).toBeChecked();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('depois de responder, diz qual é a correta e não aceita toque', async () => {
    // Arrange
    const onPress = jest.fn();
    await render(
      <AlternativeOption letter="B" text="{5/6}" state="correct" onPress={onPress} disabled />,
    );
    const option = screen.getByRole('radio', { name: 'Alternativa B: 5 sobre 6, correta' });

    // Act
    await fireEvent.press(option);

    // Assert
    expect(onPress).not.toHaveBeenCalled();
    expect(option).toBeDisabled();
  });

  it('a errada é dita como a resposta errada do aluno', async () => {
    // Act
    await render(
      <AlternativeOption letter="A" text="{2/5}" state="wrong" onPress={jest.fn()} disabled />,
    );

    // Assert
    expect(
      screen.getByRole('radio', { name: 'Alternativa A: 2 sobre 5, sua resposta, errada' }),
    ).toBeTruthy();
  });
});

describe('<TopicCard />', () => {
  it('o disponível com nota mostra "Em andamento", a nota, a meta e "Continuar"', async () => {
    // Act
    await render(<TopicCard name="Frações" status="available" score={54.9} onPress={jest.fn()} />);

    // Assert
    expect(
      screen.getByRole('button', { name: 'Frações, em andamento, nota 54, meta 70' }),
    ).toBeTruthy();
    expect(screen.getByText('Continuar')).toBeTruthy();
  });

  it('o bloqueado diz o que exige e ainda abre', async () => {
    // Arrange
    const onPress = jest.fn();
    await render(
      <TopicCard
        name="Porcentagem"
        status="locked"
        score={null}
        requires="Requer Frações e Equações do 1º grau"
        onPress={onPress}
      />,
    );

    // Act
    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Porcentagem, bloqueado. Requer Frações e Equações do 1º grau',
      }),
    );

    // Assert
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('o dominado mostra a nota', async () => {
    // Act
    await render(
      <TopicCard name="Operações básicas" status="mastered" score={86} onPress={jest.fn()} />,
    );

    // Assert
    expect(
      screen.getByRole('button', { name: 'Operações básicas, dominado, nota 86' }),
    ).toBeTruthy();
  });
});
