/**
 * Mobile and Performance-Centric Configuration Profiles.
 * Decouples size, sensitivity, opacities, safe margins, and graphics level metrics.
 */
export const MobileConfig = {
  // Touch Controller UI Settings
  TOUCH: {
    JOYSTICK: {
      SIZE: 120,          // Diameter of the joystick base in px
      KNOB_SIZE: 50,     // Diameter of the inner controller knob in px
      DEADZONE: 0.1,      // Minimal movement threshold to register input (0.0 to 1.0)
      SENSITIVITY: 1.2,  // Speed booster ratio mapping touch distance to vectors
      OPACITY_IDLE: 0.35, // Visual opacity of the stick when not touched
      OPACITY_ACTIVE: 0.85, // Visual opacity when actively dragged
      OFFSET_BOTTOM: 48,  // Safe margin spacing from the bottom boundary in px
      OFFSET_LEFT: 48,    // Safe margin spacing from the left boundary in px
    },
    BUTTONS: {
      SIZE: 64,          // Width and height of main actions circle in px
      OPACITY_IDLE: 0.4,
      OPACITY_ACTIVE: 0.9,
      OFFSET_BOTTOM: 48,
      OFFSET_RIGHT: 48,
    }
  },

  // Interactive UI Layout bounds (Safe Areas & Notch compensation overrides)
  SAFE_AREA: {
    NOTCH_PADDING_TOP: 'env(safe-area-inset-top, 16px)',
    NOTCH_PADDING_BOTTOM: 'env(safe-area-inset-bottom, 16px)',
    NOTCH_PADDING_LEFT: 'env(safe-area-inset-left, 16px)',
    NOTCH_PADDING_RIGHT: 'env(safe-area-inset-right, 16px)',
  },

  // Graphical Quality Presets
  GRAPHICS_PROFILES: {
    LOW: {
      name: 'Bajo (Ahorro Batería)',
      pixelRatioLimit: 1.0,      // Scale rendering down to 1x to avoid overheating
      shadowsEnabled: false,     // Disable resource-heavy dynamic shadow mapping
      shadowMapSize: 512,        // Unused if disabled, but kept as backup
      antialiasing: false,       // Turn off hardware multisampling
      postProcessing: false,
    },
    MEDIUM: {
      name: 'Medio (Recomendado)',
      pixelRatioLimit: 1.5,      // Scaled up for crisp UI text with good GPU performance
      shadowsEnabled: true,      // Basic soft dynamic shadow mapping
      shadowMapSize: 1024,
      antialiasing: true,
      postProcessing: false,
    },
    HIGH: {
      name: 'Alto (Máxima Calidad)',
      pixelRatioLimit: 2.0,      // Max native DPI mapping (up to 2x)
      shadowsEnabled: true,      // Premium quality dynamic casting
      shadowMapSize: 2048,
      antialiasing: true,
      postProcessing: true,
    }
  }
};
