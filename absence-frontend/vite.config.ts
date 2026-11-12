import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function htmlMetadataPlugin(): Plugin {
  return {
    name: 'html-metadata-plugin',
    transformIndexHtml(html: string) {
      const siteUrl =
        process.env.VITE_PUBLIC_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

      if (siteUrl) {
        const origin = siteUrl.startsWith('http') ? siteUrl.replace(/\/$/, '') : `https://${siteUrl.replace(/\/$/, '')}`;
        return html
          .replace(/content="\/Banner-Metadata\.png"/g, `content="${origin}/Banner-Metadata.png"`)
          .replace(/content="\/logo\.png"/g, `content="${origin}/logo.png"`);
      }
      return html;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), htmlMetadataPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
