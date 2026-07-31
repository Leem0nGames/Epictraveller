import * as THREE from 'three';
import { SpriteEntity } from './SpriteEntity';
import { AssetLoader } from '../Systems/AssetLoader';
import { SphereCollider } from '../Systems/CollisionSystem';

/**
 * Highly scalable CharacterEntity for JRPG Monsters and NPCs.
 * Inherits from SpriteEntity, utilizing the modular SpriteRenderer and SpriteAnimator.
 */
export class CharacterEntity extends SpriteEntity {
  // Movement properties for dynamic behavior
  private speed: number = 3.0;
  private targetPosition: THREE.Vector3 | null = null;
  private wanderTimer: number = Math.random() * 3.0;

  // Combat properties
  public hp: number = 100;
  public maxHp: number = 100;
  public isDead: boolean = false;

  constructor(id: string, classId: string, assetLoader: AssetLoader) {
    super(id, classId, assetLoader);
  }

  public init(): void {
    // 1. Initialize SpriteEntity (creates renderer and animator)
    super.init();

    // 2. Assign standard physical cylinder/sphere boundary collider
    this.collider = new SphereCollider(0.6, new THREE.Vector3(0, 0, 0));

    // 3. Set default stats/speeds based on preset classifications
    if (this.classId === 'Slime') {
      this.speed = 1.5;
      this.hp = 30;
      this.maxHp = 30;
    } else if (this.classId === 'Knight') {
      this.speed = 2.2;
      this.hp = 150;
      this.maxHp = 150;
    }

    if (this.spriteAnimator) {
      this.spriteAnimator.setAnimation('walk', true);
      this.spriteAnimator.setDirection('DOWN');
      this.spriteAnimator.reset();
    }
  }

  /**
   * Reduces HP and triggers death if health reaches zero
   */
  public takeDamage(amount: number): void {
    if (this.isDead) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
  }

  private die(): void {
    this.isDead = true;
    this.setActive(false);
    // Potentially trigger death animation/state here in the future
  }

  /**
   * Commands the character to move to a destination
   */
  public moveTo(x: number, z: number): void {
    this.targetPosition = new THREE.Vector3(x, this.position.y, z);
    if (this.spriteAnimator) {
      this.spriteAnimator.setAnimation('walk', true);
      this.spriteAnimator.play();
    }
  }

  /**
   * Update character AI pathing, positions, and animations
   */
  public update(deltaTime: number): void {
    if (!this.isActive) return;

    // 1. Core AI Wander Behavior (if no active direct command)
    if (this.classId === 'Slime') {
      this.updateSlimeAI(deltaTime);
    } else {
      this.updateNPCWanderAI(deltaTime);
    }

    // 2. Perform Movement / Physics Translation
    if (this.targetPosition) {
      const dir = new THREE.Vector3().subVectors(this.targetPosition, this.position);
      const distance = dir.length();

      if (distance > 0.1) {
        dir.normalize();
        
        // Translate coordinates
        this.position.addScaledVector(dir, this.speed * deltaTime);

        // Update direction based on motion vector
        if (this.spriteAnimator) {
          if (Math.abs(dir.x) > Math.abs(dir.z)) {
            this.spriteAnimator.setDirection(dir.x > 0 ? 'RIGHT' : 'LEFT');
          } else {
            this.spriteAnimator.setDirection(dir.z > 0 ? 'DOWN' : 'UP');
          }
          this.spriteAnimator.setAnimation('walk', true);
          this.spriteAnimator.play();
        }
      } else {
        // Arrived
        this.position.copy(this.targetPosition);
        this.targetPosition = null;
        if (this.spriteAnimator) {
          this.spriteAnimator.setAnimation('walk', true);
          this.spriteAnimator.reset(); // stop moving / stand still
        }
      }
    }

    // 3. Update parent SpriteEntity positioning and tick animation frames
    super.update(deltaTime);
  }

  /**
   * Small random patrol routines for Slime forest enemies
   */
  private updateSlimeAI(deltaTime: number): void {
    this.wanderTimer -= deltaTime;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 3.0 + Math.random() * 5.0;

      // 30% chance to patrol nearby grid
      if (Math.random() < 0.3) {
        const rx = this.position.x + (Math.random() * 4 - 2);
        const rz = this.position.z + (Math.random() * 4 - 2);
        this.moveTo(rx, rz);
      } else {
        this.targetPosition = null;
      }
    }
  }

  /**
   * Simple idle/wandering routines for NPCs/Knight
   */
  private updateNPCWanderAI(deltaTime: number): void {
    this.wanderTimer -= deltaTime;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 5.0 + Math.random() * 8.0;

      if (Math.random() < 0.2) {
        const rx = this.position.x + (Math.random() * 3 - 1.5);
        const rz = this.position.z + (Math.random() * 3 - 1.5);
        this.moveTo(rx, rz);
      }
    }
  }
}
