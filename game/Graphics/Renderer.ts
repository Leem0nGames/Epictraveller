import * as THREE from 'three';
import { Config } from '../Core/Config';

/**
 * Handles WebGL rendering, configuring resolution, shadows, and color pipelines
 * specifically optimized for a high-fidelity retro 3D RPG look.
 */
export class Renderer {
  private webGLRenderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    // Initialize WebGL Renderer
    this.webGLRenderer = new THREE.WebGLRenderer({
      antialias: Config.RENDERER.ANTIALIASING,
      alpha: false,
      powerPreference: 'high-performance',
    });

    this.initSettings();
  }

  /**
   * Apply gaming-centric render parameters
   */
  private initSettings(): void {
    // Standard color space setup for modern Three.js
    this.webGLRenderer.outputColorSpace = THREE.SRGBColorSpace;

    // Enable high-fidelity dynamic range mapping
    this.webGLRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.webGLRenderer.toneMappingExposure = 1.0;

    // Enable shadow maps
    if (Config.RENDERER.SHADOWS_ENABLED) {
      this.webGLRenderer.shadowMap.enabled = true;
      this.webGLRenderer.shadowMap.type = THREE.PCFSoftShadowMap; // Beautiful soft shadows
    }

    // Set size and insert into container
    this.resize();
    this.container.appendChild(this.webGLRenderer.domElement);
  }

  /**
   * Resize callback (maintains viewport sizing)
   */
  public resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.webGLRenderer.setSize(width, height, true);
    
    // Pixel ratio cap to avoid performance degradation on extremely high DPI screens
    const pixelRatio = Math.min(window.devicePixelRatio, Config.RENDERER.PIXEL_RATIO_LIMIT);
    this.webGLRenderer.setPixelRatio(pixelRatio);
  }

  /**
   * Get internal raw three.js renderer
   */
  public get raw(): THREE.WebGLRenderer {
    return this.webGLRenderer;
  }

  /**
   * Clear and execute rendering
   */
  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.webGLRenderer.render(scene, camera);
  }

  /**
   * Destroy and remove DOM elements
   */
  public destroy(): void {
    if (this.webGLRenderer.domElement.parentNode) {
      this.webGLRenderer.domElement.parentNode.removeChild(this.webGLRenderer.domElement);
    }
    this.webGLRenderer.dispose();
  }
}
