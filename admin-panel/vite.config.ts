import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  // `pg` is a Node-only dependency — keep it external from the SSR bundle.
  ssr: { external: ['pg'] },
});
