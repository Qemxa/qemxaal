export const themes = {
  'dark-blue': {
    '--color-primary': '59 130 246', // blue-500
    '--color-primary-hover': '37 99 235', // blue-600
    '--color-background': '17 24 39', // gray-900
    '--color-surface': '31 41 55', // gray-800
    '--color-surface-hover': '55 65 81', // gray-700
    '--color-secondary': '75 85 99', // gray-600
    '--color-text-main': '249 250 251', // gray-50
    '--color-text-light': '209 213 219', // gray-300
    '--color-text-dim': '156 163 175', // gray-400
  },
  'light': {
    '--color-primary': '59 130 246', // blue-500
    '--color-primary-hover': '37 99 235', // blue-600
    '--color-background': '243 244 246', // gray-100
    '--color-surface': '255 255 255', // white
    '--color-surface-hover': '249 250 251', // gray-50
    '--color-secondary': '209 213 219', // gray-300
    '--color-text-main': '17 24 39', // gray-900
    '--color-text-light': '55 65 81', // gray-700
    '--color-text-dim': '107 114 128', // gray-500
  },
  'midnight': {
    '--color-primary': '99 102 241', // indigo-500
    '--color-primary-hover': '79 70 229', // indigo-600
    '--color-background': '16 16 22', // near black
    '--color-surface': '28 28 36', // dark gray
    '--color-surface-hover': '42 42 50', // darker gray
    '--color-secondary': '60 60 70', // even darker gray
    '--color-text-main': '238 238 238', // near white
    '--color-text-light': '180 180 180', // light gray
    '--color-text-dim': '120 120 120', // medium gray
  },
};

export type ThemeName = keyof typeof themes;
