import { defineConfig } from 'vite';

import postcssMixins from 'postcss-mixins';

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        postcssMixins
      ],
    },
  }
});
