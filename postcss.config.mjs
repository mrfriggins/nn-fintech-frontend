/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // This is the new plugin name
    'autoprefixer': {},
  },
};

export default config;