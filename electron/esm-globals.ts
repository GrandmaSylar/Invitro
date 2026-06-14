import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

Object.defineProperty(globalThis, '__filename', { value: __filename, configurable: true });
Object.defineProperty(globalThis, '__dirname', { value: __dirname, configurable: true });
