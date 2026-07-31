import * as THREE from 'three';
import { AssetLoader } from '../Systems/AssetLoader';

/**
 * Base Scene interface defining crucial lifecycle hooks
 * for unified scene management in the JRPG engine.
 */
export abstract class BaseScene {
  public scene: THREE.Scene;
  protected assetLoader: AssetLoader;
  protected isInitialized: boolean = false;

  constructor(assetLoader: AssetLoader) {
    this.scene = new THREE.Scene();
    this.assetLoader = assetLoader;
  }

  /**
   * Called when loading completes and scene is about to enter view
   * @param mapData Optional map definition object for dynamic loading
   */
  public abstract init(mapData?: any): Promise<void>;

  /**
   * Called on every game tick to run scene-specific updates
   */
  public abstract update(deltaTime: number): void;

  /**
   * Called when disposing resources to prevent memory leaks
   */
  public abstract destroy(): void;

  /**
   * Getter for internal raw three.js Scene instance
   */
  public get raw(): THREE.Scene {
    return this.scene;
  }

  /**
   * Returns if scene has finished initial bootstrapping
   */
  public get ready(): boolean {
    return this.isInitialized;
  }
}
