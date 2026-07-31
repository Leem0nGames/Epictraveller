import * as THREE from 'three';
import { SpriteEntity } from './SpriteEntity';
import { AssetLoader } from '../Systems/AssetLoader';
import { InputManager } from '../Systems/InputManager';
import { Config } from '../Core/Config';
import { SphereCollider, CollisionSystem } from '../Systems/CollisionSystem';
import { World } from '../World/World';
import { AssetManifest } from '../Assets/AssetManifest';
import { ShadowProjector } from '../Effects/ShadowProjector';
import { EventBus } from '../Core/EventBus';

export enum PlayerState {
  IDLE = 'IDLE',
  WALK = 'WALK',
}

/**
 * Highly responsive Player entity.
 * Pulls movement commands from the central InputManager,
 * translates spatial coordinates inside the world scene using deltaTime,
 * and maintains states for idle and walking.
 */
export class Player extends SpriteEntity {
  private inputManager: InputManager;
  private shadowProjector = new ShadowProjector();
  
  // Movement settings (configurable via central Config)
  private speed: number;
  private currentSpeed: number = 0;
  private isLocked: boolean = false;
  private state: PlayerState = PlayerState.IDLE;
  private currentDirection: string = 'SE';

  private playerTexture: THREE.Texture | undefined;
  private playerEntry: any;

  constructor(id: string, classId: string, assetLoader: AssetLoader, inputManager: InputManager) {
    super(id, classId, assetLoader);
    this.inputManager = inputManager;

    // Load configurations from Config to eliminate magic numbers
    this.speed = Config.PLAYER?.SPEED ?? 4.5;
    
    // Listen for movement lock events (e.g. from DialogueSystem)
    EventBus.getInstance().on('player:input:lock', (locked: boolean) => {
      this.isLocked = locked;
      if (locked) {
        this.currentSpeed = 0;
      }
    });
  }

  /**
   * Initialize assets and setup start animations
   */
  public init(): void {
    super.init();

    this.playerTexture = this.assetLoader.getTexture('hero_body');
    this.playerEntry = AssetManifest.sprites.find((e) => e.id === 'hero_body');
    this.updatePlayerTexture();

    // Add shadow
    this.container.add(this.shadowProjector.getMesh());

    // Configure the physical player sphere collider (0.5 meter radius)
    this.collider = new SphereCollider(0.5, new THREE.Vector3(0, 0, 0));
    
    // Scale up the player
    this.scale.set(1.2, 1.2, 1.2);

    if (this.spriteAnimator) {
      // Configure initial default values
      const defaultFps = Config.PLAYER?.ANIMATION_FPS ?? 8;
      this.spriteAnimator.setFPS(defaultFps);
      this.spriteAnimator.setAnimation('walk', true);
      this.spriteAnimator.setDirection('SE');
      this.spriteAnimator.reset();
    }
  }

  /**
   * Switches the active player texture and direction state based on movement vector
   */
  private updatePlayerTexture(): void {
    if (!this.spriteRenderer || !this.spriteAnimator) return;

    if (this.playerTexture && this.playerEntry) {
      this.spriteRenderer.setTexture(this.playerTexture, this.playerEntry);
      this.spriteAnimator.setEntry(this.playerEntry);
    }
    
    this.spriteAnimator.setDirection(this.currentDirection);
  }

  /**
   * Logically updates player coordinates, directions, and animation triggers
   */
  public update(deltaTime: number): void {
    if (!this.isActive) return;

    if (this.isLocked) {
      this.state = PlayerState.IDLE;
      this.currentSpeed = 0;
      if (this.spriteAnimator) {
        this.spriteAnimator.reset();
      }
      super.update(deltaTime);
      return;
    }

    // 1. Gather normalized displacement vector from keys
    const move = this.inputManager.getMovementVector();

    // 2. Compute motion state and coordinates
    const targetSpeed = (move.x !== 0 || move.z !== 0) ? this.speed : 0;
    this.currentSpeed += (targetSpeed - this.currentSpeed) * 0.15; // Smooth factor

    if (this.currentSpeed > 0.01) {
      this.state = PlayerState.WALK;

      // Calculate desired horizontal translation
      const displacement = new THREE.Vector3(
        move.x * this.currentSpeed * deltaTime,
        0,
        move.z * this.currentSpeed * deltaTime
      );

      // Solve sliding physics using the CollisionSystem and World active bodies
      const world = World.getInstance();
      const colliders = world ? world.getAllEntities() : [];

      const newPos = CollisionSystem.resolveMovement(this, this.position, displacement, colliders);
      this.position.copy(newPos);

      // Map vector angles to 8 discrete JRPG direction strings
      const angle = Math.atan2(move.z, move.x) * (180 / Math.PI);
      let lookDir = this.currentDirection;
      if (angle > -22.5 && angle <= 22.5) lookDir = 'E';
      else if (angle > 22.5 && angle <= 67.5) lookDir = 'SE';
      else if (angle > 67.5 && angle <= 112.5) lookDir = 'S';
      else if (angle > 112.5 && angle <= 157.5) lookDir = 'SW';
      else if (angle > 157.5 || angle <= -157.5) lookDir = 'W';
      else if (angle > -157.5 && angle <= -112.5) lookDir = 'NW';
      else if (angle > -112.5 && angle <= -67.5) lookDir = 'N';
      else lookDir = 'NE';

      if (this.currentDirection !== lookDir) {
        this.currentDirection = lookDir;
        this.updatePlayerTexture();
      }

      // Set walking animation and direction
      if (this.spriteAnimator) {
        this.spriteAnimator.setDirection(lookDir);
        this.spriteAnimator.setAnimation('walk', true);
        this.spriteAnimator.play();
      }
    } else {
      this.state = PlayerState.IDLE;
      this.currentSpeed = 0;

      if (this.spriteAnimator) {
        this.spriteAnimator.setAnimation('walk', true);
        // Reset animator so player stands in a static pose rather than sliding in place
        this.spriteAnimator.reset();
      }
    }

    // 3. Keep three.js group synced, and update animations
    super.update(deltaTime);
  }

  // Configuration updates
  public setSpeed(speed: number): void {
    this.speed = speed;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public getPlayerState(): PlayerState {
    return this.state;
  }

  public getLookDirection(): string {
    return this.currentDirection;
  }
}
