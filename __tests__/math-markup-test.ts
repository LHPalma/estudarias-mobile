import { parseMath, speakMath } from '@/lib/math-markup';

describe('parseMath', () => {
  it('texto sem marcação é um único trecho de texto', () => {
    // Act
    const segments = parseMath('Some os numeradores.');

    // Assert
    expect(segments).toEqual([{ kind: 'text', value: 'Some os numeradores.' }]);
  });

  it('separa as frações do texto ao redor, na ordem', () => {
    // Act
    const segments = parseMath('Quanto é {1/2} + {1/3}?');

    // Assert
    expect(segments).toEqual([
      { kind: 'text', value: 'Quanto é ' },
      { kind: 'fraction', numerator: '1', denominator: '2' },
      { kind: 'text', value: ' + ' },
      { kind: 'fraction', numerator: '1', denominator: '3' },
      { kind: 'text', value: '?' },
    ]);
  });

  it('aceita espaços dentro das chaves, sinal e letras', () => {
    // Act
    const segments = parseMath('{ -3 / x }');

    // Assert
    expect(segments).toEqual([{ kind: 'fraction', numerator: '-3', denominator: 'x' }]);
  });

  it.each(['{1/}', '{/2}', '{1 2/3}', '{1/2', '1/2}', '{}'])(
    'marcação malformada (%s) continua como texto',
    (source) => {
      // Act
      const segments = parseMath(source);

      // Assert
      expect(segments).toEqual([{ kind: 'text', value: source }]);
    },
  );

  it('texto vazio não tem trechos', () => {
    // Act & Assert
    expect(parseMath('')).toEqual([]);
  });
});

describe('speakMath', () => {
  it('lê as frações como "a sobre b" para o leitor de tela', () => {
    // Act & Assert
    expect(speakMath('{1/2} + {1/3} = {5/6}')).toBe('1 sobre 2 + 1 sobre 3 = 5 sobre 6');
  });
});
