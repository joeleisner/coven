import { defineConfig } from 'vite';
import deno from '@deno/vite-plugin';
import postcssMixins from 'postcss-mixins';

export default defineConfig({
	plugins: [deno()],
	css: {
		postcss: {
			plugins: [postcssMixins],
		},
	},
});
