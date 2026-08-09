# Level Editor Plan

## Overview
Create a graphical browser-based level editor for editing level files from any installed levelpack.

## Core Features

### 1. Level Selection
- Dropdown to select levelpack (default, classic, custom)
- Dropdown to select level number within levelpack
- Load button to load selected level
- New level button to create blank level

### 2. Canvas/Grid Rendering
- HTML5 Canvas for rendering level grid
- Each tile rendered as a colored square with character overlay
- Grid lines for visual reference
- Zoom in/out functionality
- Pan around large levels

### 3. Tile Palette
- Categorized tile buttons:
  - **Basic**: Empty (space), Solid (p), Start (*)
  - **Slopes**: q, r, s, t (slanted walls)
  - **Bunkers**: P, S, R, Q (bunker types)
  - **Pod**: m (pod holder), 0, 1, 2, 3, 4 (pod tiles)
  - **Fuel**: a, b, c (fuel alcoves)
  - **Reactors**: d, e, f, g, h, i, j, k, l (reactor tiles)
  - **Sliders**: @, I, K, O (slider walls)
  - **Buttons**: L, N (button types)
  - **Walls**: B, A, E, D (special wall types)
  - **Other**: x, u, v, w, X, Y, Z, [, ], ^, _, \, {, }, |, }, t, z
- Click palette to select current tile
- Right-click to erase (place space)

### 4. Mouse Operations
- **Left click**: Place selected tile
- **Right click**: Erase tile (place space)
- **Drag**: Paint multiple tiles
- **Middle click**: Pan canvas

### 5. Selection Tool
- Rectangle selection tool
- Select area with mouse drag
- Cut, copy, paste selected area
- Move selected area (drag to new location)
- Delete selected area

### 6. Slanted Wall Tool
- Special tool for drawing slanted walls
- Click two points to create slope
- Auto-detect slope direction
- Preview slope before placing

### 7. Header Editing
- Form fields for level parameters:
  - Width
  - Height
  - Start height
  - Empty space height
  - Bedrock height
  - Background/tractor color
  - Gun/reactor/stand color
  - Pod/blip color
  - Text color
  - Shield color
- Color pickers for color values

### 8. Level Operations
- Save level (overwrite existing)
- Save as new level
- Export to .def file
- Import from .def file
- Validate level (check for errors)

### 9. Preview/Test
- Test level button to launch game with current level
- Quick preview of level layout

### 10. Additional Features
- Undo/Redo (Ctrl+Z, Ctrl+Y)
- Keyboard shortcuts for common tiles
- Grid toggle
- Tile legend/help
- Auto-save to localStorage

## Technical Implementation

### File Structure
```
public/level-editor/
  index.html          # Main editor HTML
  editor.css          # Editor styles
  editor.js           # Editor logic
  tile-definitions.js # Tile character definitions and colors
```

### Data Structures
```javascript
// Level data structure
{
  header: {
    width: 80,
    height: 50,
    startHeight: 17,
    emptySpaceHeight: 5,
    bedrockHeight: 25,
    colors: {
      background: 189,
      tractor: 24,
      gun: 33,
      // ...
    }
  },
  grid: [
    "                                                 ",
    "                                                 ",
    // ... rows of characters
  ]
}
```

### Tile Definitions
```javascript
const TILE_TYPES = {
  empty: { char: ' ', color: '#000000', name: 'Empty' },
  solid: { char: 'p', color: '#888888', name: 'Solid' },
  slope_q: { char: 'q', color: '#666666', name: 'Slope Q' },
  // ... all tile types
};
```

## Implementation Order
1. Create basic HTML structure with canvas
2. Implement grid rendering
3. Create tile palette UI
4. Implement click to place tiles
5. Implement drag to paint
6. Add levelpack/level selection
7. Implement load/save functionality
8. Add selection tool
9. Add slanted wall tool
10. Add header editing
11. Add preview/test
12. Add undo/redo
13. Polish UI and add keyboard shortcuts
