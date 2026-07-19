export const COLORS = {
  red: '#E8002D',
  redDark: '#A8001F',
  redLight: '#FFF0F2',
  redBorder: '#FFBDC8',
  yellow: '#FFC72C',
  yellowDark: '#C9960A',
  yellowLight: '#FFFBEA',
  white: '#FFFFFF',
  black: '#000000',
  bg: '#F6F6F8',
  gray50: '#FAFAFA',
  gray100: '#F2F2F2',
  gray200: '#E4E4E4',
  gray300: '#CCCCCC',
  gray400: '#AAAAAA',
  gray500: '#777777',
  gray600: '#555555',
  gray700: '#333333',
  gray900: '#111111',
  green: '#16A34A',
  greenLight: '#F0FDF4',
  greenBorder: '#BBF7D0',
  blue: '#1D4ED8',
  blueLight: '#EFF6FF',
  blueBorder: '#BFDBFE',
  orange: '#EA580C',
  orangeLight: '#FFF7ED',
};

export const ICON_SIZE = 24;
export const ICON_COLOR = {
  active: COLORS.red,
  inactive: COLORS.gray400,
};

export const BRAND = {
  jollibee: {
    label: 'Jollibee',
    emoji: '🐝',
    color: COLORS.red,
    light: COLORS.redLight,
    border: COLORS.redBorder,
  },
  mcdo: {
    label: "McDonald's",
    emoji: '🍟',
    color: COLORS.yellowDark,
    light: COLORS.yellowLight,
    border: '#FFE08A',
  },
} as const;

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';