# Game sound assets

This directory holds the sound effects for the Web Audio engine. The loader expects the following filenames (all files should be `.wav`, `.ogg` or `.mp3` and will be decoded at runtime):

| File | Sound event | Type |
|---|---|---|
| `ship_thrust.mp3` | Ship accelerating | short loop |
| `pod_thrust.wav` | Pod accelerating (2-player) | short loop, distinct from ship |
| `ship_fire.wav` | Ship / turret firing | one-shot |
| `pod_fire.wav` | Pod firing (2-player docked) | one-shot, distinct from ship |
| `bunker_fire.wav` | Bunker shooting | one-shot, distinct enemy shot |
| `pod_wobble.wav` | POD / tractor-shield active | loop / wobble drone |
| `explosion.mp3` | Ship / bunker / pod explosion | one-shot |
| `fuel_drain.wav` | Fuel draining while shield active | subtle loop |
| `pod_dock.wav` | Pod docking to ship | one-shot |
| `wormhole_ambient.wav` | Wormhole visible | loop, longer is better |
| `wormhole_complete.wav` | Level finished through wormhole | one-shot |

## Suggested free sources

- **Kenney Sci-Fi Sounds** (CC0) - <https://kenney.nl/assets/sci-fi-sounds>
- **Kenney Digital Audio** (CC0) - <https://kenney.nl/assets/digital-audio>
- **OpenGameArt 63 Digital SFX** (CC0) - <https://opengameart.org/content/63-digital-sound-effects-lasers-phasers-space-etc>
- **Mixkit Space Shooter** - <https://mixkit.co/free-sound-effects/space-shooter/>
- **Mixkit Laser** - <https://mixkit.co/free-sound-effects/laser/>
- **Mixkit Engine/Rocket** - <https://mixkit.co/free-sound-effects/rocket/>
- **Freesound** - search for "spaceship engine", "retro blaster", "sci-fi explosion"

## Notes for choosing assets

- Looping sounds (`*_thrust`, `*_wobble`, `fuel_drain`, `wormhole_ambient`) must be short and seamless; use `.wav` or `.ogg` without a sharp fade-in/fade-out.
- Keep files small and mono or stereo at a sensible sample rate; the decoder runs in the browser.
- If a file is missing the loader will log the error and the game will start without audio for that event.

## Credits

| File | Source | Author | License |
|---|---|---|---|
| `ship_thrust.mp3` | [Pixabay Sound ID 59704](https://pixabay.com/sound-effects/rocket-thrust-effectwav-59704/) | freesound_community | Pixabay License |
| `pod_thrust.wav` | [Thruster](https://opengameart.org/content/thruster) | EZduzziteh | CC0 |
| `ship_fire.wav`, `pod_fire.wav`, `bunker_fire.wav`, `wormhole_complete.wav` | [Space Sound Effects](https://opengameart.org/content/space-sound-effects) | messersm | CC0 |
| `explosion.mp3` | [Pixabay Sound ID 47821](https://pixabay.com/sound-effects/freesound_community-explosion-47821/) | freesound_community | Pixabay License |
| `pod_wobble.wav`, `fuel_drain.wav`, `pod_dock.wav` | [63 Digital sound effects](https://opengameart.org/content/63-digital-sound-effects-lasers-phasers-space-etc) | Kenney | CC0 |
| `wormhole_ambient.wav` | [Sci-Fi Drone Loop](https://opengameart.org/content/sci-fi-drone-loop) | jdagenet | CC-BY 3.0 |

`wormhole_ambient.wav` is licensed under CC-BY 3.0 and is used with attribution above.
