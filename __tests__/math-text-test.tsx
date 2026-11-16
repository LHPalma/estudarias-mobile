import { render, screen } from '@testing-library/react-native';

import { Fraction } from '@/components/Fraction';
import { MathText } from '@/components/MathText';

describe('<Fraction />', () => {
  it('mostra o numerador e o denominador e se apresenta como "a sobre b"', async () => {
    // Act
    await render(<Fraction numerator={5} denominator={6} />);

    // Assert
    expect(screen.getByLabelText('5 sobre 6')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
  });
});

describe('<MathText />', () => {
  it('desenha as frações no meio do texto, com um rótulo único para o leitor de tela', async () => {
    // Act
    await render(<MathText>{'Quanto é {1/2} + {1/3}?'}</MathText>);

    // Assert
    expect(screen.getByLabelText('Quanto é 1 sobre 2 + 1 sobre 3?')).toBeTruthy();
    expect(screen.getByLabelText('1 sobre 2')).toBeTruthy();
    expect(screen.getByLabelText('1 sobre 3')).toBeTruthy();
    expect(screen.getByText('Quanto')).toBeTruthy();
  });
});
