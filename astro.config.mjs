// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	// User page: served from the domain root, so no `base` is needed.
	site: 'https://jub0t.github.io',

	vite: {
		plugins: [tailwindcss()],
	},

	integrations: [mdx(), icon()],
});
