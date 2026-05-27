/**
 * iCloud Drive files module (local sync folder only)
 */

const localClient = require('./local-client');
const { handleError } = require('../utils/error-handler');

const filesTools = [
  {
    name: 'icloud-drive-info',
    description: 'Show the local iCloud Drive sync folder path and whether it is accessible',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      try {
        const info = await localClient.getDriveInfo();
        return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
      } catch (error) {
        return handleError(error, 'icloud-drive-info');
      }
    }
  },
  {
    name: 'list-icloud-files',
    description: 'List files and folders in your local iCloud Drive sync folder (not cloud-only placeholders)',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path relative to iCloud Drive root (default: root)'
        },
        recursive: {
          type: 'boolean',
          description: 'Include subfolders (default: false)'
        },
        maxDepth: {
          type: 'number',
          description: 'Max recursion depth when recursive (default: 2)'
        }
      },
      required: []
    },
    handler: async ({ path: relPath = '', recursive = false, maxDepth = 2 }) => {
      try {
        const files = await localClient.listFiles(relPath, { recursive, maxDepth });
        return { content: [{ type: 'text', text: JSON.stringify(files, null, 2) }] };
      } catch (error) {
        return handleError(error, 'list-icloud-files');
      }
    }
  },
  {
    name: 'icloud-drive-summary',
    description: 'Overview of iCloud Drive: size and file count per top-level folder (helps find clutter)',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      try {
        const summary = await localClient.getDriveSummary();
        const lines = [
          `Root: ${summary.root}`,
          `Files at root level: ${summary.rootLevelFiles} (${localClient.formatBytes(summary.rootLevelSizeBytes)})`,
          '',
          'Folders (by size):'
        ];
        for (const folder of summary.folders) {
          let line = `- ${folder.name}: ${folder.fileCount} files, ${localClient.formatBytes(folder.totalSizeBytes)}`;
          if (folder.truncated) line += ' (scan truncated)';
          if (folder.cloudOnlyCount) line += `, ${folder.cloudOnlyCount} cloud-only`;
          lines.push(line);
        }
        return {
          content: [{
            type: 'text',
            text: lines.join('\n') + '\n\n' + JSON.stringify(summary, null, 2)
          }]
        };
      } catch (error) {
        return handleError(error, 'icloud-drive-summary');
      }
    }
  },
  {
    name: 'scan-icloud-drive',
    description: 'Scan iCloud Drive and list files with path, size, and modified date (inventory)',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Subfolder to scan (default: entire drive)' },
        maxDepth: { type: 'number', description: 'Max folder depth (default: 8)' },
        maxFiles: { type: 'number', description: 'Stop after N files (default: 5000)' }
      },
      required: []
    },
    handler: async ({ path: relPath = '', maxDepth = 8, maxFiles = 5000 }) => {
      try {
        const result = await localClient.walkDrive({ relativePath: relPath, maxDepth, maxFiles });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return handleError(error, 'scan-icloud-drive');
      }
    }
  },
  {
    name: 'search-icloud-files',
    description: 'Search iCloud Drive files by name or path',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text to find in file or folder name' },
        maxResults: { type: 'number', description: 'Max matches (default: 100)' }
      },
      required: ['query']
    },
    handler: async ({ query, maxResults = 100 }) => {
      try {
        const result = await localClient.searchFiles(query, { maxResults });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return handleError(error, 'search-icloud-files');
      }
    }
  },
  {
    name: 'read-icloud-file',
    description: 'Read a small text file from the local iCloud Drive sync folder (max 512KB)',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path relative to iCloud Drive root'
        }
      },
      required: ['path']
    },
    handler: async ({ path: relPath }) => {
      try {
        const file = await localClient.readFileText(relPath);
        return { content: [{ type: 'text', text: JSON.stringify(file, null, 2) }] };
      } catch (error) {
        return handleError(error, 'read-icloud-file');
      }
    }
  }
];

module.exports = { filesTools };
