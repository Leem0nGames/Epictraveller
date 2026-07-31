import * as THREE from 'three';
import { SpriteManifestEntry } from '../Assets/AssetManifest';

/**
 * Handles frame coordinate mapping and UV offset translation for JRPG spritesheets.
 * Completely independent of character entities, working with raw textures and layouts.
 */
export class SpriteSheet {
  private baseTexture: THREE.Texture;
  private entry: SpriteManifestEntry;

  // Active state
  private activeAnimationName: string = 'walk';
  private activeDirectionName: string = 'DOWN';
  private activeFrameIndex: number = 0;
  private lastOffsetHash: string = '';

  constructor(baseTexture: THREE.Texture, entry: SpriteManifestEntry) {
    this.baseTexture = baseTexture;
    this.entry = entry;
  }

  /**
   * Creates a dedicated, lightweight instance of the texture specifically for one character
   * so offset changes do not bleed into other characters sharing the same asset sheet.
   */
  public createInstanceTexture(): THREE.Texture {
    const instance = this.baseTexture.clone();
    instance.needsUpdate = true;
    
    // Set repeat scale based on columns and rows
    const uScale = 1.0 / this.entry.columns;
    const vScale = 1.0 / this.entry.rows;
    instance.repeat.set(uScale, vScale);

    // Default to frame 0
    this.applyFrameToTexture(instance, 0, 0);

    return instance;
  }

  /**
   * Sets active animation parameters
   */
  public setAnimation(name: string): void {
    if (this.entry.animations[name]) {
      this.activeAnimationName = name;
    }
  }

  /**
   * Sets active direction parameters
   */
  public setDirection(direction: string): void {
    if (this.entry.directions[direction] !== undefined) {
      this.activeDirectionName = direction;
    }
  }

  /**
   * Advance or set frame of the active animation and update the instance texture UV offset
   * @param texture Instance texture clone to apply offset to
   * @param frameIndex Normalized frame index within the specific animation
   */
  public updateTextureFrame(texture: THREE.Texture, frameIndex: number): void {
    const anim = this.entry.animations[this.activeAnimationName];
    if (!anim) return;

    // Loop or clamp frame
    const maxFrames = anim.frames;
    let actualFrame = Math.floor(frameIndex);
    if (anim.loop) {
      actualFrame = actualFrame % maxFrames;
    } else {
      actualFrame = Math.min(actualFrame, maxFrames - 1);
    }

    this.activeFrameIndex = actualFrame;

    // In JRPG/LPC sheets, directional animations are grouped in sequential rows
    // E.g. Walk Up (baseRow + 0), Walk Left (baseRow + 1), Walk Down (baseRow + 2), Walk Right (baseRow + 3)
    const dirOffset = this.entry.directions[this.activeDirectionName] ?? 0;
    
    // For single-directional actions (like 'die'), clamp to base row
    const rowOffset = (this.activeAnimationName === 'die') ? 0 : dirOffset;
    const targetRow = anim.row + rowOffset;

    this.applyFrameToTexture(texture, actualFrame, targetRow);
  }

  /**
   * Modifies the texture offset to point to the correct grid slice in OpenGL space.
   * Y values start from the bottom, so Row 0 is at (1.0 - unit height).
   */
  private applyFrameToTexture(texture: THREE.Texture, col: number, row: number): void {
    const uOffset = col / this.entry.columns;
    const vOffset = 1.0 - ((row + 1) / this.entry.rows);

    // Only apply if offsets have changed to save processing
    const offsetHash = `${uOffset}_${vOffset}`;
    if (this.lastOffsetHash !== offsetHash) {
      texture.offset.set(uOffset, vOffset);
      this.lastOffsetHash = offsetHash;
    }
  }

  /**
   * Retrieves active animation duration parameters
   */
  public getAnimationFramesCount(name: string): number {
    return this.entry.animations[name]?.frames ?? 0;
  }

  /**
   * Retrieve scale configurations
   */
  public get scale(): { x: number; y: number } {
    return this.entry.scale;
  }

  /**
   * Retrieve pivot configurations
   */
  public get pivot(): { x: number; y: number } {
    return this.entry.pivot;
  }

  /**
   * Get metadata entry
   */
  public get metadata(): SpriteManifestEntry {
    return this.entry;
  }
}
