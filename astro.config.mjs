import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import solid from '@astrojs/solid-js';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    solid(),
    tailwind()
  ],
  vite: {
    ssr: {
      noExternal: ['@heroicons/react']
    }
  }
});