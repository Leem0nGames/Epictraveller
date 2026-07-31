import { SpriteManifestEntry } from '../Assets/AssetManifest';
import { SpriteRenderer } from './SpriteRenderer';

/**
 * Reusable Animation state machine for JRPG Sprites.
 * Decoupled from entity logics, managing frames, delta ticks, and directional configurations.
 */
export class SpriteAnimator {
  private renderer: SpriteRenderer;
  private entry: SpriteManifestEntry;

  // Animation parameters
  private activeAnimationName: string = '';
  private activeDirectionName: string = 'DOWN';
  private animationTime: number = 0;
  private isPlaying: boolean = true;
  private customFps: number | null = null;
  private loop: boolean = true;
  private onCompleteCallback: (() => void) | null = null;

  constructor(renderer: SpriteRenderer, entry: SpriteManifestEntry) {
    this.renderer = renderer;
    this.entry = entry;

    // Load defaults from manifest
    const animationNames = Object.keys(this.entry.animations);
    if (animationNames.length > 0) {
      this.setAnimation(animationNames[0]);
    }
    const directionNames = Object.keys(this.entry.directions);
    if (directionNames.length > 0) {
      this.setDirection(directionNames[0]);
    }
  }

  /**
   * Sets a new active manifest entry.
   */
  public setEntry(entry: SpriteManifestEntry): void {
    this.entry = entry;
    const animationNames = Object.keys(this.entry.animations);
    if (animationNames.length > 0 && !this.entry.animations[this.activeAnimationName]) {
      this.setAnimation(animationNames[0]);
    }
  }

  /**
   * Switches to a new active animation row
   * @param name Name of the animation (e.g. 'walk')
   * @param loop Play on infinite repeat loop or play once
   * @param onComplete Optional callback fired when animation plays to final frame
   */
  public setAnimation(name: string, loop: boolean = true, onComplete: (() => void) | null = null): void {
    if (this.activeAnimationName === name && this.loop === loop) return;

    if (this.entry.animations[name]) {
      this.activeAnimationName = name;
      this.animationTime = 0;
      this.loop = loop;
      this.onCompleteCallback = onComplete;
      this.isPlaying = true;
    }
  }

  /**
   * Set active face/movement direction
   */
  public setDirection(direction: string): void {
    if (this.entry.directions[direction] !== undefined) {
      this.activeDirectionName = direction;
    }
  }

  /**
   * Configures custom overrides for animation FPS values
   */
  public setFPS(fps: number): void {
    this.customFps = fps;
  }

  /**
   * Resets the animation timer to frame 0
   */
  public reset(): void {
    this.animationTime = 0;
  }

  /**
   * Start playback
   */
  public play(): void {
    this.isPlaying = true;
  }

  /**
   * Stop/pause playback
   */
  public stop(): void {
    this.isPlaying = false;
  }

  /**
   * Updates coordinates using deltaTime
   */
  public update(deltaTime: number): void {
    if (!this.isPlaying || !this.activeAnimationName) return;

    const animationConfig = this.entry.animations[this.activeAnimationName];
    if (!animationConfig) return;

    // Fetch framerate (custom override, or standard default of 8 FPS)
    const fps = this.customFps ?? 8;
    this.animationTime += deltaTime;

    const totalFrames = animationConfig.frames;
    let currentFrame = Math.floor(this.animationTime * fps);

    if (this.loop) {
      currentFrame = currentFrame % totalFrames;
    } else {
      if (currentFrame >= totalFrames) {
        currentFrame = totalFrames - 1;
        this.isPlaying = false;
        if (this.onCompleteCallback) {
          const cb = this.onCompleteCallback;
          this.onCompleteCallback = null;
          cb();
        }
      }
    }

    // Identify direction index and set frame
    const directionOffset = this.entry.directions[this.activeDirectionName] ?? 0;

    if (this.entry.rows === 1 && this.entry.columns > 1) {
      // Single-row multi-column sprite sheet (e.g., sprite_003_)
      const col = directionOffset + (totalFrames > 1 ? currentFrame : 0);
      const row = animationConfig.row !== undefined ? animationConfig.row : 0;
      this.renderer.setFrame(col, row);
    } else {
      // Multi-row sprite sheet (e.g., LPC sheets)
      const rowOffset = (this.activeAnimationName === 'die' || totalFrames === 1) ? 0 : directionOffset;
      const finalRow = animationConfig.row + rowOffset;
      this.renderer.setFrame(currentFrame, finalRow);
    }

    // Apply mirror direction flipping if configured in entry
    if (this.entry.mirrorDirections) {
      const isMirrored = Boolean(this.entry.mirrorDirections[this.activeDirectionName]);
      this.renderer.setFlipped(isMirrored);
    }
  }

  public get activeAnimation(): string {
    return this.activeAnimationName;
  }

  public get activeDirection(): string {
    return this.activeDirectionName;
  }
}
