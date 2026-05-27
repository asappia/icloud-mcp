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
