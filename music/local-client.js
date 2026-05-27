/**
 * Local Music Client
 * Controls Music.app via AppleScript / JXA (local mode only)
 */

const { runAppleScript, runJXA, escapeAppleScript, escapeJXA } = require('../utils/applescript');

/**
 * Current track and player state
 */
async function getNowPlaying() {
  const script = `
    const music = Application('Music');
    const state = music.playerState();
    if (state === 'stopped') {
      JSON.stringify({ playing: false, state: 'stopped' });
    } else {
      let track = null;
      try {
        track = music.currentTrack;
      } catch (e) {}
      if (!track) {
        JSON.stringify({ playing: state === 'playing', state: state });
      } else {
        JSON.stringify({
          playing: state === 'playing',
          state: state,
          name: track.name() || '',
          artist: track.artist() || '',
          album: track.album() || '',
          duration: track.duration() || 0,
          position: music.playerPosition() || 0,
          shuffle: music.shuffleEnabled(),
          repeat: music.songRepeat()
        });
      }
    }
  `;

  const result = await runJXA(script);
  return result ? JSON.parse(result) : { playing: false, state: 'unknown' };
}

/**
 * Playback control
 * @param {'play'|'pause'|'stop'|'next'|'previous'|'playpause'|'resume'} action
 */
async function playback(action) {
  const allowed = {
    play: 'play',
    pause: 'pause',
    stop: 'stop',
    next: 'next track',
    previous: 'previous track',
    playpause: 'playpause',
    resume: 'resume'
  };

  const command = allowed[action];
  if (!command) {
    throw new Error(`Unknown playback action: ${action}`);
  }

  const script = `
    tell application "Music"
      ${command}
    end tell
    return "ok"
  `;

  await runAppleScript(script);
  return { success: true, action };
}

/**
 * Set volume (0-100)
 */
async function setVolume(level) {
  const volume = Math.max(0, Math.min(100, Math.round(Number(level))));
  const script = `
    tell application "Music"
      set sound volume to ${volume}
    end tell
    return "ok"
  `;
  await runAppleScript(script);
  return { success: true, volume };
}

/**
 * List user playlists
 */
async function listPlaylists() {
  const script = `
    const music = Application('Music');
    const playlists = music.userPlaylists;
    const names = playlists.name();
    let result = [];
    for (let i = 0; i < names.length; i++) {
      result.push({ name: names[i], index: i + 1 });
    }
    JSON.stringify(result);
  `;

  const result = await runJXA(script);
  return result ? JSON.parse(result) : [];
}

/**
 * Play a user playlist by name
 */
async function playPlaylist(name, shuffle = false) {
  const script = `
    tell application "Music"
      ${shuffle ? 'set shuffle enabled to true' : ''}
      play user playlist "${escapeAppleScript(name)}"
    end tell
    return "ok"
  `;
  await runAppleScript(script);
  return { success: true, playlist: name, shuffle };
}

/**
 * Search library tracks (name / artist / album)
 */
async function searchLibrary(query, count = 25) {
  const term = escapeJXA(query.toLowerCase());

  const script = `
    const music = Application('Music');
    const limit = ${Math.min(count, 50)};
    const term = "${term}";
    const tracks = music.libraryPlaylistItems;
    let result = [];

    for (let i = 0; i < tracks.length && result.length < limit; i++) {
      try {
        const t = tracks[i];
        const name = (t.name() || '').toLowerCase();
        const artist = (t.artist() || '').toLowerCase();
        const album = (t.album() || '').toLowerCase();
        if (name.includes(term) || artist.includes(term) || album.includes(term)) {
          result.push({
            name: t.name() || '',
            artist: t.artist() || '',
            album: t.album() || '',
            duration: t.duration() || 0
          });
        }
      } catch (e) {}
    }
    JSON.stringify(result);
  `;

  const result = await runJXA(script);
  return result ? JSON.parse(result) : [];
}

/**
 * Play first library track matching query
 */
async function playTrack(query) {
  const script = `
    tell application "Music"
      set matches to (search library playlist 1 for "${escapeAppleScript(query)}" only songs)
      if (count of matches) is 0 then
        return "not found"
      end if
      play item 1 of matches
      return name of item 1 of matches
    end tell
  `;

  const name = await runAppleScript(script);
  if (name === 'not found') {
    throw new Error(`No track found for: ${query}`);
  }
  return { success: true, playing: name, query };
}

module.exports = {
  getNowPlaying,
  playback,
  setVolume,
  listPlaylists,
  playPlaylist,
  searchLibrary,
  playTrack
};
