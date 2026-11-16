import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';

/**
 * As fontes vêm dos pacotes @expo-google-fonts e vão empacotadas no app: nada é baixado do Google em tempo de execução,
 * o que importa num plano pré-pago. Só os pesos usados entram, para o pacote não crescer à toa.
 */
export const fontAssets = {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
};

// No Android, o peso vem do arquivo da fonte, não de fontWeight: cada peso é uma família própria.
export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  body: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemi: 'InstrumentSans_600SemiBold',
  bodyBold: 'InstrumentSans_700Bold',
} as const;
