# CaveShuttle - Space Game

A space game built with React, Vite, and HTML5 Canvas. Features modern graphics with particle effects, smooth camera, and responsive design.

- **Play online:** [https://caveshuttle.z11.de](https://caveshuttle.z11.de)
- **Android build:** supported via Capacitor (see [Mobile Support](#mobile-support))
- **Level editor:** create, edit and test levels directly in the browser or via `public/level-editor`

![CaveShuttle](https://img.shields.io/badge/CaveShuttle-Space%20Game-blue)
![React](https://img.shields.io/badge/React-18.0.0-green)
![Vite](https://img.shields.io/badge/Vite-5.0.0-purple)
![Vitest](https://img.shields.io/badge/Vitest-1.0.0-yellow)

## Features

- **Modern Graphics**: Smooth anti-aliased rendering with particle effects and screen shake
- **Complete Gameplay**: All 6 levels with accurate physics and mechanics
- **Pod Towing**: Tractor beam mechanics for picking up and towing the pod
- **Bunkers & Bullets**: Enemy bunkers that shoot at your ship
- **Buttons & Sliders**: Interactive level elements
- **Level Selection**: Direct level access via buttons
- **High Score System**: Persistent high scores using localStorage
- **Responsive Design**: Works on desktop and mobile
- **Touch Controls**: Mobile-friendly touch controls
- **Keyboard Shortcuts**: Quick access to game functions

## Controls

### Keyboard

| Key | Action |
|-----|--------|
| ↑ / W | Accelerate |
| ← / A | Rotate Left |
| → / D | Rotate Right |
| Space / Ctrl | Tractor Beam / Pod docking|
| X / Shift | Shoot |

### Tilt Steering

- turn left/right = ship rotation
- tilt forward/back = thrust (relative to calibrated neutral position)
- tap anywhere = fire
- Touch button for Tractor Beam & shield / Pod docking

### Touch / Joystick Control

Works with mouse and touch: starting from the touch point, moving right rotates the ship right, moving left rotates left, moving up accelerates.
**Explanation:**
It resets only the horizontal zero position (`joystickStart.x`) when horizontal movement stops, while keeping vertical movement independent. This way:
- Horizontal rotation only happens while actively moving left/right
- Vertical acceleration can continue independently
- e.g. If user slides right-up then continues only up, the horizontal zero position resets to stop rotation


### Game Over Screen

| Key | Action |
|-----|--------|
| Space | Play Again |
| Esc | Back to Menu |

## Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/caveshuttle.git
cd caveshuttle

# Install dependencies
npm install

# Start development server (Vite + Geckos server)
bash dev/run.sh
# App:     https://localhost:5173
# Editor:  https://localhost:5173/level-editor/
# Geckos:  https://localhost:9208

# Run tests
npm test

# Build for production
npm run build
```

### Production Deployment

The app consists of two parts that must be deployed separately:

1. **Static web app** (Vite build output in `dist/`)
2. **Geckos signaling server** (Node.js, `server/index.js`) — required for multiplayer

#### Deploy the web app

```bash
# Configure deployment target
cp dev/.env.example dev/.env
# Edit dev/.env with your server details:
#   REMOTE_USER, REMOTE_HOST, REMOTE_PATH,
#   REMOTE_CHOWN_USER, REMOTE_CHOWN_GROUP

# Build and deploy
bash dev/deploy.sh
```

This builds the app with `npm run build`, uploads `dist/` to your server via rsync,
**and also uploads `server/`, `package.json`, and `package-lock.json`**, then runs
`npm install --production` on the server automatically.

#### Run the Geckos server on production

The Geckos server must run on the same host as the web app, listening on port **9208**.
The client connects to `${window.location.protocol}//${window.location.hostname}:9208` automatically.

##### Install Node.js and npm (Debian/Ubuntu)

```bash
# Add NodeSource repository for Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# On some Debian versions (e.g. Trixie), npm may not be included.
# Install it separately if 'npm --version' fails:
apt install -y npm

# Verify
node --version   # should print v20.x
npm --version    # should print 9.x or higher
```

##### Start the server

`deploy.sh` automatically restarts the Geckos server via **pm2** after each deploy.
You only need to set up pm2 once on the production server:

```bash
# Install pm2 globally (one-time)
npm install -g pm2

# Start the server and enable auto-boot (one-time)
cd /var/kunden/webs/ruben/www/caveshuttle.z11.de
pm2 start server/index.js --name caveshuttle-geckos
pm2 startup
pm2 save
```

After that, every `bash dev/deploy.sh` will:
1. Upload `dist/`, `server/`, `package.json`, `package-lock.json`
2. Run `npm install --production` on the server
3. Restart the Geckos server via `pm2 restart caveshuttle-geckos`

> **Note:** The server only needs `server/index.js`, `package.json`, `package-lock.json`,
> and `node_modules/`. The static web files (`dist/`) are already deployed via `dev/deploy.sh`.

##### nginx reverse proxy (required for HTTPS)

The Geckos server runs on port **9208** (HTTP). In production, nginx must proxy
the Geckos endpoints on the same origin as the web app to avoid mixed-content
(CORS) issues. Add these location blocks to the HTTPS server config:

```nginx
# Geckos HTTP endpoint (public lobby check)
location /public-lobby {
    proxy_pass http://127.0.0.1:9208;
    proxy_set_header Host $host;
}

# Geckos WebRTC signaling (path starts with /.wrtc/)
location /.wrtc/ {
    proxy_pass http://127.0.0.1:9208;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}
```

The client automatically uses same-origin (no `:9208` port) in production and
port 9208 only for localhost development.

## Gameplay

### Objective

The goal is to fly your ship through each level, pick up the pod using your tractor beam, and deliver it to the restart point. Once the pod is docked, fly into the sky to complete the level.

### Level Completion

1. **Pick up the pod**: Get close to the pod and press Space to activate the tractor beam
2. **Deliver to restart point**: Fly to the restart point (marked with a special tile)
3. **Fly into sky**: With the pod towed, fly upward into the sky to complete the level

### Hazards

- **Bunkers**: Enemy bunkers shoot bullets at your ship
- **Gravity**: Your ship is affected by gravity
- **Fuel**: Acceleration consumes fuel - collect fuel pickups to replenish
- **Walls**: Collision with walls causes damage

## Tech Stack

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Vitest**: Testing framework
- **Playwright**: E2E testing
- **HTML5 Canvas**: Game rendering
- **Capacitor**: Mobile app support

## Project Structure

```
caveshuttle/
├── src/
│   ├── core/           # Game constants and utilities
│   ├── game/           # Game objects (Ship, Pod, Bunker, etc.)
│   ├── levels/         # Level definitions and loader
│   ├── physics/        # Collision detection
│   ├── ui/             # React components (GameCanvas, HUD, Menu)
│   └── main.jsx        # Application entry point
├── assets/             # Game assets (tilesets, sounds)
├── levels/             # Level definition files
├── tests/              # Unit and E2E tests
└── public/             # Static files
```

## Testing

```bash
# Run all tests
npm test

# Run with timeout (recommended)
timeout 100 npm test

# Run E2E tests
npx playwright test
```

## Mobile Support

The game supports mobile devices with touch controls and Capacitor for native app deployment.

### Build Mobile Apps

```bash
# Build iOS app
npx cap sync ios
npx cap open ios

# Build Android app
npx cap sync android
npx cap open android
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License version 2 as
published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301 USA.

See [COPYING](COPYING) for the full license text.

## Credits

- Development: CaveShuttle Team
- Level Design: CaveShuttle Levels
- Font: [Commodore 64](https://www.dafont.com/commodore-64.font) by Devin D. Cook

---

**Enjoy the game experience!** 🚀
