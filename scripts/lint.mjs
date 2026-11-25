import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function collectFiles(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

const jsFiles = [
  ...collectFiles(path.join(ROOT_DIR, 'src/js'), ['.js', '.mjs']),
  ...collectFiles(path.join(ROOT_DIR, 'scripts'), ['.js', '.mjs']),
  path.join(ROOT_DIR, 'vite.config.js')
].filter(f => fs.existsSync(f));

const errors = [];

for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (err) {
    errors.push(`Syntax error in ${path.relative(ROOT_DIR, file)}: ${err.stderr?.toString() || err.message}`);
  }

  const content = fs.readFileSync(file, 'utf8');
  if (file.startsWith(path.join(ROOT_DIR, 'src/js'))) {
    if (/\beval\s*\(/.test(content) || /new\s+Function\s*\(/.test(content)) {
      errors.push(`Forbidden dynamic code evaluation in ${path.relative(ROOT_DIR, file)}`);
    }
    if (/(\/home\/[a-zA-Z0-9_-]+|\/Users\/[a-zA-Z0-9_-]+|C:\\Users\\|\.gemini\/)/i.test(content)) {
      errors.push(`Exposed local machine path in ${path.relative(ROOT_DIR, file)}`);
    }
  }
}

const htmlFiles = ['index.html', 'about/index.html', 'workflow/index.html']
  .map(rel => path.join(ROOT_DIR, rel))
  .filter(f => fs.existsSync(f));

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('<main') || !html.includes('<nav') || !html.includes('<h1')) {
    errors.push(`Missing semantic landmark (<main>/<nav>/<h1>) in ${path.relative(ROOT_DIR, file)}`);
  }
}

if (errors.length > 0) {
  console.error('Lint failed:\n' + errors.map(e => `  - ${e}`).join('\n'));
  process.exit(1);
}

console.log(`Lint OK: ${jsFiles.length} JS/MJS files and ${htmlFiles.length} HTML entrypoints verified with 0 errors.`);

