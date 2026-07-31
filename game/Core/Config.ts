/**
 * Centralized Configuration for the HD-2D RPG Engine
 * Avoids magic numbers and paths, making systems highly customizable.
 */
export const Config = {
  // Screen and Renderer settings
  RENDERER: {
    ANTIALIASING: true,
    SHADOWS_ENABLED: true,
    CLEAR_COLOR: 0x0a0c10, // Dark medieval slate background
    PIXEL_RATIO_LIMIT: 2,  // Performance optimization for high-DPI screens
  },

  // Fixed isometric-style perspective camera configuration
  CAMERA: {
    FOV: 45, // Decent FOV to prevent excessive zoom on mobile while retaining isometric style
    NEAR: 1,
    FAR: 1000,
    // Camera placement relative to the focal target
    OFFSET: {
      X: 0,
      Y: 18,
      Z: 18,
    },
    // Tilt settings to capture the depth of HD-2D terrain
    TARGET_OFFSET: {
      X: 0,
      Y: 0.5,
      Z: 0,
    },
  },

  // Smooth camera tracking controller config
  CAMERA_CONTROLLER: {
    LERP_SPEED: 6.0,
  },

  // Player gameplay config
  PLAYER: {
    SPEED: 5.0, // Configurable movement speed (units per second)
    ANIMATION_FPS: 10, // Dynamic FPS override for walk cycles
  },

  // Lighting configuration
  LIGHTS: {
    AMBIENT: {
      COLOR: 0x2a3040, // Slightly warmer and brighter ambient
      INTENSITY: 1.5,
    },
    DIRECTIONAL: {
      COLOR: 0xfff8e8, // Slightly warmer and intense sunlight
      INTENSITY: 2.8,
      POSITION: { X: 20, Y: 40, Z: 20 },
      SHADOW_MAP_SIZE: 2048, // High-quality shadows
      SHADOW_BIAS: -0.0005,
      SHADOW_CAMERA_SIZE: 30,
    },
  },

  // World and Terrain settings
  WORLD: {
    GRID_SIZE: 1, // Base unit size for the movement grid (1 meter)
    TERRAIN_WIDTH: 32, // Number of horizontal grid units
    TERRAIN_DEPTH: 32, // Number of vertical grid units
    TILE_SIZE: 1,
  },

  // Interactive systems config
  INTERACTION: {
    MAX_DISTANCE: 1.8, // Distance threshold to trigger prompt and interaction
  },

  // Centralized Spawning Positions (no coordinates hardcoded in game scripts)
  SPAWNS: {
    PLAYER: { id: 'player_hero', x: 0, z: 2.0 },
    NPCS: [
      { id: 'royal_guard', classId: 'Knight', x: -3, z: -2, dialogueId: 'royal_guard_talk', name: 'Guardia Real' },
      { id: 'friendly_slime', classId: 'Slime', x: 3, z: -3, dialogueId: 'friendly_slime', name: 'Limo Amistoso' },
      { id: 'merchant_npc', classId: 'Knight', x: -4, z: 4, dialogueId: 'merchant_talk', name: 'Mercader Ambulante' },
      { id: 'forest_slime_1', classId: 'Slime', x: 5, z: 5, isEnemy: true, name: 'Limo Furioso' },
      { id: 'forest_slime_2', classId: 'Slime', x: -7, z: -7, isEnemy: true, name: 'Limo Silvestre' },
    ],
    OBJECTS: [
      // Ancient Stone Columns
      { id: 'col_1', type: 'COLUMN', x: -6, z: -6 },
      { id: 'col_2', type: 'COLUMN', x: -10, z: -8 },
      { id: 'col_3', type: 'COLUMN', x: -5, z: -10 },
      { id: 'col_4', type: 'COLUMN', x: 8, z: 8 },
      { id: 'col_5', type: 'COLUMN', x: 10, z: 5 },
      // Trees
      { id: 'tree_1', type: 'TREE', x: -8, z: 8 },
      { id: 'tree_2', type: 'TREE', x: -5, z: 6 },
      { id: 'tree_3', type: 'TREE', x: -11, z: 10 },
      { id: 'tree_4', type: 'TREE', x: 5, z: -4 },
      { id: 'tree_5', type: 'TREE', x: 8, z: -8 },
      { id: 'tree_6', type: 'TREE', x: 11, z: -5 },
      // Rocks
      { id: 'rock_1', type: 'ROCK', x: -3, z: 5 },
      { id: 'rock_2', type: 'ROCK', x: 3, z: -6 },
      { id: 'rock_3', type: 'ROCK', x: -7, z: -2 },
    ],
    INTERACTABLES: [
      {
        id: 'gold_chest_1',
        type: 'CHEST',
        x: 1.5,
        z: -2.0,
        message: 'You open the dusty chest! Found a Legendary Silver Sword!',
      },
      {
        id: 'save_shrine_1',
        type: 'SAVE_POINT',
        x: -1.5,
        z: -3.0,
        message: 'Cristal de Luz',
      },
      {
        id: 'sign_welcome',
        type: 'SIGN',
        x: -2.0,
        z: 3.0,
        message: 'WELCOME TO THE ELDORIA VALLEYS. Press E to read logs.',
      },
      {
        id: 'sign_ruins',
        type: 'SIGN',
        x: 5.0,
        z: -1.0,
        message: 'WARNING: Ruins Ahead! Watch out for Forest Slimes.',
      },
    ],
  },

  // Input mapping definition
  INPUTS: {
    KEYS: {
      UP: ['KeyW', 'ArrowUp'],
      DOWN: ['KeyS', 'ArrowDown'],
      LEFT: ['KeyA', 'ArrowLeft'],
      RIGHT: ['KeyD', 'ArrowRight'],
      ACTION: ['KeyE', 'Space'],
      CANCEL: ['Escape', 'KeyQ'],
      PAUSE: ['KeyP'],
      INVENTORY: ['KeyI', 'KeyB'],
    } as Record<string, string[]>,
  },

  // Asset configurations (e.g. placeholder textures or models)
  ASSETS: {
    TEXTURES: {
      CHECKERBOARD: 'checkerboard',
      GRASS: 'grass',
      STONE: 'stone',
    },
  },

  // Debug settings
  DEBUG: {
    ENABLED: false, // Master switch for Debug overlay panels (disabled by default)
    UPDATE_RATE: 0.1, // Update rate for telemetry metrics in seconds
  }
};
