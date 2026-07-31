import * as THREE from 'three';
import { SpriteEntity } from './SpriteEntity';
import { AssetLoader } from '../Systems/AssetLoader';
import { SphereCollider } from '../Systems/CollisionSystem';
import { EventBus } from '../Core/EventBus';
import { InteractableTarget } from './InteractableTarget';
import { InteractionBloomPulse } from '../Effects/InteractionBloomPulse';

/**
 * Reusable NPC (Non-Player Character) Entity.
 * Inherits from SpriteEntity, utilizing the JRPG templates database.
 * Fully compatible with the CollisionSystem, SpatialHash, and InteractionSystem.
 */
export class NPC extends SpriteEntity implements InteractableTarget {
  public name: string;
  public dialogueId: string;
  public initialDirection: string;
  public state: 'IDLE' | 'WALK' | 'WANDER' = 'IDLE';
  private wanderTimer: number = 0;
  private wanderDuration: number = 2; // seconds
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private velocity: THREE.Vector3 = new THREE.Vector3();

  // Interactive boundary properties for the InteractionSystem
  public interactionRadius: number = 2.0;
  public isNearPlayer: boolean = false;
  
  // Hover prompt indicator mesh & ground bloom pulse
  private promptMesh?: THREE.Mesh;
  private bloomPulse?: InteractionBloomPulse;
  private hoverTime: number = 0;
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  constructor(
    id: string,
    classId: string,
    assetLoader: AssetLoader,
    name: string,
    dialogueId: string,
    initialDirection: string = 'DOWN'
  ) {
    super(id, classId, assetLoader);
    this.name = name;
    this.dialogueId = dialogueId;
    this.initialDirection = initialDirection;
  }

  /**
   * Initializes the NPC model, sets the collider, starts anims, and creates floating prompts & bloom aura.
   */
  public init(): void {
    // 1. Core Sprite Entity setup
    super.init();

    // 2. Physical boundary cylinder/sphere
    this.collider = new SphereCollider(0.6, new THREE.Vector3(0, 0, 0));

    // 3. Set starting animator state based on the initial direction
    if (this.spriteAnimator) {
      this.spriteAnimator.setAnimation('idle', true);
      this.spriteAnimator.setDirection(this.initialDirection);
      this.spriteAnimator.reset(); // Stay in a static standing pose
    }

    // 4. Build floating golden prompt ring above the NPC's head
    this.buildInteractionPrompt();

    // 5. Build subtle ground bloom pulse aura
    this.bloomPulse = new InteractionBloomPulse(this.container, {
      colorHex: 0xffaa00,
      radius: 0.8,
      lightHeight: 0.9,
    });
  }

  /**
   * Builds a glowing 3D ring that floats above the NPC's head
   */
  private buildInteractionPrompt(): void {
    const ringGeo = new THREE.TorusGeometry(0.2, 0.04, 4, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00, // Rich warm amber interaction color
      transparent: true,
      opacity: 0.8,
    });

    this.promptMesh = new THREE.Mesh(ringGeo, ringMat);
    this.promptMesh.rotation.x = Math.PI / 2; // Lie flat horizontal
    this.promptMesh.position.set(0, 1.6, 0); // Spatially float above a standard human height
    this.promptMesh.visible = false;

    this.container.add(this.promptMesh);
    this.geometries.push(ringGeo);
    this.materials.push(ringMat);
  }

  /**
   * Sets proximity state and shows/hides the visual floating badge & bloom pulse
   */
  public setNearPlayer(near: boolean): void {
    if (this.isNearPlayer === near) return;
    this.isNearPlayer = near;

    if (this.promptMesh) {
      this.promptMesh.visible = near;
    }

    if (this.bloomPulse) {
      this.bloomPulse.setActive(near);
    }

    // Notify the EventBus so that UI badges can highlight proximity
    EventBus.getInstance().emit('interaction:proximity', {
      id: this.id,
      type: 'NPC',
      text: `Hablar con ${this.name}`,
      near: near,
    });
  }

  /**
   * Action trigger callback when the player presses the action key (E) near the NPC.
   */
  public onInteract(): void {
    // Direct dialog starting payload to the DialogueSystem
    EventBus.getInstance().emit('dialogue:trigger', {
      dialogueId: this.dialogueId,
      speaker: this.name,
      npcId: this.id,
    });
  }

  /**
   * Logical tick updates. Handles animations and prompt floating physics.
   */
  public update(deltaTime: number): void {
    if (!this.isActive) return;

    // NPC AI Logic (Simple Wandering)
    if (this.state === 'WANDER') {
      this.wanderTimer -= deltaTime;
      if (this.wanderTimer <= 0) {
        // Change direction or stop
        this.state = 'IDLE';
        this.velocity.set(0, 0, 0);
        if (this.spriteAnimator) {
          this.spriteAnimator.setAnimation('idle', true);
        }
      } else {
        // Move
        this.position.addScaledVector(this.velocity, deltaTime);
      }
    } else if (this.state === 'IDLE') {
      this.wanderTimer -= deltaTime;
      if (this.wanderTimer <= 0) {
        this.state = 'WANDER';
        this.wanderDuration = 1 + Math.random() * 2;
        this.wanderTimer = this.wanderDuration;
        
        // Random direction
        const angle = Math.random() * Math.PI * 2;
        this.velocity.set(Math.cos(angle) * 1.0, 0, Math.sin(angle) * 1.0);
        if (this.spriteAnimator) {
          this.spriteAnimator.setAnimation('walk', true);
        }
      }
    }

    // 1. Tick anims forward
    super.update(deltaTime);

    // 2. Tick bloom pulse
    if (this.bloomPulse) {
      this.bloomPulse.update(deltaTime);
    }

    // 3. Animate hovering golden indicator
    if (this.isNearPlayer && this.promptMesh) {
      this.hoverTime += deltaTime * 5;
      this.promptMesh.position.y = 1.6 + Math.sin(this.hoverTime) * 0.12;
      this.promptMesh.rotation.z += deltaTime * 1.5;
      const promptPulse = 1.0 + Math.sin(this.hoverTime * 1.5) * 0.12;
      this.promptMesh.scale.set(promptPulse, promptPulse, promptPulse);
    }
  }

  /**
   * Disposes WebGL objects and clean up bindings
   */
  public destroy(): void {
    super.destroy();
    
    if (this.bloomPulse) {
      this.bloomPulse.destroy();
      this.bloomPulse = undefined;
    }

    // Dispose prompt visual assets
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.geometries = [];
    this.materials = [];
  }
}
