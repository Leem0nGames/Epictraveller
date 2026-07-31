import { Entity } from './Entity';
import { SpriteRenderer } from '../Graphics/SpriteRenderer';
import { SpriteAnimator } from '../Graphics/SpriteAnimator';
import { AssetLoader } from '../Systems/AssetLoader';
import { SpriteDatabase } from './SpriteDatabase';

/**
 * Base Entity class for any interactive sprite actor in the HD-2D environment.
 * Coordinates SpriteRenderer and SpriteAnimator components with the logical game updates.
 */
export class SpriteEntity extends Entity {
  protected classId: string;
  protected assetLoader: AssetLoader;

  protected spriteRenderer!: SpriteRenderer;
  protected spriteAnimator!: SpriteAnimator;

  constructor(id: string, classId: string, assetLoader: AssetLoader) {
    super(id);
    this.classId = classId;
    this.assetLoader = assetLoader;
  }

  /**
   * Loads assets from the database and initializes rendering components
   */
  public init(): void {
    const db = SpriteDatabase.getInstance();
    const entry = db.getManifestForClass(this.classId);

    if (!entry) {
      console.error(`SpriteEntity: Entry for class ID "${this.classId}" was not found in database.`);
      return;
    }

    let baseTexture = this.assetLoader.getTexture(entry.id);
    if (!baseTexture) {
      baseTexture = this.assetLoader.getTexture('hero_body');
    }

    if (!baseTexture) {
      console.warn(`SpriteEntity: Texture not found for "${entry.id}". No spritesheet rendering.`);
      return;
    }

    // Initialize renderer and animator
    this.spriteRenderer = new SpriteRenderer(this.container, baseTexture, entry);
    this.spriteAnimator = new SpriteAnimator(this.spriteRenderer, entry);
  }

  /**
   * Standard frame update
   */
  public update(deltaTime: number): void {
    if (!this.isActive) return;

    // Tick the animations forward using deltaTime
    if (this.spriteAnimator) {
      this.spriteAnimator.update(deltaTime);
    }

    // Sync three.js container position/rotation with entity properties
    this.container.position.copy(this.position);
    this.container.rotation.copy(this.rotation);
    this.container.scale.copy(this.scale);
  }

  /**
   * Teardown graphics objects
   */
  public destroy(): void {
    if (this.spriteRenderer) {
      this.spriteRenderer.destroy();
    }
  }

  public get renderer(): SpriteRenderer {
    return this.spriteRenderer;
  }

  public get animator(): SpriteAnimator {
    return this.spriteAnimator;
  }
}
