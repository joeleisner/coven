import { defineConfig } from 'vite';
import deno from '@deno/vite-plugin';

export default defineConfig({
	plugins: [deno()],
	resolve: {
		alias: {
			'@src': new URL('./src', import.meta.url).pathname,
		},
	},
});
