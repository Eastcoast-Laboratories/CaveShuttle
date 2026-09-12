// Test: Generate moon PNGs from PlanetGenerator (GenGen) WebGL shader
// Run:  node dev/generate_planets_playwright.mjs

import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PLANET_GEN_DIR = '/var/www/PlanetGenerator';
const OUTPUT_DIR = '/var/www/CaveShuttle/public/moons';
const COUNT = 100;
const SIZE = 256;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon',
};

function startServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = path.join(rootDir, urlPath);
      const ext = path.extname(filePath);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

async function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Start static file server for PlanetGenerator
  const server = await startServer(PLANET_GEN_DIR);
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/`;
  console.log(`[PLANETS] Server running at ${url}`);

  // Launch headless Chromium with WebGL support
  const browser = await chromium.launch({
    executablePath: process.env.HOME + '/.playwright-browsers/chromium-1194/chrome-linux/chrome',
    headless: true,
    args: [
      '--use-gl=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--enable-unsafe-swiftshader',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: SIZE + 100, height: SIZE + 100 },
  });

  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('[BROWSER ERROR]', msg.text());
    }
  });

  console.log(`[PLANETS] Loading page...`);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for the data.txt to be parsed and first planet rendered
  await page.waitForFunction(() => window.genID !== '?', { timeout: 10000 });
  await page.waitForTimeout(1000);

  console.log(`[PLANETS] First planet rendered, generating ${COUNT} moons...`);

  // Collect parameter log lines for each moon
  const logLines = [];
  const LOG_PATH = path.join(OUTPUT_DIR, 'moon_params.log');

  // Generate COUNT planets with deterministic seeds
  // Gray-tinted palettes: gray with slight yellow, brown, red, or blue tint.
  // No green, no purple. Dark values for dim illumination.
  const PALETTES = [
    { name: 'gray-yellow', // Gray-yellow tint
      ocean: [0.06, 0.05, 0.04], cold: [0.14, 0.13, 0.10],
      temperate: [0.20, 0.18, 0.14], warm: [0.26, 0.24, 0.17],
      hot: [0.31, 0.28, 0.19], speckle: [0.16, 0.15, 0.12],
      clouds: [0.30, 0.29, 0.27], haze: [0.05, 0.04, 0.04],
    },
    { name: 'gray-brown', // Gray-brown tint
      ocean: [0.05, 0.04, 0.03], cold: [0.12, 0.11, 0.09],
      temperate: [0.18, 0.16, 0.13], warm: [0.23, 0.20, 0.15],
      hot: [0.28, 0.24, 0.18], speckle: [0.14, 0.13, 0.10],
      clouds: [0.29, 0.28, 0.26], haze: [0.04, 0.04, 0.03],
    },
    { name: 'gray-red', // Gray-red tint
      ocean: [0.06, 0.04, 0.04], cold: [0.13, 0.10, 0.10],
      temperate: [0.19, 0.14, 0.14], warm: [0.25, 0.18, 0.17],
      hot: [0.30, 0.22, 0.20], speckle: [0.15, 0.11, 0.11],
      clouds: [0.29, 0.28, 0.27], haze: [0.04, 0.04, 0.04],
    },
    { name: 'gray-blue', // Gray-blue tint
      ocean: [0.04, 0.05, 0.06], cold: [0.10, 0.11, 0.13],
      temperate: [0.15, 0.17, 0.19], warm: [0.20, 0.22, 0.25],
      hot: [0.25, 0.27, 0.30], speckle: [0.12, 0.13, 0.15],
      clouds: [0.28, 0.29, 0.30], haze: [0.04, 0.04, 0.05],
    },
  ];

  for (let i = 0; i < COUNT; i++) {
    const seed = `moon${i.toString(16).padStart(8, '0')}`;
    const paletteIdx = i % PALETTES.length;
    const palette = PALETTES[paletteIdx];

    // Generate planet from seed, then override colors to gray-tinted palette
    const params = await page.evaluate(({ s, p }) => {
      window.genFromID(s);
      // Override all color uniforms for gray-tinted look
      window.vOcean = p.ocean;
      window.vCold = p.cold;
      window.vTemperate = p.temperate;
      window.vWarm = p.warm;
      window.vHot = p.hot;
      window.vSpeckle = p.speckle;
      window.vClouds = p.clouds;
      window.vHaze = p.haze;
      // Reduce cloudiness so surface/craters are visible
      window.vCloudiness = 0.05;
      // Force rocky terrain (low water level)
      window.vWaterLevel = -2;
      window.vRivers = 0;
      // Dim lighting: lower light angle and zLight for darker moons
      window.vLight = 0.5 + Math.random() * 1.0;
      window.vZLight = 0.1 + Math.random() * 0.2;
      window.vLightColor = [0.3, 0.3, 0.35];
      // Return all shader parameters for logging
      return {
        seed: s,
        angle: window.vAngle,
        rotspeed: window.vRotspeed,
        light: window.vLight,
        zLight: window.vZLight,
        modValue: window.vModValue,
        noiseOffset: window.vNoiseOffset,
        noiseScale: window.vNoiseScale,
        noiseScale2: window.vNoiseScale2,
        noiseScale3: window.vNoiseScale3,
        cloudNoise: window.vCloudNoise,
        cloudiness: window.vCloudiness,
        waterLevel: window.vWaterLevel,
        rivers: window.vRivers,
        temperature: window.vTemperature,
        ocean: window.vOcean,
        cold: window.vCold,
        temperate: window.vTemperate,
        warm: window.vWarm,
        hot: window.vHot,
        speckle: window.vSpeckle,
        clouds: window.vClouds,
        haze: window.vHaze,
        lightColor: window.vLightColor,
      };
    }, { s: seed, p: palette });

    // Wait for render
    await page.waitForTimeout(200);

    // Set canvas size and render at fixed resolution
    const dataUrl = await page.evaluate((sz) => {
      return new Promise((resolve) => {
        // Render at fixed size
        window.renderPlanet(sz);
        // Wait a frame for render to complete
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(document.getElementById('c').toDataURL('image/png'));
          });
        });
      });
    }, SIZE);

    // Save PNG
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const outPath = path.join(OUTPUT_DIR, `moon_${String(i).padStart(3, '0')}.png`);
    fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));

    // Log parameters for this moon
    const fname = `moon_${String(i).padStart(3, '0')}.png`;
    logLines.push(`# ${fname} (palette: ${paletteIdx}=${palette.name})`);
    logLines.push(`tint=${palette.name}`);
    logLines.push(`paletteIndex=${paletteIdx}`);
    for (const [key, val] of Object.entries(params)) {
      const valStr = Array.isArray(val) ? `[${val.join(', ')}]` : val;
      logLines.push(`${key}=${valStr}`);
    }
    logLines.push('');

    if ((i + 1) % 10 === 0) {
      console.log(`  ${i + 1}/${COUNT} done`);
    }
  }

  console.log(`[PLANETS] All ${COUNT} moons saved to ${OUTPUT_DIR}`);

  // Write parameter log
  fs.writeFileSync(LOG_PATH, logLines.join('\n'));
  console.log(`[PLANETS] Parameter log saved to ${LOG_PATH}`);

  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error('[PLANETS] Fatal error:', err);
  process.exit(1);
});
