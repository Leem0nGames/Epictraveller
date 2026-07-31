import * as THREE from 'three';
import { EventBus } from '../Core/EventBus';
import { DeviceDetector } from './DeviceDetector';
import { GraphicsQuality, QualityLevel } from './GraphicsQuality';

/**
 * Mobile Environment Coordinator.
 * Listens for system orientation changes, monitors layout scales, and coordinates 
 * the graphical profiles for lightweight integration.
 */
export class MobileManager {
  private static instance: MobileManager | null = null;
  private eventBus: EventBus;
  private graphicsQuality: GraphicsQuality;
  
  // Tracked states
  private portrait: boolean = false;
  private fpsCounter: number = 0;
  private fpsTimer: number = 0;
  private currentFps: number = 60;
  private drawCallsCount: number = 0;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.graphicsQuality = new GraphicsQuality();
    this.portrait = DeviceDetector.isPortrait();

    this.initListeners();
    MobileManager.instance = this;
  }

  /**
   * Singleton getter
   */
  public static getInstance(): MobileManager | null {
    return MobileManager.instance;
  }

  /**
   * Register system-level event hooks
   */
  private initListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleResize);

    // Dynamic quality swap signal emitted from developer or options UI
    this.eventBus.on('quality:set', (level: QualityLevel) => {
      this.setGraphicsQuality(level);
    });
  }

  /**
   * Dynamic viewport adaptation callback
   */
  private handleResize = (): void => {
    const isNowPortrait = DeviceDetector.isPortrait();
    if (this.portrait !== isNowPortrait) {
      this.portrait = isNowPortrait;
      this.eventBus.emit('mobile:orientation:changed', { portrait: this.portrait });
    }
    
    // Broadcast generic layout scale changes
    this.eventBus.emit('mobile:resize', {
      width: window.innerWidth,
      height: window.innerHeight,
      portrait: this.portrait,
      ratio: DeviceDetector.getDevicePixelRatio(),
    });
  };

  /**
   * Direct trigger to transition between quality standards
   */
  public setGraphicsQuality(level: QualityLevel): void {
    const game = (window as any)._gameInstance; // Let's check how the renderer is accessed
    if (game && game.renderer) {
      const glRenderer = game.renderer.raw;
      const scene = game.sceneManager?.current?.getScene?.() || game.scenes?.current?.getScene?.();
      if (glRenderer && scene) {
        this.graphicsQuality.applyProfile(glRenderer, scene, level);
      }
    }
  }

  /**
   * Direct hook inside the Game tick. Keeps track of mobile telemetry metrics.
   */
  public tick(deltaTime: number, renderer: THREE.WebGLRenderer): void {
    // 1. Calculate FPS
    this.fpsCounter++;
    this.fpsTimer += deltaTime;
    if (this.fpsTimer >= 1.0) {
      this.currentFps = Math.round(this.fpsCounter / this.fpsTimer);
      this.fpsCounter = 0;
      this.fpsTimer = 0;

      // Extract raw rendering performance metadata
      this.drawCallsCount = renderer.info.render.calls;

      // Broadcast telemetry packet
      this.eventBus.emit('telemetry:tick', {
        fps: this.currentFps,
        drawCalls: this.drawCallsCount,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
        quality: this.graphicsQuality.level,
        device: DeviceDetector.isTouchDevice() ? 'Mobile' : 'Desktop',
        os: DeviceDetector.getOS(),
        dpi: DeviceDetector.getDevicePixelRatio(),
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      });
    }
  }

  /**
   * Returns current FPS gauge
   */
  public get fps(): number {
    return this.currentFps;
  }

  /**
   * Returns active Graphics Quality standard
   */
  public get quality(): GraphicsQuality {
    return this.graphicsQuality;
  }

  /**
   * Destroy and unbind orientation hooks
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
      window.removeEventListener('orientationchange', this.handleResize);
    }
    this.graphicsQuality.destroy();
    MobileManager.instance = null;
  }
}
