import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

const gitPlugin = () => {
  const virtualModuleId = 'virtual:git-info'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'vite-plugin-git-info',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        let version = 'unknown';
        let changelog: any[] = [];
        try {
          const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'));
          const hash = execSync('git rev-parse --short HEAD').toString().trim();
          version = `v${pkg.version} (Build ${hash})`;
          
          const logStr = execSync('git log -n 10 --pretty=format:"%h|%s|%cr|%an"').toString();
          changelog = logStr.split('\n').filter(Boolean).map((line: string) => {
            const [hash, rawMsg, time, author] = line.split('|');
            let msg = rawMsg.replace(/^(feat|fix|chore|docs|refactor|style|test|perf|build|ci|revert)(\([a-zA-Z0-9\-\_]+\))?:\s*/i, '');
            msg = msg.charAt(0).toUpperCase() + msg.slice(1);
            return { hash, msg, time, author };
          });
        } catch(e) {}
        return `export const version = ${JSON.stringify(version)}; export const changelog = ${JSON.stringify(changelog)};`
      }
    },
    configureServer(server: any) {
      server.watcher.add(path.resolve(__dirname, '.git/logs/HEAD'));
      server.watcher.on('change', (file: string) => {
        if (file.includes('.git/logs/HEAD') || file.includes('.git\\logs\\HEAD')) {
          const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: 'full-reload', path: '*' });
          }
        }
      });
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    gitPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
