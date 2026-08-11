// Level Editor - Main JavaScript

const EDITOR_VERSION = '3.8';
const ZOOM_SPEED = 1.05; // Multiplier per scroll step (closer to 1 = smaller steps)
const ZOOM_MIN = 0.2; // Minimum zoom level in percent (lower = can zoom out more to see entire level) 0.2=20%
const ZOOM_MAX = 4; // Maximum zoom level
const UNDO_STACK_SIZE = 10000; // Maximum number of undo states to keep

class LevelEditor {
  constructor() {
    this.canvas = document.getElementById('levelCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Preview canvas
    this.previewCanvas = document.getElementById('previewCanvas');
    this.previewCtx = this.previewCanvas.getContext('2d');
    this.levelRenderer = new LevelRenderer();
    
    // Generator options
    this.genBunkers = 5;
    this.genFuel = 6;
    this.genBunkerChance = null;
    this.genFuelChance = null;

    // Level data
    this.levelData = {
      header: {
        width: 82,
        height: 120,
        startHeight: 17,
        emptySpaceHeight: 5,
        bedrockHeight: 25,
        colors: {
          pod: [0, 164, 0]
        },
        wallColor: '#ff0000'
      },
      grid: []
    };
    
    // Editor state
    this.currentTile = ' ';
    this.currentTool = 'paint';
    this.zoom = 1;
    this.tileSize = 16;
    this.isDragging = false;
    this.isPanning = false;
    this.panOffset = { x: 0, y: 0 };
    this.lastMousePos = { x: 0, y: 0 };
    this.selection = null;
    this.clipboard = null;
    this.undoStack = [];
    this.redoStack = [];
    this._lastSnapshot = null;
    this.slopeStart = null;
    this.slopePreview = null;
    this.triangleStart = null;
    this.trianglePreview = null;
    this.hillStart = null;
    this.hillPreview = null;

    // Template definitions from LEVEL_DESIGN_GUIDE.md
    this.templates = {
      'bunker_right': {
        name: 'Bunker Ceiling Right ([XYZ)',
        pattern: [
          'ppppuv',
          'ppuv[',
          'uvXYZ'
        ]
      },
      'bunker_left': {
        name: 'Bunker Ceiling Left (]^_\\)',
        pattern: [
          'wxpppp',
          '\\wxpp',
          ']^_wx'
        ]
      },
      'bunker_floor_p': {
        name: 'Floor Bunker Left (PQRS)',
        pattern: [
          'qrPQR',
          'ppqrS',
          'pppqr'
        ]
      },
      'bunker_floor_u': {
        name: 'Floor Bunker Right (UVWT)',
        pattern: [
          'UVWst',
          'Tstpp',
          'ppppp'
        ]
      },
      'reactor': {
        name: 'Reactor',
        pattern: [
          'def',
          'ghi',
          'jkl'
        ]
      },
      'vertical_shaft': {
        name: 'Vertical Shaft',
        pattern: [
          'q}     zt',
          'p|     yp',
          'p|  m0 yp',
          'p|  12 yp',
          'p|  34 yp'
        ]
      },
      'fuel_building': {
        name: 'Fuel',
        pattern: [
          '`a',
          'bc'
        ]
      }
    };
  }
  
  async init() {
    this.initializeGrid();
    this._lastSnapshot = JSON.parse(JSON.stringify(this.levelData));
    this.createTilePalette();
    this.createTemplateButtons();
    this.setupEventListeners();
    this.setupParentMessageListener();
    this.updateVersionDisplay();

    // Populate level dropdown from pack meta
    await this.refreshLevelSelect();

    // Load tile images for renderer
    await this.levelRenderer.load();

    this.render();
    this.updateParameterInputs();
  }
  
  initializeGrid() {
    const { width, height } = this.levelData.header;
    this.levelData.grid = [];
    for (let y = 0; y < height; y++) {
      const row = new Array(width).fill(' ');
      this.levelData.grid.push(row);
    }
  }
  
  createTilePalette() {
    const palette = document.getElementById('tilePalette');
    palette.innerHTML = '';
    
    for (const category of Object.values(TILE_CATEGORIES)) {
      const tiles = TILES_BY_CATEGORY[category];
      if (!tiles || tiles.length === 0) continue;

      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'tile-category';
      
      const title = document.createElement('div');
      title.className = 'tile-category-title';
      title.textContent = category;
      categoryDiv.appendChild(title);
      
      const row = document.createElement('div');
      row.className = 'tile-row';
      
      tiles.forEach(tile => {
        const btn = document.createElement('button');
        btn.className = 'tile-btn';
        btn.dataset.char = tile.char;
        btn.title = `${this.encodeForDisplay(tile.name)} (${this.encodeForDisplay(tile.char)})`; // Use standard HTML title attribute with character
        
        // Map special characters to safe filenames
        let filename;
        if (tile.char === '\\') {
          filename = 'tile_backslash.bmp';
        } else if (tile.char === '/') {
          filename = 'char_slash.bmp';
        } else if (tile.char === ':') {
          filename = 'char_colon.bmp';
        } else if (tile.char === '*') {
          filename = 'char_asterisk.bmp';
        } else if (tile.char === '?') {
          filename = 'char_question.bmp';
        } else if (tile.char === '"') {
          filename = 'char_quote.bmp';
        } else if (tile.char === '<') {
          filename = 'char_lt.bmp';
        } else if (tile.char === '>') {
          filename = 'char_gt.bmp';
        } else if (tile.char === '|') {
          filename = 'char_pipe.bmp';
        } else if (tile.char === '#') {
          filename = 'char_hash.bmp';
        } else if (tile.char === '%') {
          filename = 'char_percent.bmp';
        } else {
          filename = `char_${tile.char}.bmp`;
        }
        
        // Try to load tile image
        const img = document.createElement('img');
        img.src = `/tiles/${filename}`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.alt = this.encodeForDisplay(tile.char);
        
        // Fallback to colored rectangle if image fails to load
        img.onerror = () => {
          img.style.display = 'none';
          btn.style.backgroundColor = tile.color;
          btn.style.color = this.getContrastColor(tile.color);
          btn.textContent = this.encodeForDisplay(tile.char);
        };
        
        btn.appendChild(img);
        
        btn.addEventListener('click', () => this.selectTile(tile.char));
        row.appendChild(btn);
      });
      
      categoryDiv.appendChild(row);
      palette.appendChild(categoryDiv);
    }
    
    this.updateCurrentTileDisplay();
  }
  
  createTemplateButtons() {
    const container = document.getElementById('templateButtons');
    container.innerHTML = '';
    
    for (const [key, template] of Object.entries(this.templates)) {
      const btn = document.createElement('button');
      btn.className = 'template-btn';
      btn.textContent = template.name;
      btn.dataset.template = key;
      
      btn.addEventListener('click', () => this.insertTemplate(key));
      container.appendChild(btn);
    }
  }
  
  insertTemplate(templateKey) {
    const template = this.templates[templateKey];
    if (!template) return;
    
    let startX, startY;
    
    // Use selected area position if available
    if (this.selection) {
      const x1 = Math.min(this.selection.startX, this.selection.endX);
      const y1 = Math.min(this.selection.startY, this.selection.endY);
      startX = x1;
      startY = y1;
    } else {
      // Get current cursor position (center of viewport)
      const centerX = Math.floor((-this.panOffset.x + this.canvas.width / 2) / (this.tileSize * this.zoom));
      const centerY = Math.floor((-this.panOffset.y + this.canvas.height / 2) / (this.tileSize * this.zoom));
      
      // Calculate start position (top-left of template)
      startX = centerX - Math.floor(template.pattern[0].length / 2);
      startY = centerY - Math.floor(template.pattern.length / 2);
    }
    
    // Insert template pattern
    for (let y = 0; y < template.pattern.length; y++) {
      const row = template.pattern[y];
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        const targetX = startX + x;
        const targetY = startY + y;
        
        if (targetX >= 0 && targetX < this.levelData.header.width &&
            targetY >= 0 && targetY < this.levelData.header.height) {
          this.levelData.grid[targetY][targetX] = char;
        }
      }
    }
    
    this.saveState();
    this.render();
    this.renderPreview();
  }
  
  getContrastColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  encodeForDisplay(text) {
    if (!text) return '';
    // Render control characters (C0/C1) and DEL as numeric HTML entities
    // so they stay visible in title, alt and fallback text.
    return text.replace(/[\u0000-\u001f\u007f\u0080-\u009f]/g, c => `&#x${c.charCodeAt(0).toString(16).padStart(2, '0')};`);
  }
  
  selectTile(char) {
    this.currentTile = char;
    this.updateCurrentTileDisplay();
    
    // Update visual selection
    document.querySelectorAll('.tile-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.char === char);
    });
  }
  
  updateCurrentTileDisplay() {
    const tile = TILE_MAP[this.currentTile] || TILE_MAP[' '];
    const preview = document.querySelector('.tile-preview');
    const name = document.querySelector('.tile-name');
    
    preview.style.backgroundColor = tile.color;
    preview.style.color = this.getContrastColor(tile.color);
    preview.textContent = tile.char === ' ' ? '·' : this.encodeForDisplay(tile.char);
    name.textContent = this.encodeForDisplay(tile.name);
  }
  
  setupEventListeners() {
    // Canvas events
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentTool = btn.dataset.tool;
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    
    // Action buttons
    document.getElementById('undoBtn').addEventListener('click', () => this.undo());
    document.getElementById('redoBtn').addEventListener('click', () => this.redo());
    document.getElementById('copyBtn').addEventListener('click', () => this.copySelection());
    document.getElementById('pasteBtn').addEventListener('click', () => this.pasteClipboard());
    document.getElementById('fillBtn').addEventListener('click', () => this.fillSelection());
    document.getElementById('deleteBtn').addEventListener('click', () => this.deleteSelection());
    
    // Move selection buttons
    document.getElementById('moveUpBtn').addEventListener('click', () => this.moveSelection(0, -1));
    document.getElementById('moveDownBtn').addEventListener('click', () => this.moveSelection(0, 1));
    document.getElementById('moveLeftBtn').addEventListener('click', () => this.moveSelection(-1, 0));
    document.getElementById('moveRightBtn').addEventListener('click', () => this.moveSelection(1, 0));
    
    // Zoom buttons
    document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
    document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
    
    // Scroll buttons
    document.getElementById('scrollUpBtn').addEventListener('click', () => this.scrollUp());
    document.getElementById('scrollDownBtn').addEventListener('click', () => this.scrollDown());
    
    // Level controls
    document.getElementById('loadBtn').addEventListener('click', () => this.loadLevel());
    document.getElementById('newBtn').addEventListener('click', () => this.newLevel());
    document.getElementById('saveBtn').addEventListener('click', () => this.saveLevel());
    document.getElementById('testBtn').addEventListener('click', () => this.testLevel());
    document.getElementById('addToPackBtn').addEventListener('click', () => this.addToPack());
    document.getElementById('generateBtn').addEventListener('click', () => this.generateRandom());
    document.getElementById('levelpackSelect').addEventListener('change', () => this.refreshLevelSelect());

    // Level name input - save to localStorage on change
    const levelNameInput = document.getElementById('levelNameInput');
    levelNameInput.addEventListener('input', () => {
      localStorage.setItem('editorLevelName', levelNameInput.value);
    });

    // Load level name from localStorage
    const savedLevelName = localStorage.getItem('editorLevelName');
    if (savedLevelName) {
      levelNameInput.value = savedLevelName;
    }

    // Wall color picker with RGB display popup
    const wallColorBtn = document.getElementById('wallColorBtn');
    const wallColorPopup = document.getElementById('wallColorPopup');
    const wallColorPicker = document.getElementById('wallColorPicker');
    const wallColorCopy = document.getElementById('wallColorCopy');
    const wallColorWrapper = document.getElementById('wallColorWrapper');

    if (wallColorBtn && wallColorPopup) {
      wallColorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = wallColorPopup.style.display === 'block';
        wallColorPopup.style.display = isOpen ? 'none' : 'block';
        wallColorBtn.setAttribute('aria-expanded', String(!isOpen));
      });
    }

    if (wallColorPicker) {
      wallColorPicker.addEventListener('input', () => {
        this.updateWallColorDisplay(wallColorPicker.value);
        localStorage.setItem('editorWallColor', wallColorPicker.value);
      });
    }

    if (wallColorCopy) {
      wallColorCopy.addEventListener('click', () => {
        const rgbInput = document.getElementById('wallColorRgb');
        if (rgbInput && rgbInput.value) {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(rgbInput.value).then(() => {
              wallColorCopy.textContent = 'Copied!';
              setTimeout(() => wallColorCopy.textContent = 'Copy RGB', 1500);
            }).catch(() => {
              rgbInput.select();
              document.execCommand('copy');
            });
          } else {
            rgbInput.select();
            document.execCommand('copy');
          }
        }
      });
    }

    if (wallColorWrapper) {
      document.addEventListener('click', (e) => {
        if (!wallColorWrapper.contains(e.target)) {
          wallColorPopup.style.display = 'none';
          if (wallColorBtn) wallColorBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Load wall color from localStorage and initialize the UI
    const savedWallColor = localStorage.getItem('editorWallColor');
    this.updateWallColorDisplay(savedWallColor || '#ff0000');

    // Parameter inputs
    document.querySelectorAll('.param-input').forEach(input => {
      input.addEventListener('change', () => this.updateParameters());
    });

    // Save modal
    const closeModalBtn = document.getElementById('closeModalBtn');
    const copyModalBtn = document.getElementById('copyModalBtn');
    const saveModalBtn = document.getElementById('saveModalBtn');
    const saveModal = document.getElementById('saveModal');
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.closeSaveModal());
    if (copyModalBtn) copyModalBtn.addEventListener('click', () => this.copySaveModalText());
    if (saveModalBtn) saveModalBtn.addEventListener('click', () => this.downloadSaveModalText());
    if (saveModal) {
      saveModal.addEventListener('click', (e) => {
        if (e.target === saveModal) this.closeSaveModal();
      });
    }

    // Preview click jumps to position
    if (this.previewCanvas) {
      this.previewCanvas.style.cursor = 'pointer';
      this.previewCanvas.addEventListener('click', (e) => this.handlePreviewClick(e));
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  setupParentMessageListener() {
    // Listen for messages from the parent (e.g. load a level from the pack builder)
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'LOAD_LEVEL' && typeof event.data.levelData === 'string') {
        const levelName = (event.data.levelName || 'level').toString();
        const levelNameInput = document.getElementById('levelNameInput');
        if (levelNameInput) {
          levelNameInput.value = levelName;
          localStorage.setItem('editorLevelName', levelName);
        }
        this.loadLevelFromString(event.data.levelData);
      }
    });
  }

  handlePreviewClick(e) {
    const previewRect = this.previewCanvas.getBoundingClientRect();
    const x = e.clientX - previewRect.left;
    const y = e.clientY - previewRect.top;

    const scaleX = this.previewCanvas.width / previewRect.width;
    const scaleY = this.previewCanvas.height / previewRect.height;
    const px = x * scaleX;
    const py = y * scaleY;

    const worldX = (px + this.tileSize / 2) / this.tileSize;
    const worldY = (py + this.tileSize / 2) / this.tileSize;

    const container = this.canvas.parentElement;
    const canvasRect = this.canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const canvasX = canvasRect.left - containerRect.left;
    const canvasY = canvasRect.top - containerRect.top;

    this.panOffset.x = (container.clientWidth / 2) - canvasX - worldX * this.tileSize * this.zoom;
    this.panOffset.y = (container.clientHeight / 2) - canvasY - worldY * this.tileSize * this.zoom;
    this.render();
  }

  // Update the wall color UI components from a hex color and store it in the header.
  updateWallColorDisplay(hex) {
    const normalized = (typeof hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(hex)) ? hex.toLowerCase() : '#ff0000';
    const r = parseInt(normalized.substring(1, 3), 16);
    const g = parseInt(normalized.substring(3, 5), 16);
    const b = parseInt(normalized.substring(5, 7), 16);

    if (this.levelData && this.levelData.header) {
      this.levelData.header.wallColor = normalized;
    }

    const hiddenInput = document.getElementById('wallColorInput');
    if (hiddenInput) hiddenInput.value = normalized;

    const wallColorBtn = document.getElementById('wallColorBtn');
    if (wallColorBtn) wallColorBtn.style.backgroundColor = normalized;

    const wallColorPicker = document.getElementById('wallColorPicker');
    if (wallColorPicker) wallColorPicker.value = normalized;

    const wallColorRgb = document.getElementById('wallColorRgb');
    if (wallColorRgb) wallColorRgb.value = `${r} ${g} ${b}`;
  }

  // Convert RGB integers (0-255) to a hex color string.
  rgbToHex(r, g, b) {
    const toHex = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  
  handleMouseDown(e) {
    const pos = this.getGridPosition(e);
    
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle click or Alt+click - pan
      this.isPanning = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.canvas.style.cursor = 'grabbing';
    } else if (e.button === 0) {
      // Left click
      if (this.currentTool === 'paint' || this.currentTool === 'eraser') {
        this.isDragging = true;
        this.placeTile(pos.x, pos.y);
      } else if (this.currentTool === 'select') {
        this.isDragging = true;
        this.startSelection(pos.x, pos.y);
      } else if (this.currentTool === 'slope') {
        this.startSlope(pos.x, pos.y);
      } else if (this.currentTool === 'triangle') {
        this.startTriangle(pos.x, pos.y);
      } else if (this.currentTool === 'hill') {
        this.startHill(pos.x, pos.y);
      } else if (this.currentTool === 'bucket') {
        this.bucketFill(pos.x, pos.y);
      }
    } else if (e.button === 2) {
      // Right click - erase
      this.isDragging = true;
      this.placeTile(pos.x, pos.y, ' ');
    }
  }
  
  handleMouseMove(e) {
    const pos = this.getGridPosition(e);

    // Update cursor position display
    document.getElementById('cursorPos').textContent = `X: ${pos.x}, Y: ${pos.y}`;

    // Update canvas title with tile name
    if (pos.x >= 0 && pos.x < this.levelData.header.width && pos.y >= 0 && pos.y < this.levelData.header.height) {
      const tile = this.levelData.grid[pos.y][pos.x];
      const tileDef = TILE_DEFINITIONS.find(t => t.char === tile);
      const tileName = tileDef ? tileDef.name : `Tile '${tile}'`;
      this.canvas.title = tileName;
    }

    if (this.isPanning) {
      const dx = e.clientX - this.lastMousePos.x;
      const dy = e.clientY - this.lastMousePos.y;
      this.panOffset.x += dx;
      this.panOffset.y += dy;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.render();
    } else if (this.isDragging) {
      if (this.currentTool === 'paint') {
        this.placeTile(pos.x, pos.y);
      } else if (this.currentTool === 'eraser') {
        this.placeTile(pos.x, pos.y, ' ');
      } else if (this.currentTool === 'select') {
        this.updateSelection(pos.x, pos.y);
      } else if (this.currentTool === 'slope' && this.slopeStart) {
        this.updateSlopePreview(pos.x, pos.y);
      } else if (this.currentTool === 'triangle' && this.triangleStart) {
        this.updateTrianglePreview(pos.x, pos.y);
      } else if (this.currentTool === 'hill' && this.hillStart) {
        this.updateHillPreview(pos.x, pos.y);
      }
    }
  }
  
  handleMouseUp(e) {
    if (this.isDragging) {
      if (this.currentTool === 'slope' && this.slopeStart) {
        this.finishSlope();
      } else if (this.currentTool === 'triangle' && this.triangleStart) {
        this.finishTriangle();
      } else if (this.currentTool === 'hill' && this.hillStart) {
        this.finishHill();
      }
      this.saveState();
    }
    this.isDragging = false;
    this.isPanning = false;
    this.canvas.style.cursor = 'crosshair';
    this.slopeStart = null;
    this.slopePreview = null;
    this.triangleStart = null;
    this.trianglePreview = null;
    this.hillStart = null;
    this.hillPreview = null;
    
    if (this.currentTool === 'select' && this.selection) {
      this.render();
    }
  }
  
  handleWheel(e) {
    e.preventDefault();
    
    // Get mouse position relative to canvas
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate world position under mouse before zoom
    // With ctx.scale(), the transformation is: screen = world * zoom + panOffset
    // So: world = (screen - panOffset) / zoom
    const worldX = (mouseX - this.panOffset.x) / this.zoom;
    const worldY = (mouseY - this.panOffset.y) / this.zoom;
    
    console.log('[LEVEL_EDITOR_ZOOM] Mouse pos:', mouseX, mouseY, 'World pos:', worldX, worldY, 'Current zoom:', this.zoom);
    
    if (e.deltaY < 0) {
      this.zoomIn(mouseX, mouseY, worldX, worldY);
    } else {
      this.zoomOut(mouseX, mouseY, worldX, worldY);
    }
  }
  
  handleKeyDown(e) {
    // Undo/Redo
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      this.undo();
    } else if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      this.redo();
    }
    // Copy/Paste
    else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      this.copySelection();
    } else if (e.ctrlKey && e.key === 'v') {
      e.preventDefault();
      this.pasteClipboard();
    }
    // Select p-tile
    else if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      this.selectTile('p');
    }
    // Delete
    else if (e.key === 'Delete') {
      this.deleteSelection();
    }
    // Arrow keys for panning
    else if (e.key === 'ArrowUp') {
      if (e.ctrlKey) {
        e.preventDefault();
        this.moveSelection(0, -1);
      } else {
        e.preventDefault();
        this.panOffset.y += 50;
        this.render();
      }
    } else if (e.key === 'ArrowDown') {
      if (e.ctrlKey) {
        e.preventDefault();
        this.moveSelection(0, 1);
      } else {
        e.preventDefault();
        this.panOffset.y -= 50;
        this.render();
      }
    } else if (e.key === 'ArrowLeft') {
      if (e.ctrlKey) {
        e.preventDefault();
        this.moveSelection(-1, 0);
      } else {
        e.preventDefault();
        this.panOffset.x += 50;
        this.render();
      }
    } else if (e.key === 'ArrowRight') {
      if (e.ctrlKey) {
        e.preventDefault();
        this.moveSelection(1, 0);
      } else {
        e.preventDefault();
        this.panOffset.x -= 50;
        this.render();
      }
    }
    // Tile shortcuts
    else if (e.key === 'w' || e.key === 'W') {
      this.currentTile = 'p';
      this.updateCurrentTileDisplay();
    } else if (e.key === 'f' || e.key === 'F') {
      this.insertTemplate('fuel_building');
    }
    // Action shortcuts
    else if (e.key === 'g' || e.key === 'G') {
      this.fillSelection();
    }
    // Tool shortcuts
    else if (e.key === 'p' || e.key === 'P') {
      this.setTool('paint');
    } else if (e.key === 's' || e.key === 'S') {
      this.setTool('select');
    } else if (e.key === 'l' || e.key === 'L') {
      this.setTool('slope');
    } else if (e.key === 'd' || e.key === 'D') {
      this.setTool('triangle');
    } else if (e.key === 'h' || e.key === 'H') {
      this.setTool('hill');
    } else if (e.key === 'b' || e.key === 'B') {
      this.setTool('bucket');
    } else if (e.key === 'e' || e.key === 'E') {
      this.setTool('eraser');
    }
  }
  
  setTool(tool) {
    this.currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
  }
  
  getGridPosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left - this.panOffset.x) / (this.tileSize * this.zoom));
    const y = Math.floor((e.clientY - rect.top - this.panOffset.y) / (this.tileSize * this.zoom));
    return { x, y };
  }
  
  placeTile(x, y, char = this.currentTile) {
    if (x < 0 || x >= this.levelData.header.width || y < 0 || y >= this.levelData.header.height) {
      return;
    }
    
    if (this.currentTool === 'eraser') {
      char = ' ';
    }
    
    this.levelData.grid[y][x] = char;
    this.render();
    this.renderPreview();
  }
  
  startSelection(x, y) {
    this.selection = {
      startX: x,
      startY: y,
      endX: x,
      endY: y
    };
  }
  
  updateSelection(x, y) {
    if (!this.selection) return;
    this.selection.endX = x;
    this.selection.endY = y;
    this.render();
    this.renderPreview();
  }
  
  getSelectionBounds() {
    if (!this.selection) return null;
    const x1 = Math.min(this.selection.startX, this.selection.endX);
    const y1 = Math.min(this.selection.startY, this.selection.endY);
    const x2 = Math.max(this.selection.startX, this.selection.endX);
    const y2 = Math.max(this.selection.startY, this.selection.endY);
    return { x1, y1, x2, y2 };
  }
  
  moveSelection(dx, dy) {
    if (!this.selection) return;
    
    // Copy selection to clipboard
    this.copySelection();
    
    // Store positions that had non-space tiles before clearing
    const bounds = this.getSelectionBounds();
    const nonSpacePositions = [];
    for (let y = bounds.y1; y <= bounds.y2; y++) {
      for (let x = bounds.x1; x <= bounds.x2; x++) {
        if (this.levelData.grid[y][x] !== ' ') {
          nonSpacePositions.push({ x, y });
        }
      }
    }
    
    // Clear original selection area
    for (let y = bounds.y1; y <= bounds.y2; y++) {
      for (let x = bounds.x1; x <= bounds.x2; x++) {
        this.levelData.grid[y][x] = ' ';
      }
    }
    
    // Move selection coordinates
    this.selection.startX += dx;
    this.selection.startY += dy;
    this.selection.endX += dx;
    this.selection.endY += dy;
    
    // Paste at new position
    this.pasteClipboard();
    
    // Get new selection bounds after move
    const newBounds = this.getSelectionBounds();
    
    // Fill cleared area with p-walls where non-space tiles existed, but only if position is NOT in new selection
    for (const pos of nonSpacePositions) {
      // Check if this position is outside the new selection bounds
      if (pos.x < newBounds.x1 || pos.x > newBounds.x2 || pos.y < newBounds.y1 || pos.y > newBounds.y2) {
        this.levelData.grid[pos.y][pos.x] = 'p';
      }
    }
    
    this.saveState();
    this.render();
    this.renderPreview();
  }
  
  copySelection() {
    if (!this.selection) return;
    
    const bounds = this.getSelectionBounds();
    const width = bounds.x2 - bounds.x1 + 1;
    const height = bounds.y2 - bounds.y1 + 1;
    
    this.clipboard = {
      data: [],
      width,
      height
    };
    
    for (let y = bounds.y1; y <= bounds.y2; y++) {
      const row = [];
      for (let x = bounds.x1; x <= bounds.x2; x++) {
        row.push(this.levelData.grid[y][x]);
      }
      this.clipboard.data.push(row);
    }
  }
  
  pasteClipboard() {
    if (!this.clipboard) return;
    
    let startX, startY;
    
    // Use selected area position if available
    if (this.selection) {
      const x1 = Math.min(this.selection.startX, this.selection.endX);
      const y1 = Math.min(this.selection.startY, this.selection.endY);
      startX = x1;
      startY = y1;
    } else {
      // Paste at center of viewport
      const centerX = Math.floor((-this.panOffset.x + this.canvas.width / 2) / (this.tileSize * this.zoom));
      const centerY = Math.floor((-this.panOffset.y + this.canvas.height / 2) / (this.tileSize * this.zoom));
      
      startX = centerX - Math.floor(this.clipboard.width / 2);
      startY = centerY - Math.floor(this.clipboard.height / 2);
    }
    
    for (let y = 0; y < this.clipboard.height; y++) {
      for (let x = 0; x < this.clipboard.width; x++) {
        const targetX = startX + x;
        const targetY = startY + y;
        
        if (targetX >= 0 && targetX < this.levelData.header.width &&
            targetY >= 0 && targetY < this.levelData.header.height) {
          this.levelData.grid[targetY][targetX] = this.clipboard.data[y][x];
        }
      }
    }
    
    this.saveState();
    this.render();
    this.renderPreview();
  }
  
  deleteSelection() {
    if (!this.selection) return;

    const x1 = Math.min(this.selection.startX, this.selection.endX);
    const y1 = Math.min(this.selection.startY, this.selection.endY);
    const x2 = Math.max(this.selection.startX, this.selection.endX);
    const y2 = Math.max(this.selection.startY, this.selection.endY);

    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        this.levelData.grid[y][x] = ' ';
      }
    }

    this.selection = null;
    this.saveState();
    this.render();
    this.renderPreview();
  }

  fillSelection() {
    if (!this.selection) return;

    const x1 = Math.min(this.selection.startX, this.selection.endX);
    const y1 = Math.min(this.selection.startY, this.selection.endY);
    const x2 = Math.max(this.selection.startX, this.selection.endX);
    const y2 = Math.max(this.selection.startY, this.selection.endY);

    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        this.levelData.grid[y][x] = this.currentTile;
      }
    }

    this.saveState();
    this.render();
    this.renderPreview();
  }

  startSlope(x, y) {
    this.slopeStart = { x, y };
    this.isDragging = true;
  }
  
  updateSlopePreview(endX, endY) {
    if (!this.slopeStart) return;
    
    const startX = this.slopeStart.x;
    const startY = this.slopeStart.y;
    
    // Calculate slope direction
    const dx = endX - startX;
    const dy = endY - startY;
    
    // Determine slope type based on direction and wall context
    this.slopePreview = [];
    
    // Check for wall context (p) to determine if this is a floor or ceiling slope
    const checkWallBelow = (x, y) => {
      if (y + 1 >= this.levelData.header.height) return false;
      return this.levelData.grid[y + 1][x] === 'p';
    };
    
    const checkWallAbove = (x, y) => {
      if (y - 1 < 0) return false;
      return this.levelData.grid[y - 1][x] === 'p';
    };
    
    const hasWallBelow = checkWallBelow(startX, startY);
    const hasWallAbove = checkWallAbove(startX, startY);
    
    // Always use 2:1 pattern (2 horizontal, 1 vertical)
    const horizontalDirection = dx > 0 ? 1 : -1;
    // Ceiling slopes always go downward, floor slopes follow mouse direction
    const verticalDirection = hasWallAbove ? 1 : (dy > 0 ? 1 : -1);
    
    // Calculate length based on horizontal distance (primary direction)
    const length = Math.abs(dx);
    
    let slopeType;
    
    if (hasWallBelow) {
      // Floor slope (wall below)
      slopeType = this.getSlopePair('floor', horizontalDirection, verticalDirection);
    } else if (hasWallAbove) {
      // Ceiling slope (wall above)
      // Ceiling down-right (w/x) or ceiling down-left (v/u)
      slopeType = this.getSlopePair('ceiling', horizontalDirection, verticalDirection);
    } else {
      // Default to floor slope if no wall detected
      slopeType = this.getSlopePair('floor', horizontalDirection, verticalDirection);
    }
    
    // Generate slope with 2:1 pattern
    for (let i = 0; i <= length; i++) {
      const x = startX + i * horizontalDirection;
      // Every 2 horizontal steps, move 1 vertical step
      const y = startY + Math.floor(i / 2) * verticalDirection;
      
      if (y >= 0 && y < this.levelData.header.height && x >= 0 && x < this.levelData.header.width) {
        // getSlopePair already returns the pair in left-to-right cell order,
        // so no direction-dependent flipping is needed here.
        const char = i % 2 === 0 ? slopeType[0] : slopeType[1];
        this.slopePreview.push({ x, y, char });
      }
    }
    
    this.render();
    this.renderPreview();
  }
  
  finishSlope() {
    if (!this.slopePreview) return;
    
    // Apply the slope to the grid
    for (const tile of this.slopePreview) {
      if (tile.y >= 0 && tile.y < this.levelData.header.height &&
          tile.x >= 0 && tile.x < this.levelData.header.width) {
        this.levelData.grid[tile.y][tile.x] = tile.char;
      }
    }
    
    this.slopePreview = null;
    this.render();
    this.renderPreview();
  }

  startTriangle(x, y) {
    this.triangleStart = { x, y };
    this.isDragging = true;
  }

  updateTrianglePreview(endX, endY) {
    if (!this.triangleStart) return;

    const startX = this.triangleStart.x;
    const startY = this.triangleStart.y;
    const dx = endX - startX;
    const dy = endY - startY;

    if (dx === 0 || dy === 0) {
      this.trianglePreview = [];
      this.render();
      this.renderPreview();
      return;
    }

    const horizontalDirection = dx > 0 ? 1 : -1;
    const verticalDirection = dy > 0 ? 1 : -1;
    const length = Math.abs(dx);

    // Choose slope pair and fill side based on the drag direction.
    // The right triangle is always created with the right angle at (endX, startY).
    let slopeType;
    if (horizontalDirection === 1 && verticalDirection === 1) {
      // Down-right, solid below
      slopeType = ['w', 'x'];
    } else if (horizontalDirection === -1 && verticalDirection === 1) {
      // Down-left, solid below
      slopeType = ['v', 'u'];
    } else if (horizontalDirection === 1 && verticalDirection === -1) {
      // Up-right, solid above
      slopeType = ['s', 't'];
    } else {
      // Up-left, solid above
      slopeType = ['r', 'q'];
    }

    this.trianglePreview = [];

    // Build the hypotenuse and fill the interior with p
    for (let i = 0; i <= length; i++) {
      const x = startX + i * horizontalDirection;
      const slopeY = startY + Math.floor(i / 2) * verticalDirection;

      if (slopeY >= 0 && slopeY < this.levelData.header.height &&
          x >= 0 && x < this.levelData.header.width) {
        const char = i % 2 === 0 ? slopeType[0] : slopeType[1];
        this.trianglePreview.push({ x, y: slopeY, char });
      }

      // Fill the column between the horizontal leg (startY) and the slope
      const minY = Math.min(startY, slopeY);
      const maxY = Math.max(startY, slopeY);
      for (let y = minY; y <= maxY; y++) {
        if (y === slopeY) continue;
        if (y >= 0 && y < this.levelData.header.height &&
            x >= 0 && x < this.levelData.header.width) {
          this.trianglePreview.push({ x, y, char: 'p' });
        }
      }
    }

    this.render();
    this.renderPreview();
  }

  finishTriangle() {
    if (!this.trianglePreview) return;

    for (const tile of this.trianglePreview) {
      if (tile.y >= 0 && tile.y < this.levelData.header.height &&
          tile.x >= 0 && tile.x < this.levelData.header.width) {
        this.levelData.grid[tile.y][tile.x] = tile.char;
      }
    }

    this.trianglePreview = null;
    this.triangleStart = null;
    this.render();
    this.renderPreview();
  }

  startHill(x, y) {
    this.hillStart = { x, y };
    this.hillSeed = Math.floor(Math.random() * 0xFFFFFFFF);
    this.isDragging = true;
  }

  updateHillPreview(endX, endY) {
    if (!this.hillStart) return;

    const startX = this.hillStart.x;
    const startY = this.hillStart.y;
    const dx = endX - startX;
    const dy = endY - startY;

    const surface = this.detectSurface(startX, startY);
    const isHorizontalMode = Math.abs(dx) >= Math.abs(dy);

    this.hillPreview = [];

    const { width, height } = this.levelData.header;

    if (isHorizontalMode) {
      const horizontalDirection = dx > 0 ? 1 : -1;
      const steps = Math.max(1, Math.ceil(Math.abs(dx) / 2));
      let diffY = endY - startY;
      diffY = Math.max(-steps, Math.min(steps, diffY));
      if ((diffY + steps) % 2 !== 0) {
        if (diffY > 0) diffY--;
        else if (diffY < 0) diffY++;
        else diffY = 1;
      }

      const verticalDirections = this.getHillDirectionArray(steps, diffY, this.hillSeed);

      let leftX = startX - (horizontalDirection < 0 ? 1 : 0);
      let y = startY;
      let previousStepVertical = null;
      let lastNonFlatVertical = null;

      for (let i = 0; i < steps; i++) {
        const stepVertical = verticalDirections[i];
        // The first flat step after an up-slope still needs to rise one tile
        // so the plateau top connects to the previous slope.
        let effectiveVertical = (stepVertical === 0 && previousStepVertical === -1) ? -1 : stepVertical;
        let tileY = y;

        // Valley fix: the first up-slope after a valley floor (flat/down section)
        // should not start below the valley floor. If more up steps follow,
        // extend the floor with flat tiles and let the next step draw the ramp.
        // If there is only one up step, draw the ramp one row above the floor.
        if (
          stepVertical === -1 &&
          previousStepVertical !== null &&
          previousStepVertical !== -1 &&
          lastNonFlatVertical === 1
        ) {
          const nextStepVertical = verticalDirections[i + 1];
          if (nextStepVertical === -1) {
            effectiveVertical = 0;
            tileY = y;
          } else {
            tileY = y - 1;
          }
        }

        if (tileY < 0 || tileY >= height || leftX < -1 || leftX >= width) break;

        const x1 = horizontalDirection > 0 ? leftX : leftX + 1;
        const x2 = horizontalDirection > 0 ? leftX + 1 : leftX;

        const slopeType = this.getSlopePair(surface, horizontalDirection, effectiveVertical);
        console.log('[HILL] horizontal step', { i, surface, horizontalDirection, stepVertical, effectiveVertical, tileY, slopeType });

        if (x1 >= 0 && x1 < width) this.hillPreview.push({ x: x1, y: tileY, char: slopeType[0] });
        if (x2 >= 0 && x2 < width) this.hillPreview.push({ x: x2, y: tileY, char: slopeType[1] });

        leftX += 2 * horizontalDirection;
        y += stepVertical;
        previousStepVertical = stepVertical;
        if (stepVertical !== 0) lastNonFlatVertical = stepVertical;
      }
    } else {
      const verticalDirection = dy > 0 ? 1 : -1;
      // A slope segment is 1 tile high (and 2 wide), so one step == one row.
      // steps must equal |dy| so the hill reaches exactly the mouse position.
      const steps = Math.max(1, Math.abs(dy));
      let diffX = endX - startX;
      diffX = Math.max(-2 * steps, Math.min(2 * steps, diffX));
      let sumX = Math.round(diffX / 2);
      sumX = Math.max(-steps, Math.min(steps, sumX));
      if ((sumX + steps) % 2 !== 0) {
        if (sumX > 0) sumX--;
        else if (sumX < 0) sumX++;
        else sumX = 1;
      }

      const horizontalDirections = this.getHillDirectionArray(steps, sumX, this.hillSeed);

      let leftX = startX - (horizontalDirections[0] < 0 ? 1 : 0);
      let y = startY;
      let previousHorizontalDirection = 0;

      for (let i = 0; i < steps; i++) {
        const horizontalDirection = horizontalDirections[i];
        // The first vertical step after a diagonal up-slope still needs to
        // slope up so the wall/plateau top connects to the previous slope.
        const effectiveHorizontal = (horizontalDirection === 0 && previousHorizontalDirection !== 0 && verticalDirection === -1)
          ? previousHorizontalDirection
          : horizontalDirection;
        if (y < 0 || y >= height || leftX < -1 || leftX >= width) break;

        const slopeType = this.getSlopePair(surface, effectiveHorizontal, verticalDirection);
        console.log('[HILL] vertical step', { i, surface, horizontalDirection, effectiveHorizontal, verticalDirection, slopeType });
        const x1 = effectiveHorizontal >= 0 ? leftX : leftX + 1;
        const x2 = effectiveHorizontal >= 0 ? leftX + 1 : leftX;

        if (x1 >= 0 && x1 < width) this.hillPreview.push({ x: x1, y, char: slopeType[0] });
        if (x2 >= 0 && x2 < width) this.hillPreview.push({ x: x2, y, char: slopeType[1] });

        leftX += 2 * horizontalDirection;
        y += verticalDirection;
        previousHorizontalDirection = horizontalDirection;
      }
    }

    this.render();
    this.renderPreview();
  }

  /**
   * Finishes the hill drawing process by applying the previewed tiles to the level grid.
   * @returns {void}
   */
  finishHill() {
    if (!this.hillPreview) return;

    for (const tile of this.hillPreview) {
      if (tile.y >= 0 && tile.y < this.levelData.header.height &&
          tile.x >= 0 && tile.x < this.levelData.header.width) {
        this.levelData.grid[tile.y][tile.x] = tile.char;
      }
    }

    this.hillPreview = null;
    this.hillStart = null;
    this.render();
    this.renderPreview();
  }

  /**
   * Returns the tile at the specified coordinates.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @returns {string} The tile at the specified coordinates.
   */
  getTile(x, y) {
    if (x < 0 || x >= this.levelData.header.width || y < 0 || y >= this.levelData.header.height) {
      return ' ';
    }
    return this.levelData.grid[y][x];
  }

  /**
   * Checks if the tile at the specified coordinates is solid by checking if it's isWall or hidden wall.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @returns {boolean} True if the tile is solid, false otherwise.
   */
  isSolid(x, y) {
    if (x < 0 || x >= this.levelData.header.width || y < 0 || y >= this.levelData.header.height) {
      return true;
    }
    const char = this.getTile(x, y);
    return char == 'p' || char == 'à';
    // TODO: use tile definitions and there type WALLS or SLOPES
  }

  /**
   * Detects the surface type at the specified coordinates.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @returns {string} The surface type at the specified coordinates.
   */
  detectSurface(x, y) {
    const startChar = this.getTile(x, y);
    const below = this.isSolid(x, y + 1);
    const above = this.isSolid(x, y - 1);
    const left = this.isSolid(x - 1, y);
    const right = this.isSolid(x + 1, y);
    const leftBoundary = x - 1 < 0;
    const rightBoundary = x + 1 >= this.levelData.header.width;

    // Slope tiles that belong to a specific wall orientation
    if (startChar === 'w' || startChar === 'x') return 'wallRight';
    if (startChar === 'u' || startChar === 'v') return 'wallLeft';

    // Wall texture tiles
    if (['y', '|', 'z', '}'].includes(startChar)) {
      if (left && (leftBoundary || !right)) return 'wallLeft';
      if (right && (rightBoundary || !left)) return 'wallRight';
      if (below && !above) return 'floor';
      if (above && !below) return 'ceiling';
      return 'floor';
    }

    // Floor/ceiling slopes and plain p ground
    if (below && !above) return 'floor';
    if (left && (leftBoundary || !right)) return 'wallLeft';
    if (right && (rightBoundary || !left)) return 'wallRight';
    if (above && !below) return 'ceiling';
    return 'floor';
  }

  /**
   * Returns the appropriate slope pair for a given surface, horizontal and vertical direction.
   * The pair is always returned in left-to-right cell order ([leftCell, rightCell]).
   * @param {string} surface - The surface type ('floor', 'ceiling', 'wallRight', 'wallLeft').
   * @param {number} horizontalDirection - 1 == left to right, 0 == vertical up or down, -1 == right to left.
   * @param {number} verticalDirection - 1 == going down (screen), 0 == same level, -1 == going up (screen). Defaults to up.
   * @returns {string[]} An array of two strings representing the slope pair.
   */
  getSlopePair(surface, horizontalDirection, verticalDirection = -1) {
    // Flat / straight segment (no diagonal): fill both cells with solid ground.
    if (horizontalDirection === 0 || verticalDirection === 0) {
      console.log('[HILL] getSlopePair flat', { surface, horizontalDirection, verticalDirection });
      return ['p', 'p'];
    }
    const h = horizontalDirection > 0 ? 1 : -1;
    const v = verticalDirection > 0 ? 1 : -1; // +1 = screen down (descending)
    let pair;
    if (surface === 'floor') {
      // Ascending (v<0) uses the s/t family, descending (v>0) the q/r family.
      if (v < 0) pair = h > 0 ? ['s', 't'] : ['r', 'q'];
      else       pair = h > 0 ? ['q', 'r'] : ['t', 's'];
    } else if (surface === 'ceiling') {
      // Ceiling hill hangs downward: descending (v>0) vs ascending (v<0).
      if (v > 0) pair = h > 0 ? ['w', 'x'] : ['u', 'v'];
      else       pair = h > 0 ? ['u', 'v'] : ['w', 'x'];
    } else if (surface === 'wallRight') {
      // Walls bulge horizontally; vertical direction is the loop axis, not relevant here.
      pair = h > 0 ? ['w', 'x'] : ['x', 'w'];
    } else if (surface === 'wallLeft') {
      pair = h > 0 ? ['u', 'v'] : ['v', 'u'];
    } else {
      pair = ['q', 'r'];
    }
    console.log('[HILL] getSlopePair', { surface, h, v, pair });
    return pair;
  }

  /**
   * Generates an array of directions (-1 down/left, 0 flat, +1 up/right) whose
   * sum equals `target`. Directions are generated in "runs" so the same value
   * repeats several times before switching, which makes longer hill chains look
   * more natural (fewer up/down/flat flip-flops). When a hill changes from
   * rising to falling (or vice versa), it always stays flat for one step first
   * so the editor can draw the turnaround slope cleanly.
   * @param {number} steps - The number of directions to generate.
   * @param {number} target - The target sum of the directions.
   * @param {number} seed - The seed for the random number generator.
   * @returns {number[]} An array of directions with values -1, 0 or +1.
   */
  getHillDirectionArray(steps, target, seed) {
    const rand = this.mulberry32(seed);
    const directions = [];
    const maxRun = Math.max(2, Math.round(steps / 3));

    const createsSharpTurn = (prev, next) => prev !== 0 && next !== 0 && prev !== next;
    const canPlace = (index, value) => {
      const prev = index > 0 ? directions[index - 1] : 0;
      const next = index + 1 < directions.length ? directions[index + 1] : 0;
      return !createsSharpTurn(prev, value) && !createsSharpTurn(value, next);
    };

    // 1. Build runs of a single slope direction (+1/-1). Whenever the next run
    //    would reverse direction, insert a single flat step first so the hill
    //    stays on the same height for one segment before turning around.
    while (directions.length < steps) {
      const sign = rand() < 0.5 ? -1 : 1;
      const last = directions[directions.length - 1];
      if (createsSharpTurn(last, sign) && directions.length < steps) {
        directions.push(0);
      }

      const runLen = 1 + Math.floor(rand() * maxRun);
      for (let j = 0; j < runLen && directions.length < steps; j++) {
        directions.push(sign);
      }

      if (rand() < 0.3 && directions.length < steps) {
        const flatLen = 2 + Math.floor(rand() * 2);
        for (let j = 0; j < flatLen && directions.length < steps; j++) {
          directions.push(0);
        }
      }
    }
    directions.length = steps;

    // 2. Adjust the sum to match target one point at a time without ever
    //    reintroducing a direct +1/-1 direction reversal.
    const sum = () => directions.reduce((a, b) => a + b, 0);
    const adjustByOne = (delta) => {
      const candidates = delta > 0 ? [[0, 1], [-1, 0]] : [[0, -1], [1, 0]];
      for (const [from, to] of candidates) {
        for (let i = 0; i < directions.length; i++) {
          if (directions[i] !== from || !canPlace(i, to)) continue;
          directions[i] = to;
          return true;
        }
      }
      return false;
    };

    let guard = steps * 4 + 8;
    while (sum() < target && guard-- > 0) {
      if (!adjustByOne(1)) break;
    }
    guard = steps * 4 + 8;
    while (sum() > target && guard-- > 0) {
      if (!adjustByOne(-1)) break;
    }

    // 3. Fallback: guarantee the exact target height even in edge cases while
    //    still avoiding direct sign flips.
    while (sum() < target) {
      if (!adjustByOne(1)) break;
    }
    while (sum() > target) {
      if (!adjustByOne(-1)) break;
    }

    console.log('[HILL] getHillDirectionArray', { steps, target, sum: sum(), directions });
    return directions;
  }

  mulberry32(seed) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  bucketFill(startX, startY) {
    if (startX < 0 || startX >= this.levelData.header.width ||
        startY < 0 || startY >= this.levelData.header.height) {
      return;
    }

    const startChar = this.levelData.grid[startY][startX];
    if (startChar !== ' ') return;

    const width = this.levelData.header.width;
    const height = this.levelData.header.height;
    const visited = new Set();
    const queue = [[startX, startY]];
    const filled = [];
    const key = (x, y) => `${x},${y}`;
    visited.add(key(startX, startY));

    const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (queue.length > 0) {
      const [x, y] = queue.pop();
      this.levelData.grid[y][x] = 'p';
      filled.push([x, y]);

      for (const [dx, dy] of neighbors) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        if (this.levelData.grid[ny][nx] !== ' ') continue;
        const k = key(nx, ny);
        if (visited.has(k)) continue;
        visited.add(k);
        queue.push([nx, ny]);
      }
    }

    // Replace adjacent slope tiles that form the boundary of the filled area,
    // but only if the slope tile is fully surrounded by solid wall tiles
    // ('p' or 'à'), i.e. the diagonal is hidden and thus redundant.
    const SLOPE_TILES = new Set(['q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'n', 'o']);
    const WALL_TILES = new Set(['p', 'à']);
    const isSurroundedByWalls = (x, y) => {
      for (const [dx, dy] of neighbors) {
        const nx = x + dx;
        const ny = y + dy;
        // Out-of-bounds counts as solid wall.
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        if (!WALL_TILES.has(this.levelData.grid[ny][nx]) && !SLOPE_TILES.has(this.levelData.grid[ny][nx])) return false;
      }
      return true;
    };
    for (const [x, y] of filled) {
      for (const [dx, dy] of neighbors) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        if (SLOPE_TILES.has(this.levelData.grid[ny][nx]) && isSurroundedByWalls(nx, ny)) {
          this.levelData.grid[ny][nx] = 'p';
        }
      }
    }

    this.saveState();
    this.render();
    this.renderPreview();
  }

  zoomIn(mouseX = null, mouseY = null, worldX = null, worldY = null) {
    const oldZoom = this.zoom;
    this.zoom = Math.min(this.zoom * ZOOM_SPEED, ZOOM_MAX);
    
    // Adjust pan offset to zoom towards mouse position
    if (mouseX !== null && mouseY !== null && worldX !== null && worldY !== null) {
      const newZoom = this.zoom;
      this.panOffset.x = mouseX - worldX * newZoom;
      this.panOffset.y = mouseY - worldY * newZoom;
    }
    
    this.updateZoomDisplay();
    this.render();
    this.renderPreview();
  }
  
  zoomOut(mouseX = null, mouseY = null, worldX = null, worldY = null) {
    const oldZoom = this.zoom;
    let newZoom = this.zoom / ZOOM_SPEED;
    
    // Get viewport dimensions
    const container = this.canvas.parentElement;
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;
    
    // Get level dimensions
    const { width, height } = this.levelData.header;
    const levelWidth = width * this.tileSize;
    const levelHeight = height * this.tileSize;
    
    // Calculate zoom needed to fit level in viewport
    const zoomToFitWidth = viewportWidth / levelWidth;
    const zoomToFitHeight = viewportHeight / levelHeight;
    const zoomToFit = Math.min(zoomToFitWidth, zoomToFitHeight);
    
    // Don't zoom out more than needed to fit the level
    newZoom = Math.max(newZoom, zoomToFit);
    newZoom = Math.max(newZoom, ZOOM_MIN);
    
    this.zoom = newZoom;
    
    // Adjust pan offset to zoom towards mouse position
    if (mouseX !== null && mouseY !== null && worldX !== null && worldY !== null) {
      this.panOffset.x = mouseX - worldX * this.zoom;
      this.panOffset.y = mouseY - worldY * this.zoom;
    }
    
    // Shift content down when zooming out to keep it visible
    this.panOffset.y += 1;
    
    // If level fits in viewport, center it
    if (levelWidth * this.zoom <= viewportWidth && levelHeight * this.zoom <= viewportHeight) {
      this.centerLevel();
    }
    
    this.updateZoomDisplay();
    this.render();
    this.renderPreview();
  }
  
  centerLevel() {
    const container = this.canvas.parentElement;
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;
    
    const { width, height } = this.levelData.header;
    const levelWidth = width * this.tileSize * this.zoom;
    const levelHeight = height * this.tileSize * this.zoom;
    
    // Center the level in the viewport
    this.panOffset.x = (viewportWidth - levelWidth) / 2;
    this.panOffset.y = (viewportHeight - levelHeight) / 2;
  }
  
  updateZoomDisplay() {
    document.getElementById('zoomLevel').textContent = `${Math.round(this.zoom * 100)}%`;
  }
  
  updateVersionDisplay() {
    const el = document.getElementById('editorVersion');
    if (el) el.textContent = `v${EDITOR_VERSION}`;
  }
  
  scrollUp() {
    // Scroll up by 100 pixels
    this.panOffset.y += 100;
    this.render();
  }
  
  scrollDown() {
    // Scroll down by 100 pixels
    this.panOffset.y -= 100;
    this.render();
  }
  
  renderPreview() {
    const { width, height } = this.levelData.header;
    
    // Set preview canvas size
    this.previewCanvas.width = width * 16;
    this.previewCanvas.height = height * 16;
    
    // Clear preview canvas
    this.previewCtx.fillStyle = '#1a1a2e';
    this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    
    // Render using LevelRenderer
    this.levelRenderer.render(this.previewCtx, this.levelData);
  }
  
  saveState() {
    if (!this._lastSnapshot) {
      this._lastSnapshot = JSON.parse(JSON.stringify(this.levelData));
      this.redoStack = [];
      return;
    }

    const delta = this._computeDelta(this._lastSnapshot, this.levelData);
    if (!delta) {
      this.redoStack = [];
      return;
    }

    this.undoStack.push(delta);
    this.redoStack = [];

    // Limit stack size
    if (this.undoStack.length > UNDO_STACK_SIZE) {
      this.undoStack.shift();
    }

    this._lastSnapshot = JSON.parse(JSON.stringify(this.levelData));
  }

  _computeDelta(oldState, newState) {
    const delta = {};

    const oldHeader = oldState.header;
    const newHeader = newState.header;
    if (JSON.stringify(oldHeader) !== JSON.stringify(newHeader)) {
      delta.header = {
        old: JSON.parse(JSON.stringify(oldHeader)),
        new: JSON.parse(JSON.stringify(newHeader))
      };
    }

    const oldGrid = oldState.grid;
    const newGrid = newState.grid;
    const oldHeight = oldGrid.length;
    const oldWidth = oldGrid[0]?.length || 0;
    const newHeight = newGrid.length;
    const newWidth = newGrid[0]?.length || 0;

    if (oldHeight !== newHeight || oldWidth !== newWidth) {
      // Grid dimensions changed; store the full old and new grid for this state.
      delta.grid = {
        old: JSON.parse(JSON.stringify(oldGrid)),
        new: JSON.parse(JSON.stringify(newGrid))
      };
    } else {
      const cells = [];
      for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
          if (oldGrid[y][x] !== newGrid[y][x]) {
            cells.push({ x, y, old: oldGrid[y][x], new: newGrid[y][x] });
          }
        }
      }
      if (cells.length > 0) {
        delta.cells = cells;
      }
    }

    if (delta.header || delta.cells || delta.grid) {
      return delta;
    }
    return null;
  }

  _applyDelta(delta, forward) {
    if (delta.header) {
      this.levelData.header = JSON.parse(JSON.stringify(forward ? delta.header.new : delta.header.old));
      this.updateWallColorDisplay(this.levelData.header.wallColor);
    }

    if (delta.grid) {
      this.levelData.grid = JSON.parse(JSON.stringify(forward ? delta.grid.new : delta.grid.old));
    } else if (delta.cells) {
      const cells = delta.cells;
      for (const cell of cells) {
        this.levelData.grid[cell.y][cell.x] = forward ? cell.new : cell.old;
      }
    }
  }

  _invertDelta(delta) {
    const inverted = {};
    if (delta.header) {
      inverted.header = { old: delta.header.new, new: delta.header.old };
    }
    if (delta.grid) {
      inverted.grid = { old: delta.grid.new, new: delta.grid.old };
    } else if (delta.cells) {
      inverted.cells = delta.cells.map(c => ({ x: c.x, y: c.y, old: c.new, new: c.old }));
    }
    return inverted;
  }

  undo() {
    if (this.undoStack.length === 0) return;

    const delta = this.undoStack.pop();
    this._applyDelta(delta, false);
    this.redoStack.push(this._invertDelta(delta));
    this._lastSnapshot = JSON.parse(JSON.stringify(this.levelData));
    this.render();
    this.updateParameterInputs();
  }

  redo() {
    if (this.redoStack.length === 0) return;

    const delta = this.redoStack.pop();
    this._applyDelta(delta, true);
    this.undoStack.push(this._invertDelta(delta));
    this._lastSnapshot = JSON.parse(JSON.stringify(this.levelData));
    this.render();
    this.updateParameterInputs();
  }
  
  render() {
    const { width, height } = this.levelData.header;
    
    console.log('[LEVEL_EDITOR_RENDER] Rendering - header width:', width, 'height:', height);
    console.log('[LEVEL_EDITOR_RENDER] Grid dimensions:', this.levelData.grid.length, 'x', this.levelData.grid[0]?.length);
    console.log('[LEVEL_EDITOR_RENDER] Tile size:', this.tileSize, 'Zoom:', this.zoom);
    console.log('[LEVEL_EDITOR_RENDER] Canvas element before:', this.canvas.width, 'x', this.canvas.height);
    
    // Set canvas size to actual grid size (not scaled by zoom)
    // The zoom is applied via transform, not canvas dimensions
    this.canvas.width = width * this.tileSize;
    this.canvas.height = height * this.tileSize;
    
    console.log('[LEVEL_EDITOR_RENDER] Canvas dimensions set to:', this.canvas.width, 'x', this.canvas.height);
    console.log('[LEVEL_EDITOR_RENDER] Grid matches header?', this.levelData.grid.length === height && this.levelData.grid[0]?.length === width);
    
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply zoom and pan offset
    this.ctx.save();
    this.ctx.translate(this.panOffset.x, this.panOffset.y);
    this.ctx.scale(this.zoom, this.zoom);
    
    // Draw grid
    // Tile size is now scaled by ctx.scale(), so use base tile size
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const char = this.levelData.grid[y][x];
        
        // Draw tile image if available
        if (char !== ' ') {
          const code = char.charCodeAt(0);
          const img = this.levelRenderer.tileCache.get(code);
          
          // Check if image is valid and loaded
          if (img && img.complete && img.naturalWidth > 0) {
            try {
              this.ctx.drawImage(
                img,
                x * this.tileSize,
                y * this.tileSize,
                this.tileSize,
                this.tileSize
              );
            } catch (e) {
              // Image is broken, use fallback
              console.warn(`[EDITOR] Broken image for char '${char}' (code ${code}), using fallback`);
              const tile = TILE_MAP[char] || TILE_MAP[' '];
              this.ctx.fillStyle = tile.color;
              this.ctx.fillRect(
                x * this.tileSize,
                y * this.tileSize,
                this.tileSize,
                this.tileSize
              );
            }
          } else {
            // Fallback to colored rectangle
            const tile = TILE_MAP[char] || TILE_MAP[' '];
            this.ctx.fillStyle = tile.color;
            this.ctx.fillRect(
              x * this.tileSize,
              y * this.tileSize,
              this.tileSize,
              this.tileSize
            );
          }
        }
        
        // Draw grid lines
        this.ctx.strokeStyle = '#0f3460';
        this.ctx.lineWidth = 0.5 / this.zoom; // Scale line width inversely to keep it visible
        this.ctx.strokeRect(
          x * this.tileSize,
          y * this.tileSize,
          this.tileSize,
          this.tileSize
        );
      }
    }
    
    // Draw selection
    if (this.selection) {
      const x1 = Math.min(this.selection.startX, this.selection.endX);
      const y1 = Math.min(this.selection.startY, this.selection.endY);
      const x2 = Math.max(this.selection.startX, this.selection.endX);
      const y2 = Math.max(this.selection.startY, this.selection.endY);
      
      this.ctx.strokeStyle = '#e94560';
      this.ctx.lineWidth = 2 / this.zoom; // Scale line width inversely
      this.ctx.setLineDash([5, 5]);
      this.ctx.strokeRect(
        x1 * this.tileSize,
        y1 * this.tileSize,
        (x2 - x1 + 1) * this.tileSize,
        (y2 - y1 + 1) * this.tileSize
      );
      this.ctx.setLineDash([]);
    }
    
    // Draw slope preview
    if (this.slopePreview) {
      this.ctx.fillStyle = 'rgba(233, 69, 96, 0.5)';
      for (const tile of this.slopePreview) {
        this.ctx.fillRect(
          tile.x * this.tileSize,
          tile.y * this.tileSize,
          this.tileSize,
          this.tileSize
        );
      }
    }

    // Draw triangle preview
    if (this.trianglePreview) {
      this.ctx.fillStyle = 'rgba(233, 69, 96, 0.5)';
      for (const tile of this.trianglePreview) {
        this.ctx.fillRect(
          tile.x * this.tileSize,
          tile.y * this.tileSize,
          this.tileSize,
          this.tileSize
        );
      }
    }

    // Draw hill preview
    if (this.hillPreview) {
      this.ctx.fillStyle = 'rgba(233, 69, 96, 0.5)';
      for (const tile of this.hillPreview) {
        this.ctx.fillRect(
          tile.x * this.tileSize,
          tile.y * this.tileSize,
          this.tileSize,
          this.tileSize
        );
      }
    }

    this.ctx.restore();
    
    // Update size display
    document.getElementById('levelSize').textContent = `Size: ${width} x ${height}`;
  }
  
  updateParameterInputs() {
    const h = this.levelData.header;
    document.getElementById('paramWidth').value = h.width;
    document.getElementById('paramHeight').value = h.height;
    document.getElementById('paramStartHeight').value = h.startHeight;
    document.getElementById('paramEmptySpace').value = h.emptySpaceHeight;
    document.getElementById('paramBedrock').value = h.bedrockHeight;
    document.getElementById('paramBunkers').value = this.genBunkers;
    document.getElementById('paramFuel').value = this.genFuel;
    document.getElementById('paramBunkerChance').value = this.genBunkerChance === null ? '' : this.genBunkerChance;
    document.getElementById('paramFuelChance').value = this.genFuelChance === null ? '' : this.genFuelChance;
    const pod = h.colors.pod || [0, 164, 0];
    document.getElementById('paramPodR').value = pod[0];
    document.getElementById('paramPodG').value = pod[1];
    document.getElementById('paramPodB').value = pod[2];
    
    console.log('[LEVEL_EDITOR_PARAMS] Updated parameter inputs - width:', h.width, 'height:', h.height);
  }
  
  updateParameters() {
    const h = this.levelData.header;
    const newWidth = parseInt(document.getElementById('paramWidth').value);
    const newHeight = parseInt(document.getElementById('paramHeight').value);

    h.width = newWidth;
    h.height = newHeight;
    h.startHeight = parseInt(document.getElementById('paramStartHeight').value);
    h.emptySpaceHeight = parseInt(document.getElementById('paramEmptySpace').value);
    h.bedrockHeight = parseInt(document.getElementById('paramBedrock').value);
    this.genBunkers = parseInt(document.getElementById('paramBunkers').value) || 0;
    this.genFuel = parseInt(document.getElementById('paramFuel').value) || 0;
    const bChance = document.getElementById('paramBunkerChance').value;
    const fChance = document.getElementById('paramFuelChance').value;
    this.genBunkerChance = bChance === '' ? null : parseFloat(bChance);
    this.genFuelChance = fChance === '' ? null : parseFloat(fChance);
    h.colors.pod = [
      parseInt(document.getElementById('paramPodR').value) || 0,
      parseInt(document.getElementById('paramPodG').value) || 0,
      parseInt(document.getElementById('paramPodB').value) || 0
    ];

    // Wall color is controlled by the color picker, not by the parameter inputs.

    // Resize grid if needed
    if (newWidth !== this.levelData.grid[0].length || newHeight !== this.levelData.grid.length) {
      this.resizeGrid(newWidth, newHeight);
    }

    this.render();
    this.renderPreview();

    this.saveState();
  }
  
  resizeGrid(newWidth, newHeight) {
    const oldGrid = this.levelData.grid;
    const newGrid = [];
    
    for (let y = 0; y < newHeight; y++) {
      const row = [];
      for (let x = 0; x < newWidth; x++) {
        if (y < oldGrid.length && x < oldGrid[0].length) {
          row.push(oldGrid[y][x]);
        } else {
          row.push(' ');
        }
      }
      newGrid.push(row);
    }
    
    this.levelData.grid = newGrid;
  }
  
  async refreshLevelSelect() {
    const levelpack = document.getElementById('levelpackSelect').value;
    const basePath = (levelpack === 'default' || levelpack === 'dulsi') ? '/levelpacks' : '/dev/external-levelpacks';
    const select = document.getElementById('levelSelect');
    const currentValue = select.value;
    select.innerHTML = '';

    let levelCount = null;
    try {
      const metaResp = await fetch(`${basePath}/${levelpack}/meta.json`);
      if (metaResp.ok) {
        const meta = await metaResp.json();
        levelCount = meta.levelCount;
      }
    } catch (e) {
      console.warn('[LEVEL_EDITOR] Failed to load meta.json for pack:', levelpack, e);
    }

    if (!levelCount) {
      // Fallback: probe for levels by fetching until 404
      levelCount = 0;
      for (let i = 1; i <= 100; i++) {
        try {
          const resp = await fetch(`${basePath}/${levelpack}/level${i}.def`, { method: 'HEAD' });
          if (!resp.ok) break;
          levelCount = i;
        } catch (e) {
          break;
        }
      }
    }

    for (let i = 1; i <= levelCount; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `Level ${i}`;
      select.appendChild(opt);
    }

    // Preserve selection if still valid
    if (currentValue && parseInt(currentValue, 10) <= levelCount) {
      select.value = currentValue;
    }
    console.log('[LEVEL_EDITOR] Refreshed level select for pack:', levelpack, 'count:', levelCount);
  }

  async loadLevel() {
    const levelpack = document.getElementById('levelpackSelect').value;
    const levelNum = document.getElementById('levelSelect').value;

    console.log('[LEVEL_EDITOR_LOAD] Loading level:', levelpack, levelNum);

    // Default and dulsi packs are in public/levelpacks/, classic pack is in dev/external-levelpacks/
    const basePath = (levelpack === 'default' || levelpack === 'dulsi') ? '/levelpacks' : '/dev/external-levelpacks';

    try {
      const response = await fetch(`${basePath}/${levelpack}/level${levelNum}.def`);
      console.log('[LEVEL_EDITOR_LOAD] Fetch response status:', response.status);
      const text = await response.text();
      console.log('[LEVEL_EDITOR_LOAD] File content length:', text.length);
      console.log('[LEVEL_EDITOR_LOAD] First 200 chars:', text.substring(0, 200));
      this.parseLevelFile(text);
      console.log('[LEVEL_EDITOR_LOAD] Parsed header:', this.levelData.header);
      console.log('[LEVEL_EDITOR_LOAD] Grid dimensions:', this.levelData.grid.length, 'x', this.levelData.grid[0]?.length);
      this._lastSnapshot = null;
      this.saveState();
      this.updateParameterInputs();
      // Set level name input to match loaded level
      const levelName = `level${levelNum}`;
      document.getElementById('levelNameInput').value = levelName;
      localStorage.setItem('editorLevelName', levelName);
      this.render();
      this.renderPreview();
      console.log('[LEVEL_EDITOR_LOAD] Level loaded successfully');
    } catch (error) {
      console.error('[LEVEL_EDITOR_LOAD] Failed to load level:', error);
      alert('Failed to load level: ' + error.message);
    }
  }
  
  loadLevelFromString(text) {
    console.log('[LEVEL_EDITOR_LOAD_STRING] Loading level from string');
    this.parseLevelFile(text);
    this._lastSnapshot = null;
    this.saveState();
    this.updateParameterInputs();
    this.render();
    this.renderPreview();
    console.log('[LEVEL_EDITOR_LOAD_STRING] Level loaded from string successfully');
  }
  
  parseLevelFile(text) {
    const lines = text.split('\n');
    console.log('[LEVEL_EDITOR_PARSE] Total lines in file:', lines.length);
    
    // Log first 15 lines for debugging
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      console.log(`[LEVEL_EDITOR_PARSE] Line ${i}: "${lines[i]}" (length: ${lines[i].length})`);
    }
    
    // Parse header
    const widthLine = lines[0].trim();
    const heightLine = lines[1].trim();
    console.log('[LEVEL_EDITOR_PARSE] Width line:', widthLine, 'Height line:', heightLine);
    
    this.levelData.header.width = parseInt(widthLine);
    this.levelData.header.height = parseInt(heightLine);
    this.levelData.header.startHeight = parseInt(lines[2].trim());
    this.levelData.header.emptySpaceHeight = parseInt(lines[3].trim());
    this.levelData.header.bedrockHeight = parseInt(lines[4].trim());
    
    console.log('[LEVEL_EDITOR_PARSE] Header parsed - width:', this.levelData.header.width, 'height:', this.levelData.header.height);
    
    // Parse wall color from first color line (background/tractor RGB)
    const bgColors = lines[5].trim().split(/\s+/);
    const wallR = parseInt(bgColors[0]) || 0;
    const wallG = parseInt(bgColors[1]) || 0;
    const wallB = parseInt(bgColors[2]) || 0;
    const wallHex = this.rgbToHex(wallR, wallG, wallB);
    this.updateWallColorDisplay(wallHex);

    // Pod color is the only color exposed in the editor
    const podColors = lines[7].trim().split(/\s+/);
    this.levelData.header.colors.pod = [
      parseInt(podColors[0]) || 0,
      parseInt(podColors[1]) || 0,
      parseInt(podColors[2]) || 0
    ];
    
    // Parse grid (lines 10 onwards)
    this.levelData.grid = [];
    for (let i = 10; i < lines.length; i++) {
      const line = lines[i] || '';
      const row = line.split('').slice(0, this.levelData.header.width);
      while (row.length < this.levelData.header.width) {
        row.push(' ');
      }
      this.levelData.grid.push(row);
      if (i < 15) {
        console.log(`[LEVEL_EDITOR_PARSE] Grid row ${i-10}: length=${row.length}, first 20 chars="${row.slice(0, 20).join('')}"`);
      }
    }
    
    console.log('[LEVEL_EDITOR_PARSE] Grid rows parsed:', this.levelData.grid.length);
    
    // Ensure grid has correct height
    while (this.levelData.grid.length < this.levelData.header.height) {
      this.levelData.grid.push(new Array(this.levelData.header.width).fill(' '));
    }
    
    console.log('[LEVEL_EDITOR_PARSE] Final grid dimensions:', this.levelData.grid.length, 'x', this.levelData.grid[0]?.length);
  }
  
  newLevel() {
    if (confirm('Create new level? Unsaved changes will be lost.')) {
      this.levelData.header = {
        width: 82,
        height: 120,
        startHeight: 17,
        emptySpaceHeight: 5,
        bedrockHeight: 25,
        colors: {
          pod: [0, 164, 0]
        },
        wallColor: '#ff0000'
      };
      this.initializeGrid();
      this.undoStack = [];
      this.redoStack = [];
      this._lastSnapshot = null;
      this.saveState();
      this.render();
      this.updateParameterInputs();
    }
  }
  
  async generateRandom() {
    if (!confirm('Generate a random level? Unsaved changes will be lost.')) return;
    if (typeof window.generateValidRandomLevel !== 'function') {
      alert('Level generator not loaded. Make sure level-generator.js is included.');
      return;
    }

    const MIN_GENERATE_WIDTH = 140;
    if (this.levelData.header.width < MIN_GENERATE_WIDTH) {
      alert(`Width is too small for the level generator (${this.levelData.header.width}). It will be increased to ${MIN_GENERATE_WIDTH}.`);
      this.levelData.header.width = MIN_GENERATE_WIDTH;
      document.getElementById('paramWidth').value = MIN_GENERATE_WIDTH;
      this.updateParameters();
      this.initializeGrid();
      this.render();
    }

    const btn = document.getElementById('generateBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="gen-spinner"></span>Generating...';
    try {
      const opts = {
        width: this.levelData.header.width,
        height: this.levelData.header.height,
        bunkers: this.genBunkers,
        fuel: this.genFuel
      };
      if (this.genBunkerChance !== null) opts.bunkerChance = this.genBunkerChance;
      if (this.genFuelChance !== null) opts.fuelChance = this.genFuelChance;
      const defContent = await window.generateValidRandomLevel(opts);
      this.loadLevelFromString(defContent);
      console.log('[LEVEL_EDITOR_GENERATE] Valid random level generated and loaded');
    } catch (err) {
      alert('Failed to generate valid level: ' + err.message);
      console.error('[LEVEL_EDITOR_GENERATE]', err);
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Generate';
    }
  }
  
  saveLevel() {
    const defContent = this.generateLevelFile();
    const modal = document.getElementById('saveModal');
    const textArea = document.getElementById('saveModalText');
    if (!modal || !textArea) return;

    textArea.value = defContent;
    modal.style.display = 'flex';

    this._pendingDefContent = defContent;
    this._pendingDefName = document.getElementById('levelNameInput').value || 'level';
  }

  closeSaveModal() {
    const modal = document.getElementById('saveModal');
    if (modal) modal.style.display = 'none';
    this._pendingDefContent = null;
    this._pendingDefName = null;
  }

  copySaveModalText() {
    const textArea = document.getElementById('saveModalText');
    if (!textArea) return;
    textArea.select();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textArea.value).then(() => {
        const btn = document.getElementById('copyModalBtn');
        if (btn) {
          const original = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = original, 1500);
        }
      });
    } else {
      document.execCommand('copy');
    }
  }

  downloadSaveModalText() {
    const content = this._pendingDefContent || document.getElementById('saveModalText').value;
    const name = this._pendingDefName || 'level';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.def`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  generateLevelFile() {
    const h = this.levelData.header;
    const lines = [];
    
    lines.push(h.width.toString().padEnd(12) + '; width');
    lines.push(h.height.toString().padEnd(12) + '; height');
    lines.push(h.startHeight.toString().padEnd(12) + '; height of start');
    lines.push(h.emptySpaceHeight.toString().padEnd(12) + '; height of empty space');
    lines.push(h.bedrockHeight.toString().padEnd(12) + '; height of bedrock');

    // Use the picked wall color as the full RGB background/tractor color
    const wallHex = (h.wallColor && /^#[0-9A-Fa-f]{6}$/.test(h.wallColor)) ? h.wallColor : '#ff0000';
    const wr = parseInt(wallHex.substring(1, 3), 16);
    const wg = parseInt(wallHex.substring(3, 5), 16);
    const wb = parseInt(wallHex.substring(5, 7), 16);
    lines.push(`${wr.toString().padStart(4)} ${wg.toString().padStart(4)} ${wb.toString().padStart(4)} ; background/tractor (wall color)`);

    const pod = h.colors.pod || [0, 164, 0];
    lines.push(`${(164).toString().padStart(4)} ${(0).toString().padStart(4)} ${(0).toString().padStart(4)} ; gun/reactor/stand`);
    lines.push(`${pod[0].toString().padStart(4)} ${pod[1].toString().padStart(4)} ${pod[2].toString().padStart(4)} ; pod/blip`);
    lines.push(`${(0).toString().padStart(4)} ${(164).toString().padStart(4)} ${(164).toString().padStart(4)} ; text`);
    lines.push(`${(164).toString().padStart(4)} ${(84).toString().padStart(4)} ${(84).toString().padStart(4)} ; shield`);
    
    // Grid rows
    for (const row of this.levelData.grid) {
      lines.push(row.join(''));
    }
    
    return lines.join('\n');
  }
  
  testLevel() {
    // Generate level content
    const defContent = this.generateLevelFile();

    // Get wall color from input
    const wallColor = document.getElementById('wallColorInput').value;

    // Save editor state to localStorage for restoration when returning to editor
    try {
      this.saveEditorState();
    } catch (error) {
      console.error('[EDITOR_TEST] Failed to save editor state before test:', error);
      // Continue with test even if state cannot be saved; do not block the user.
    }

    // Send message to parent window with level data and wall color
    window.parent.postMessage({ type: 'EDITOR_TEST', levelData: defContent, wallColor: wallColor }, '*');
  }

  addToPack() {
    const defContent = this.generateLevelFile();
    const levelName = document.getElementById('levelNameInput').value || 'level';
    const wallColor = document.getElementById('wallColorInput').value;

    try {
      this.saveEditorState();
    } catch (error) {
      console.error('[EDITOR_ADD_TO_PACK] Failed to save editor state:', error);
      // Continue adding to pack even if local editor state cannot be saved.
    }

    window.parent.postMessage({ type: 'EDITOR_ADD_TO_PACK', levelData: defContent, levelName, wallColor }, '*');
  }

  saveEditorState() {
    const defContent = this.generateLevelFile();
    const undoStackJson = JSON.stringify(this.undoStack);
    const redoStackJson = JSON.stringify(this.redoStack);

    console.log('[EDITOR_STORAGE] Saving editor state:', {
      defContentLength: defContent.length,
      undoStackEntries: this.undoStack.length,
      undoStackJsonLength: undoStackJson.length,
      redoStackEntries: this.redoStack.length,
      redoStackJsonLength: redoStackJson.length
    });

    const items = [
      { key: 'editorLevel', value: defContent },
      { key: 'editorTool', value: this.currentTool },
      { key: 'editorTile', value: this.currentTile },
      { key: 'editorUndoStack', value: undoStackJson },
      { key: 'editorRedoStack', value: redoStackJson }
    ];

    for (const item of items) {
      try {
        localStorage.setItem(item.key, item.value);
      } catch (error) {
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          console.error('[EDITOR_STORAGE_QUOTA] Failed to store', item.key, 'size:', item.value.length, error);
          throw error;
        }
        console.error('[EDITOR_STORAGE] Failed to store', item.key, error);
        throw error;
      }
    }
  }
}

// Initialize editor when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  window.levelEditor = new LevelEditor();
  await window.levelEditor.init();
  
  // Check if returning from editor test mode with saved level
  const savedLevel = localStorage.getItem('editorLevel');
  console.log('[EDITOR] savedLevel exists:', !!savedLevel);
  if (savedLevel) {
    // Load the saved level into the editor
    window.levelEditor.loadLevelFromString(savedLevel);
    
    // Restore selected tool
    const savedTool = localStorage.getItem('editorTool');
    console.log('[EDITOR] savedTool:', savedTool);
    if (savedTool) {
      window.levelEditor.currentTool = savedTool;
      // Update UI to reflect selected tool
      document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === savedTool);
      });
    }
    
    // Restore selected tile
    const savedTile = localStorage.getItem('editorTile');
    console.log('[EDITOR] savedTile:', savedTile);
    if (savedTile) {
      window.levelEditor.currentTile = savedTile;
      window.levelEditor.updateCurrentTileDisplay();
    }
    
    // Restore undo/redo history
    const savedUndoStack = localStorage.getItem('editorUndoStack');
    const savedRedoStack = localStorage.getItem('editorRedoStack');
    console.log('[EDITOR] savedUndoStack length:', savedUndoStack ? JSON.parse(savedUndoStack).length : 0);
    console.log('[EDITOR] savedRedoStack length:', savedRedoStack ? JSON.parse(savedRedoStack).length : 0);
    if (savedUndoStack) {
      window.levelEditor.undoStack = JSON.parse(savedUndoStack);
    }
    if (savedRedoStack) {
      window.levelEditor.redoStack = JSON.parse(savedRedoStack);
    }
    
    // Don't clear localStorage - keep it for page reloads
    // It will be overwritten when user clicks Test again
  }
  
  // Save editor state before page unload (F5, close tab, etc.)
  window.addEventListener('beforeunload', () => {
    if (window.levelEditor) {
      window.levelEditor.saveEditorState();
    }
  });
});
