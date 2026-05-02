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
          
          let hash = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'latest';
          try {
            hash = execSync('git rev-parse --short HEAD', { stdio: 'ignore' }).toString().trim();
          } catch (e) {
            // ignore git error
          }
          
          version = `v${pkg.version} (Build ${hash})`;
          
          // Parse CHANGELOG.md for the most recent version
          try {
            const md = readFileSync(path.resolve(__dirname, 'CHANGELOG.md'), 'utf8');
            // Find the first section under ## [version]
            const match = md.match(/## \[[^\]]+\][^\n]*\n([\s\S]*?)(?=## \[|$)/);
            if (match && match[1]) {
              const lines = match[1].split('\n').filter(l => l.trim().startsWith('-'));
              changelog = lines.map((line, i) => {
                // Keep the styling clean for the UI
                const msg = line.replace(/^- \*\*(.*?)\*\*:\s*/, '$1: ').replace(/^- /, '');
                return { hash: `log-${i}`, msg, time: new Date().toLocaleDateString(), author: 'Release Team' };
              });
            }
          } catch (e) {
            console.error('Failed to parse CHANGELOG.md', e);
          }
        } catch(e) {
          console.error('Failed to generate virtual git info', e);
        }
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
