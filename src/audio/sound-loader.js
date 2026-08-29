// Loads the game sound assets from public/sounds/ and decodes them into
// AudioBuffers for the Web Audio engine.
//
// Logical sound name -> file in public/sounds/.
// Looping sounds (thrust, ambient, drain, wobble) should be short and seamless;
// one-shots (fire, explosion, dock, complete) are single events.
export const SOUND_FILES = {
  shipThrust: 'ship_thrust.mp3',
  podThrust: 'pod_thrust.wav',
  shipFire: 'ship_fire.wav',
  podFire: 'pod_fire.wav',
  bunkerFire: 'bunker_fire.wav',
  podWobble: 'pod_wobble.wav',
  explosion: 'explosion.mp3',
  fuelDrain: 'fuel_drain.wav',
  podDock: 'pod_dock.wav',
  wormholeAmbient: 'wormhole_ambient.mp3',
  wormholeComplete: 'wormhole_complete.wav',
  noFuel: 'no-fuel.mp3',
  respawn: 'respawn.mp3',
  powerupGodMode: 'powerup_godmode.mp3',
  powerupMultiShot: 'powerup_multishot.mp3',
};

// Fetch and decode every sound file. Errors are logged with a unique tag and
// rethrown so a missing/broken asset is surfaced instead of silently ignored.
export async function loadSoundBuffers(audioContext, basePath = '/sounds/') {
  const entries = await Promise.all(
    Object.entries(SOUND_FILES).map(async ([name, file]) => {
      const url = basePath + file;
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[SOUND_LOADER] Failed to fetch ${url}: HTTP ${response.status}`);
        throw new Error(`Failed to fetch sound ${url}: HTTP ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return [name, audioBuffer];
    })
  );

  const buffers = {};
  for (const [name, buffer] of entries) {
    buffers[name] = buffer;
  }
  console.log('[SOUND_LOADER] Loaded', Object.keys(buffers).length, 'sounds');
  return buffers;
}
