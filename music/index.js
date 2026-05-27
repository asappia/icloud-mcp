/**
 * Music module — Music.app (local mode only)
 */

const localClient = require('./local-client');
const { handleError } = require('../utils/error-handler');

const musicTools = [
  {
    name: 'music-now-playing',
    description: 'Get the currently playing track and player state from Music.app',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      try {
        const info = await localClient.getNowPlaying();
        return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
      } catch (error) {
        return handleError(error, 'music-now-playing');
      }
    }
  },
  {
    name: 'music-playback',
    description: 'Control Music.app playback: play, pause, stop, next, previous, playpause, resume',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['play', 'pause', 'stop', 'next', 'previous', 'playpause', 'resume'],
          description: 'Playback action'
        }
      },
      required: ['action']
    },
    handler: async ({ action }) => {
      try {
        const result = await localClient.playback(action);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return handleError(error, 'music-playback');
      }
    }
  },
  {
    name: 'music-set-volume',
    description: 'Set Music.app volume (0-100)',
    inputSchema: {
      type: 'object',
      properties: {
        volume: { type: 'number', description: 'Volume level 0-100' }
      },
      required: ['volume']
    },
    handler: async ({ volume }) => {
      try {
        const result = await localClient.setVolume(volume);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return handleError(error, 'music-set-volume');
      }
    }
  },
  {
    name: 'music-list-playlists',
    description: 'List user playlists in Music.app',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      try {
        const playlists = await localClient.listPlaylists();
        return { content: [{ type: 'text', text: JSON.stringify(playlists, null, 2) }] };
      } catch (error) {
        return handleError(error, 'music-list-playlists');
      }
    }
  },
  {
    name: 'music-play-playlist',
    description: 'Play a user playlist by name',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Playlist name' },
        shuffle: { type: 'boolean', description: 'Enable shuffle (default: false)' }
      },
      required: ['name']
    },
    handler: async ({ name, shuffle = false }) => {
      try {
        const result = await localClient.playPlaylist(name, shuffle);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return handleError(error, 'music-play-playlist');
      }
    }
  },
  {
    name: 'music-search-library',
    description: 'Search your Music library by track, artist, or album',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search text' },
        count: { type: 'number', description: 'Max results (default: 25, max: 50)' }
      },
      required: ['query']
    },
    handler: async ({ query, count = 25 }) => {
      try {
        const tracks = await localClient.searchLibrary(query, count);
        return { content: [{ type: 'text', text: JSON.stringify(tracks, null, 2) }] };
      } catch (error) {
        return handleError(error, 'music-search-library');
      }
    }
  },
  {
    name: 'music-play-track',
    description: 'Search the library and play the first matching track',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Track, artist, or album to search for' }
      },
      required: ['query']
    },
    handler: async ({ query }) => {
      try {
        const result = await localClient.playTrack(query);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return handleError(error, 'music-play-track');
      }
    }
  }
];

module.exports = { musicTools };
