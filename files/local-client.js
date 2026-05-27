/**
 * iCloud Drive (local sync folder) — filesystem access
 *
 * Reads files under the macOS iCloud Drive sync path (not CloudKit API).
 * Default: ~/Library/Mobile Documents/com~apple~CloudDocs
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const DEFAULT_ROOT = path.join(
  os.homedir(),
  'Library/Mobile Documents/com~apple~CloudDocs'
);

const MAX_READ_BYTES = 512 * 1024; // 512 KB

function getRoot() {
  return process.env.ICLOUD_DRIVE_PATH || DEFAULT_ROOT;
}

function resolveSafePath(relativePath = '') {
  const root = path.resolve(getRoot());
  const target = path.resolve(root, relativePath || '.');

  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error('Path is outside the iCloud Drive folder');
  }

  return target;
}

async function getDriveInfo() {
  const root = getRoot();
  let exists = false;
  let accessible = false;

  try {
    await fs.access(root);
    exists = true;
    accessible = true;
  } catch {
    exists = false;
  }

  return {
    root,
    exists,
    accessible,
    note: 'Local sync folder only. Cloud-only files may not be downloaded yet.'
  };
}

async function listFiles(relativePath = '', { recursive = false, maxDepth = 2 } = {}) {
  const dir = resolveSafePath(relativePath);
  const stat = await fs.stat(dir);

  if (!stat.isDirectory()) {
    throw new Error('Path is not a directory');
  }

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);
    const rel = path.join(relativePath || '', entry.name);
    let size = null;
    let modified = null;

    try {
      const st = await fs.stat(fullPath);
      size = st.size;
      modified = st.mtime.toISOString();
    } catch {
      // cloud-only placeholder
    }

    const item = {
      name: entry.name,
      path: rel,
      type: entry.isDirectory() ? 'directory' : 'file',
      size,
      modified
    };

    results.push(item);

    if (recursive && entry.isDirectory() && maxDepth > 0) {
      const children = await listFiles(rel, { recursive: true, maxDepth: maxDepth - 1 });
      item.children = children;
    }
  }

  results.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return results;
}

async function readFileText(relativePath, maxBytes = MAX_READ_BYTES) {
  const filePath = resolveSafePath(relativePath);
  const stat = await fs.stat(filePath);

  if (!stat.isFile()) {
    throw new Error('Path is not a file');
  }

  if (stat.size > maxBytes) {
    throw new Error(`File too large (${stat.size} bytes). Max ${maxBytes} bytes.`);
  }

  const buffer = await fs.readFile(filePath);
  const textExtensions = ['.txt', '.md', '.json', '.csv', '.xml', '.html', '.js', '.ts', '.yaml', '.yml', '.env'];

  const ext = path.extname(filePath).toLowerCase();
  const isText = textExtensions.includes(ext) || !buffer.includes(0);

  if (!isText) {
    throw new Error('File does not look like text. Use a binary-safe workflow outside this tool.');
  }

  return {
    path: relativePath,
    size: stat.size,
    modified: stat.mtime.toISOString(),
    content: buffer.toString('utf8')
  };
}

module.exports = {
  getDriveInfo,
  listFiles,
  readFileText,
  getRoot,
  MAX_READ_BYTES
};
