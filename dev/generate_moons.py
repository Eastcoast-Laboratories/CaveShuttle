#!/usr/bin/env python3
"""
Generate realistic procedural moon PNGs for CaveShuttle.
Each moon has: Perlin noise surface texture, realistic craters with
shadow/highlight rims, spherical lighting, and a random alien color tint.

Usage:
  python3 dev/generate_moons.py
  python3 dev/generate_moons.py --output moons2 --count 87 \
      --seed-offset 777777 --style exotic

Output: public/<output>/moon_000.png ... (128x128 each)
"""

import os
import math
import random
import argparse
import numpy as np
from PIL import Image
from noise import pnoise2

DEFAULT_OUTPUT = 'moons'
DEFAULT_COUNT = 87
DEFAULT_SEED_OFFSET = 12345
DEFAULT_STYLE = 'standard'


def hsl_to_rgb(h, s, l):
    """Convert HSL (h: 0-360, s: 0-1, l: 0-1) to RGB (0-255)."""
    h = h / 360.0
    if s == 0:
        r = g = b = l
    else:
        def hue2rgb(p, q, t):
            if t < 0: t += 1
            if t > 1: t -= 1
            if t < 1/6: return p + (q - p) * 6 * t
            if t < 1/2: return q
            if t < 2/3: return p + (q - p) * (2/3 - t) * 6
            return p
        q = l * (1 + s) if l < 0.5 else l + s - l * s
        p = 2 * l - q
        r = hue2rgb(p, q, h + 1/3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1/3)
    return int(r * 255), int(g * 255), int(b * 255)


def generate_surface_texture(size, seed, base_rgb, octaves=6, freq=8.0):
    """Generate a Perlin noise surface texture for the moon."""
    px = np.zeros((size, size, 3), dtype=np.float32)
    for y in range(size):
        for x in range(size):
            nx = x / size * freq
            ny = y / size * freq
            # Multi-octave Perlin noise for surface roughness
            n = pnoise2(nx, ny, octaves=octaves, persistence=0.5,
                        lacunarity=2.0, repeatx=size, repeaty=size, base=seed)
            # Normalize to 0-1
            n = (n + 1) * 0.5
            # Vary brightness with noise
            factor = 0.7 + n * 0.6
            px[y, x, 0] = base_rgb[0] * factor
            px[y, x, 1] = base_rgb[1] * factor
            px[y, x, 2] = base_rgb[2] * factor
    return px


def add_craters(texture, size, seed, crater_count, light_dir):
    """Add realistic craters with shadow/highlight rims to the texture."""
    rng = random.Random(seed)
    tex = texture.copy()

    lx, ly = light_dir
    for _ in range(crater_count):
        # Crater center in normalized coords [-0.8, 0.8]
        cx = (rng.random() - 0.5) * 1.6
        cy = (rng.random() - 0.5) * 1.6
        dist_from_center = math.sqrt(cx * cx + cy * cy)
        if dist_from_center > 0.85:
            continue

        # Foreshortening: craters near the limb are elliptical
        foreshorten = math.sqrt(
            max(0, 1 - dist_from_center * dist_from_center))

        # Crater radius in pixels
        crater_r = size * (0.04 + rng.random() * 0.12)
        ring_r = crater_r * 1.15

        # Screen position
        sx = size * 0.5 + cx * size * 0.5
        sy = size * 0.5 + cy * size * 0.5

        # Process pixels in crater bounding box
        x0 = max(0, int(sx - ring_r - 2))
        x1 = min(size, int(sx + ring_r + 2))
        y0 = max(0, int(sy - ring_r - 2))
        y1 = min(size, int(sy + ring_r + 2))

        for py in range(y0, y1):
            for px in range(x0, x1):
                dx = px - sx
                dy = py - sy
                # Elliptical distance with foreshortening
                d = math.sqrt(
                    (dx / ring_r) ** 2 +
                    (dy / (ring_r * foreshorten)) ** 2)
                if d > 1.0:
                    continue

                # Distance from crater center (normalized 0-1)
                d_inner = math.sqrt(
                    (dx / crater_r) ** 2 +
                    (dy / (crater_r * foreshorten) ** 2))

                # Direction from crater center to pixel
                if d > 0:
                    pdx = dx / (ring_r * d)
                    pdy = dy / (ring_r * d)
                else:
                    pdx = pdy = 0

                # Dot product with light direction determines shadow/highlight
                dot = pdx * lx + pdy * ly

                if d_inner < 0.7:
                    # Crater floor: darker
                    depth_factor = 1.0 - (1.0 - d_inner / 0.7) * 0.4
                    tex[py, px, 0] *= depth_factor
                    tex[py, px, 1] *= depth_factor
                    tex[py, px, 2] *= depth_factor
                    # Shadow on the side away from light
                    if dot < -0.1:
                        shadow = 1.0 + dot * 0.5
                        tex[py, px, 0] *= shadow
                        tex[py, px, 1] *= shadow
                        tex[py, px, 2] *= shadow
                elif d < 1.0:
                    # Rim ring: highlight on light side, shadow on dark side
                    if dot > 0.1:
                        highlight = 1.0 + dot * 0.3
                        tex[py, px, 0] = min(255, tex[py, px, 0] * highlight)
                        tex[py, px, 1] = min(255, tex[py, px, 1] * highlight)
                        tex[py, px, 2] = min(255, tex[py, px, 2] * highlight)
                    elif dot < -0.1:
                        shadow = 1.0 + dot * 0.4
                        tex[py, px, 0] *= shadow
                        tex[py, px, 1] *= shadow
                        tex[py, px, 2] *= shadow

    return tex


def apply_spherical_shading(texture, size, light_dir):
    """Apply spherical shading: bright near light, dark on the far side."""
    lx, ly = light_dir
    tex = texture.copy()
    cx = size * 0.5
    cy = size * 0.5
    radius = size * 0.5

    for y in range(size):
        for x in range(size):
            dx = (x - cx) / radius
            dy = (y - cy) / radius
            d2 = dx * dx + dy * dy
            if d2 > 1.0:
                continue

            # Spherical normal z-component
            nz = math.sqrt(1.0 - d2)

            # Dot product of surface normal with light direction
            # Light comes from upper-left, slightly toward viewer
            dot = (-dx * lx + -dy * ly) * 0.7 + nz * 0.3
            dot = max(0.0, dot)

            # Ambient + diffuse
            shade = 0.15 + dot * 0.85

            tex[y, x, 0] *= shade
            tex[y, x, 1] *= shade
            tex[y, x, 2] *= shade

    return tex


def render_moon_standard(size, seed):
    """Standard moon style: rocky, cratered, low-saturation alien tints."""
    rng = random.Random(seed)

    # Random alien color: hue 0-360, low saturation, medium lightness
    hue = rng.random() * 360
    sat = 0.10 + rng.random() * 0.30  # 10-40% saturation
    light = 0.55 + rng.random() * 0.20  # 55-75% lightness
    base_rgb = hsl_to_rgb(hue, sat, light)

    # Light direction: upper-left
    light_dir = (-0.6, -0.6)

    # Generate surface texture
    texture = generate_surface_texture(
        size, seed % 1000, base_rgb, octaves=6, freq=8.0)

    # Add craters (8-20 per moon)
    crater_count = 8 + rng.randint(0, 12)
    texture = add_craters(
        texture, size,
        seed * 7 + 13, crater_count, light_dir)

    # Apply spherical shading
    texture = apply_spherical_shading(texture, size, light_dir)

    return texture


def render_moon_exotic(size, seed):
    """Exotic moon style: completely different from standard.
    - Darker base colors with muted, earthy hues
    - No purple, pink, or green — only warm browns/oranges and cool blues/grays
    - Larger, fewer craters with deeper shadows
    - Higher-frequency surface noise for a rougher, alien look
    - Stronger contrast lighting
    """
    rng = random.Random(seed)

    # Restricted hue palette: warm tones (0-60 = red/orange/yellow-brown)
    # and cool tones (180-260 = cyan/blue).
    # No green (90-150), no purple/pink (270-340).
    hue_ranges = [(0, 60), (180, 260)]
    hue_range = hue_ranges[rng.randint(0, 1)]
    hue = hue_range[0] + rng.random() * (hue_range[1] - hue_range[0])
    sat = 0.08 + rng.random() * 0.22  # 8-30% saturation
    light = 0.30 + rng.random() * 0.25  # 30-55% lightness
    base_rgb = hsl_to_rgb(hue, sat, light)

    # Light direction: varies per moon for variety
    light_angle = rng.random() * math.pi * 2
    light_dir = (math.cos(light_angle) * 0.6, math.sin(light_angle) * 0.6)

    # Higher frequency noise for rougher texture
    texture = generate_surface_texture(
        size, seed % 1000, base_rgb, octaves=8, freq=16.0)

    # Fewer but larger craters (4-10)
    crater_count = 4 + rng.randint(0, 6)
    texture = add_craters(
        texture, size,
        seed * 7 + 13, crater_count, light_dir)

    # Add a second layer of small craters for detail
    small_craters = 15 + rng.randint(0, 10)
    texture = add_craters(
        texture, size, seed * 13 + 99, small_craters, light_dir)

    # Apply spherical shading
    texture = apply_spherical_shading(texture, size, light_dir)

    return texture


def render_moon_comic(size, seed):
    """Comic/cartoon style moon: cel-shaded lighting, flat color regions,
    bold outlines, simple hard-edged craters, limited palette.
    Inspired by Deep-Fold PixelPlanets and bnidevs/pixel-planet.
    """
    rng = random.Random(seed)

    # Restricted palette: warm browns/oranges and cool blues, muted
    hue_ranges = [(0, 60), (180, 260)]
    hue_range = hue_ranges[rng.randint(0, 1)]
    hue = hue_range[0] + rng.random() * (hue_range[1] - hue_range[0])
    sat = 0.15 + rng.random() * 0.25  # 15-40% saturation
    light = 0.45 + rng.random() * 0.20  # 45-65% lightness
    base_rgb = hsl_to_rgb(hue, sat, light)

    # Derive 3 cel-shade bands from base color
    light_rgb = hsl_to_rgb(
        hue, sat, min(0.85, light + 0.20))
    mid_rgb = base_rgb
    dark_rgb = hsl_to_rgb(
        hue, sat, max(0.15, light - 0.30))
    shadow_rgb = hsl_to_rgb(
        hue, sat, max(0.05, light - 0.45))

    # Light direction: upper-left
    light_dir = (-0.6, -0.6)
    lx, ly = light_dir

    # Generate low-frequency Perlin noise for flat regions (continents)
    texture = np.zeros((size, size, 3), dtype=np.float32)
    freq = 4.0 + rng.random() * 3.0  # 4-7: large blobs
    noise_seed = seed % 1000
    for y in range(size):
        for x in range(size):
            nx = x / size * freq
            ny = y / size * freq
            n = pnoise2(
                nx, ny, octaves=3, persistence=0.5,
                lacunarity=2.0, repeatx=size,
                repeaty=size, base=noise_seed)
            n = (n + 1) * 0.5  # 0-1
            # Quantize to 3 bands for flat comic look
            if n > 0.55:
                texture[y, x] = light_rgb
            elif n > 0.45:
                texture[y, x] = mid_rgb
            else:
                texture[y, x] = dark_rgb

    # Cel-shaded spherical lighting: hard 3-band shadow
    cx = size * 0.5
    cy = size * 0.5
    radius = size * 0.5
    for y in range(size):
        for x in range(size):
            dx = (x - cx) / radius
            dy = (y - cy) / radius
            d2 = dx * dx + dy * dy
            if d2 > 1.0:
                continue
            nz = math.sqrt(1.0 - d2)
            dot = (-dx * lx + -dy * ly) * 0.7 + nz * 0.3
            # Cel-shading: 3 discrete bands
            if dot > 0.6:
                shade = 1.0  # lit
            elif dot > 0.2:
                shade = 0.7  # mid
            elif dot > 0.0:
                shade = 0.45  # dark
            else:
                shade = 0.25  # shadow
            texture[y, x, 0] *= shade
            texture[y, x, 1] *= shade
            texture[y, x, 2] *= shade

    # Comic craters: flat circles with hard edges,
    # 2-tone (dark floor + bright rim)
    crater_rng = random.Random(seed * 17 + 42)
    crater_count = 4 + crater_rng.randint(0, 6)
    for _ in range(crater_count):
        uc = (crater_rng.random() - 0.5) * 1.5
        vc = (crater_rng.random() - 0.5) * 1.5
        dist = math.sqrt(uc * uc + vc * vc)
        if dist > 0.8:
            continue
        foreshorten = math.sqrt(max(0, 1 - dist * dist))
        crater_r = size * (0.06 + crater_rng.random() * 0.10)
        sx = cx + uc * radius
        sy = cy + vc * radius

        x0 = max(0, int(sx - crater_r - 1))
        x1 = min(size, int(sx + crater_r + 1))
        y0 = max(0, int(sy - crater_r - 1))
        y1 = min(size, int(sy + crater_r + 1))

        for py in range(y0, y1):
            for px in range(x0, x1):
                ddx = px - sx
                ddy = py - sy
                d = math.sqrt(
                    (ddx / crater_r) ** 2 +
                    (ddy / (crater_r * foreshorten)) ** 2)
                if d > 1.0:
                    continue
                # Direction from center
                if d > 0:
                    pdx = ddx / (crater_r * d)
                    pdy = ddy / (crater_r * d)
                else:
                    pdx = pdy = 0
                dot = pdx * lx + pdy * ly

                if d < 0.75:
                    # Flat dark floor
                    texture[py, px, 0] = dark_rgb[0] * 0.5
                    texture[py, px, 1] = dark_rgb[1] * 0.5
                    texture[py, px, 2] = dark_rgb[2] * 0.5
                else:
                    # Hard rim: bright on light side, dark on shadow side
                    if dot > 0:
                        texture[py, px, 0] = min(255, light_rgb[0] * 1.2)
                        texture[py, px, 1] = min(255, light_rgb[1] * 1.2)
                        texture[py, px, 2] = min(255, light_rgb[2] * 1.2)
                    else:
                        texture[py, px, 0] = shadow_rgb[0]
                        texture[py, px, 1] = shadow_rgb[1]
                        texture[py, px, 2] = shadow_rgb[2]

    # Bold dark outline around the moon edge (comic style)
    outline_rgb = np.array(shadow_rgb, dtype=np.float32) * 0.5
    for y in range(size):
        for x in range(size):
            dx = x - cx
            dy = y - cy
            d = math.sqrt(dx * dx + dy * dy)
            if d > radius - 3 and d <= radius:
                texture[y, x] = outline_rgb

    return texture


# 4x4 Bayer dithering matrix for retro 16-bit shading
BAYER_4x4 = np.array([
    [0,  8,  2, 10],
    [12, 4, 14,  6],
    [3, 11,  1,  9],
    [15, 7, 13,  5]
], dtype=np.float32) / 16.0


def render_moon_retro(size, seed):
    """Retro 16-bit pixel-art moon: low-res generation with Bayer dithering,
    biome-based palette, nearest-neighbor upscaling.
    Inspired by TekEngine Pixel Planet Creator and Deep-Fold PixelPlanets.
    """
    rng = random.Random(seed)

    # Generate at low resolution for authentic pixel-art look
    low_res = 32

    # Restricted palette: warm and cool tones, no purple/pink/green
    hue_ranges = [(0, 60), (180, 260)]
    hue_range = hue_ranges[rng.randint(0, 1)]
    hue = hue_range[0] + rng.random() * (hue_range[1] - hue_range[0])
    sat = 0.12 + rng.random() * 0.25  # 12-37% saturation

    # Biome palette: 5 shades from dark to light
    biomes = [
        hsl_to_rgb(hue, sat, 0.20 + rng.random() * 0.05),  # deep
        hsl_to_rgb(hue, sat, 0.32 + rng.random() * 0.05),  # shallow
        hsl_to_rgb(hue, sat, 0.45 + rng.random() * 0.05),  # coast
        hsl_to_rgb(hue, sat, 0.58 + rng.random() * 0.05),  # lowland
        hsl_to_rgb(hue, sat, 0.70 + rng.random() * 0.05),  # highland
    ]

    # Light direction: upper-left
    light_dir = (-0.6, -0.6)
    lx, ly = light_dir

    # Generate low-res Perlin noise for biomes
    low_tex = np.zeros((low_res, low_res, 3), dtype=np.float32)
    freq = 3.0 + rng.random() * 2.0
    noise_seed = seed % 1000
    for y in range(low_res):
        for x in range(low_res):
            nx = x / low_res * freq
            ny = y / low_res * freq
            # Multi-octave noise
            n = pnoise2(
                nx, ny, octaves=4, persistence=0.5,
                lacunarity=2.0, repeatx=low_res,
                repeaty=low_res, base=noise_seed)
            n = (n + 1) * 0.5  # 0-1
            # Map to biome
            biome_idx = min(4, int(n * 5))
            low_tex[y, x] = biomes[biome_idx]

    # Spherical shading with Bayer dithering at low res
    cx = low_res * 0.5
    cy = low_res * 0.5
    radius = low_res * 0.5
    for y in range(low_res):
        for x in range(low_res):
            dx = (x - cx) / radius
            dy = (y - cy) / radius
            d2 = dx * dx + dy * dy
            if d2 > 1.0:
                continue
            nz = math.sqrt(1.0 - d2)
            dot = (-dx * lx + -dy * ly) * 0.7 + nz * 0.3
            dot = max(0.0, dot)

            # Bayer dithered shading: 3 shade levels
            bayer = BAYER_4x4[y % 4, x % 4]
            shade_val = dot + bayer * 0.15  # dither threshold offset
            if shade_val > 0.65:
                shade = 1.0
            elif shade_val > 0.30:
                shade = 0.65
            else:
                shade = 0.35

            low_tex[y, x, 0] *= shade
            low_tex[y, x, 1] *= shade
            low_tex[y, x, 2] *= shade

    # Pixel-art craters at low res: flat 2-tone circles
    crater_rng = random.Random(seed * 17 + 42)
    crater_count = 3 + crater_rng.randint(0, 4)
    for _ in range(crater_count):
        uc = (crater_rng.random() - 0.5) * 1.4
        vc = (crater_rng.random() - 0.5) * 1.4
        dist = math.sqrt(uc * uc + vc * vc)
        if dist > 0.75:
            continue
        foreshorten = math.sqrt(max(0, 1 - dist * dist))
        crater_r = low_res * (0.08 + crater_rng.random() * 0.12)
        sx = cx + uc * radius
        sy = cy + vc * radius

        x0 = max(0, int(sx - crater_r - 1))
        x1 = min(low_res, int(sx + crater_r + 1))
        y0 = max(0, int(sy - crater_r - 1))
        y1 = min(low_res, int(sy + crater_r + 1))

        for py in range(y0, y1):
            for px in range(x0, x1):
                ddx = px - sx
                ddy = py - sy
                d = math.sqrt(
                    (ddx / crater_r) ** 2 +
                    (ddy / (crater_r * foreshorten)) ** 2)
                if d > 1.0:
                    continue
                if d > 0:
                    pdx = ddx / (crater_r * d)
                    pdy = ddy / (crater_r * d)
                else:
                    pdx = pdy = 0
                dot = pdx * lx + pdy * ly

                if d < 0.7:
                    # Dark flat floor
                    low_tex[py, px] = np.array(biomes[0]) * 0.5
                else:
                    # Rim: bright or dark depending on light
                    if dot > 0:
                        low_tex[py, px] = np.array(biomes[4]) * 1.1
                    else:
                        low_tex[py, px] = np.array(biomes[0]) * 0.3

    # Upscale to full size with nearest-neighbor (pixel-art look)
    low_img = Image.fromarray(np.clip(low_tex, 0, 255).astype(np.uint8), 'RGB')
    full_img = low_img.resize((size, size), Image.Resampling.NEAREST)
    texture = np.array(full_img, dtype=np.float32)

    return texture


def make_alpha_mask(size):
    """Create a circular alpha mask with smooth edges."""
    alpha = Image.new('L', (size, size), 0)
    cx = cy = size * 0.5
    radius = size * 0.5 - 1
    for y in range(size):
        for x in range(size):
            dx = x - cx
            dy = y - cy
            if dx * dx + dy * dy <= radius * radius:
                d = math.sqrt(dx * dx + dy * dy)
                if d > radius - 2:
                    alpha.putpixel((x, y), int(255 * (radius - d) / 2))
                else:
                    alpha.putpixel((x, y), 255)
    return alpha


def main():
    parser = argparse.ArgumentParser(
        description='Generate procedural moon PNGs')
    parser.add_argument(
        '--output', default=DEFAULT_OUTPUT,
        help='Output subdirectory under public/')
    parser.add_argument(
        '--count', type=int, default=DEFAULT_COUNT,
        help='Number of moons to generate')
    parser.add_argument(
        '--seed-offset', type=int, default=DEFAULT_SEED_OFFSET,
        help='Seed offset for generation')
    parser.add_argument(
        '--style', default=DEFAULT_STYLE,
        choices=['standard', 'exotic', 'comic', 'retro'],
        help='Moon visual style')
    args = parser.parse_args()

    output_dir = os.path.join(
        os.path.dirname(__file__), '..', 'public', args.output)
    os.makedirs(output_dir, exist_ok=True)

    # Select render function based on style
    if args.style == 'exotic':
        render_fn = render_moon_exotic
    elif args.style == 'comic':
        render_fn = render_moon_comic
    elif args.style == 'retro':
        render_fn = render_moon_retro
    else:
        render_fn = render_moon_standard

    tex_size = 128
    alpha_mask = make_alpha_mask(tex_size)

    print(
        f"Generating {args.count} {args.style} moon textures "
        f"({tex_size}x{tex_size}) into public/{args.output}/...")
    print(f"Seed offset: {args.seed_offset}")

    for i in range(args.count):
        seed = i * 99991 + args.seed_offset
        texture = render_fn(tex_size, seed)

        # Convert to uint8
        texture = np.clip(texture, 0, 255).astype(np.uint8)

        # Create image
        img = Image.fromarray(texture, 'RGB')
        img.putalpha(alpha_mask)

        path = os.path.join(output_dir, f"moon_{i:03d}.png")
        img.save(path, "PNG")
        if (i + 1) % 10 == 0:
            print(f"  {i + 1}/{args.count} done")

    print(f"All {args.count} {args.style} moons saved to {output_dir}")


if __name__ == "__main__":
    main()
