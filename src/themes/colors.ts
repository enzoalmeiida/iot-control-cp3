export const themes = {
  dark: {
    background: '#090f1a', surface: '#121c2c', raised: '#1a273a',
    text: '#f2f6fc', muted: '#9cacc2', border: '#25344a',
    accent: '#67e8c2', onAccent: '#07392d', danger: '#ff9ba8', warning: '#f7cc7f',
    temperature: '#ffb27f', humidity: '#83baff',
    tint: '#122e2c', hero: '#17413b', track: '#203247',
  },
  light: {
    background: '#f2f5f8', surface: '#ffffff', raised: '#eaf0f6',
    text: '#152b42', muted: '#5a6e83', border: '#dce5ed',
    accent: '#087d64', onAccent: '#ffffff', danger: '#b92844', warning: '#876009',
    temperature: '#b65420', humidity: '#286cb5',
    tint: '#e5f5ee', hero: '#d4eee3', track: '#dfe8f0',
  },
};
export type Palette = typeof themes.dark;
