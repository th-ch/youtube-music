import builder from '.';

export default builder.createRenderer(() => ({
  async onLoad() {
    // See https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass#userscript
    await import('simple-youtube-age-restriction-bypass');
  },
}));
