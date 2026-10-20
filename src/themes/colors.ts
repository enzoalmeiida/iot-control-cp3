export const themes = {
  dark: {
    background: '#08111f', surface: '#111e30', raised: '#192a40',
    text: '#f2f6ff', muted: '#a5b5cc', border: '#2a3b52',
    accent: '#5ce0c0', onAccent: '#06251f', danger: '#ff9ca6', warning: '#ffd486',
  },
  light: {
    background: '#f1f5f9', surface: '#ffffff', raised: '#e8eff6',
    text: '#10233b', muted: '#52657b', border: '#cfdae6',
    accent: '#087f6a', onAccent: '#ffffff', danger: '#b4233b', warning: '#805400',
  },
};
export type Palette = typeof themes.dark;
