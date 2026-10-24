import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// `npm run dev` also serves /api/* from the ./api folder, so the whole site works locally.
// On Vercel the same files run as serverless functions.
function localApi() {
  return {
    name: 'wishbox-local-api',
    config(_, { mode }) {
      const env = loadEnv(mode, process.cwd(), '');
      for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://x');
        const m = url.pathname.match(/^\/api\/([a-z]+)$/);
        if (!m) return next();
        try {
          const mod = await server.ssrLoadModule(path.resolve(`api/${m[1]}.js`));
          await mod.default(req, res);
        } catch (e) {
          if (e.code === 'ERR_MODULE_NOT_FOUND' && String(e.message).includes('mongodb')) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'The mongodb package is missing. Run: npm install' }));
          }
          console.error('[api]', e);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API error: ' + e.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApi()],
  base: './', // relative paths: works on Netlify, Vercel, GitHub Pages, any static host
});
