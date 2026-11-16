import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

const PATHS = {
  check: <Polyline points="4 12 9 17 20 6" />,
  lock: (
    <>
      <Rect x={5} y={11} width={14} height={9} rx={2} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  chevronRight: <Path d="M9 5l7 7-7 7" />,
  chevronLeft: <Path d="M15 5l-7 7 7 7" />,
  close: <Path d="M6 6l12 12M18 6L6 18" />,
  wrong: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M9 9l6 6M15 9l-6 6" />
    </>
  ),
  cards: (
    <>
      <Rect x={3} y={6} width={14} height={12} rx={2} />
      <Path d="M7 6V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    </>
  ),
  trail: (
    <>
      <Circle cx={6} cy={19} r={2.5} />
      <Circle cx={18} cy={5} r={2.5} />
      <Path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5" />
    </>
  ),
  map: (
    <>
      <Circle cx={6} cy={6} r={2.5} />
      <Circle cx={18} cy={8} r={2.5} />
      <Circle cx={12} cy={18} r={2.5} />
      <Path d="M8.5 6.4L15.5 7.6M7 8.4L11 15.6M17 10.4L13 15.6" />
    </>
  ),
  user: (
    <>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 20a8 8 0 0 1 16 0" />
    </>
  ),
  arrowDown: <Path d="M12 5v14M6 13l6 6 6-6" />,
  arrowUp: <Path d="M12 19V5M6 11l6-6 6 6" />,
} as const;

export type IconName = keyof typeof PATHS;

type Props = {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
};

/** Ícone de traço, desenhado no app (sem fonte de ícones). É decorativo: quem o usa dá o rótulo ao elemento em volta. */
export function Icon({ name, size = 20, color, strokeWidth = 2.2 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {PATHS[name]}
    </Svg>
  );
}
