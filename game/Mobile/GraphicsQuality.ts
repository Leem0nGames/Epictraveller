import * as THREE from 'three';
import { MobileConfig } from './MobileConfig';
import { DeviceDetector } from './DeviceDetector';
import { EventBus } from '../Core/EventBus';

export type QualityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Manages dynamically toggleable graphical fidelity presets.
 * Helps prevent battery drain and frames-per-second lag on mid-tier mobile architectures.
 */
export class GraphicsQuality {
  private static instance: GraphicsQuality | null = null;
  private currentLevel: QualityLevel = 'MEDIUM';
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.autoDetectProfile();
    GraphicsQuality.instance = this;
  }

  /**
   * Singleton accessor
   */
  public static getInstance(): GraphicsQuality | null {
    return GraphicsQuality.instance;
  }

  /**
   * Evaluates the active device constraints and assigns an optimized initial profile
   */
  private autoDetectProfile(): void {
    if (typeof window === 'undefined') return;

    // Check for user preset in local persistent browser cache
    const cached = localStorage.getItem('game_graphics_quality') as QualityLevel;
    if (cached && ['LOW', 'MEDIUM', 'HIGH'].includes(cached)) {
      this.currentLevel = cached;
      return;
    }

    const isMobile = DeviceDetector.isTouchDevice() || DeviceDetector.getOS() !== 'Desktop';

    if (isMobile) {
      const threads = DeviceDetector.getCPUThreads();
      const memory = DeviceDetector.getDeviceMemory();

      // Low-end mobile profile selection (Single-session power saver)
      if (threads <= 4 || (memory !== null && memory <= 3)) {
        this.currentLevel = 'LOW';
      } else {
        this.currentLevel = 'MEDIUM';
      }
    } else {
      // Desktop rigs get High fidelity by default
      this.currentLevel = 'HIGH';
    }
  }

  /**
   * Switches the graphics settings of the active WebGL renderer
   */
  public applyProfile(renderer: THREE.WebGLRenderer, scene: THREE.Scene, level: QualityLevel): void {
    this.currentLevel = level;
    localStorage.setItem('game_graphics_quality', level);

    const profile = MobileConfig.GRAPHICS_PROFILES[level];
    if (!profile) return;

    // 1. Set dynamic pixel ratio limits
    const pixelRatio = Math.min(window.devicePixelRatio, profile.pixelRatioLimit);
    renderer.setPixelRatio(pixelRatio);

    // 2. Adjust dynamic shadow mapping
    renderer.shadowMap.enabled = profile.shadowsEnabled;
    
    // In Three.js, changing shadowMap properties dynamically requires clearing and updating scene materials
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // Force shader compilation trigger for shadows
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => {
            mat.needsUpdate = true;
          });
        } else if (object.material) {
          object.material.needsUpdate = true;
        }
      }
    });

    // 3. Emit status change on the global EventBus to notify HUD debug overlays
    this.eventBus.emit('graphics:quality:changed', {
      level: this.currentLevel,
      profile: profile,
    });

    console.log(`[GraphicsQuality] Applied level "${level}":`, profile);
  }

  /**
   * Retrieves the currently active quality level enum
   */
  public get level(): QualityLevel {
    return this.currentLevel;
  }

  /**
   * Gets details of the currently loaded profile
   */
  public get profile() {
    return MobileConfig.GRAPHICS_PROFILES[this.currentLevel];
  }

  public destroy(): void {
    GraphicsQuality.instance = null;
  }
}
