import * as THREE from 'three';
import { WorldObject } from './WorldObject';
import { AssetLoader } from '../Systems/AssetLoader';
import { EventBus } from '../Core/EventBus';
import { InteractableTarget } from './InteractableTarget';
import { InteractionBloomPulse } from '../Effects/InteractionBloomPulse';

/**
 * Interactable represents props that the player can interact with (by pressing 'E').
 */
export class Interactable extends WorldObject implements InteractableTarget {
  public interactionRadius: number = 2.0;
  public isNearPlayer: boolean = false;
  
  public messageText: string = 'Nothing of interest here.';
  
  // Custom state tracking
  public isTriggered: boolean = false;

  // Visual prompt floating above the object & bloom pulse effect
  private promptMesh?: THREE.Mesh;
  protected bloomPulse?: InteractionBloomPulse;
  private hoverTime: number = 0;
  protected geometries: THREE.BufferGeometry[] = [];
  protected materials: THREE.Material[] = [];

  constructor(id: string, objectType: string, assetLoader: AssetLoader, message: string = 'Nothing of interest here.') {
    super(id, objectType, assetLoader);
    this.messageText = message;
  }

  /**
   * Extends world object initialization to attach the bouncing interactive indicator and bloom pulse aura.
   */
  public init(): void {
    super.init();
    this.buildInteractiveIndicator();
    
    this.bloomPulse = new InteractionBloomPulse(this.container, {
      colorHex: this.getBloomColor(),
      radius: Math.max(0.7, this.interactionRadius * 0.45),
    });
  }

  /**
   * Returns domain-specific bloom color for different object types
   */
  protected getBloomColor(): number {
    switch (this.objectType) {
      case 'SAVE_POINT':
        return 0x3399ff; // Magic Sapphire Blue
      case 'DOOR':
      case 'PORTAL':
        return 0x00e5ff; // Arcane Cyan
      case 'CHEST':
        return this.isTriggered ? 0x10b981 : 0xffb700; // Emerald (opened) or Amber (unopened)
      case 'PICKUP':
        return 0x38bdf8; // Sky Blue Loot
      default:
        return 0xffcc00; // Golden Yellow
    }
  }

  /**
   * Action trigger when the user presses E. Should be overridden by subclasses.
   */
  public onInteract(): void {
    EventBus.getInstance().emit('dialogue:trigger', {
      dialogueId: this.objectType.toLowerCase() + '_default',
      speaker: this.objectType,
      text: this.messageText,
      npcId: this.id,
    });
  }

  /**
   * Toggle the proximity visual state and trigger subtle bloom pulse
   */
  public setNearPlayer(near: boolean): void {
    if (this.isNearPlayer === near) return;
    this.isNearPlayer = near;

    if (this.promptMesh) {
      this.promptMesh.visible = near;
    }

    if (this.bloomPulse) {
      this.bloomPulse.setColor(this.getBloomColor());
      this.bloomPulse.setActive(near);
    }

    // Notify the UI to show/hide overlays
    EventBus.getInstance().emit('interaction:proximity', {
      id: this.id,
      type: this.objectType,
      text: this.getPromptText(),
      near: near,
    });
  }

  protected getPromptText(): string {
    return 'Interactuar';
  }

  /**
   * Create a neat 3D floating badge or letter 'E' indicator
   */
  private buildInteractiveIndicator(): void {
    const ringGeo = new THREE.TorusGeometry(0.25, 0.05, 4, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffcc00, // Golden yellow interaction glow
      transparent: true,
      opacity: 0.9,
    });

    this.promptMesh = new THREE.Mesh(ringGeo, ringMat);
    this.promptMesh.rotation.x = Math.PI / 2; // Flat horizontal circle
    
    // Float above based on object height
    const heightOffset = 1.5;
    this.promptMesh.position.set(0, heightOffset, 0);
    this.promptMesh.visible = false; // Hidden until near

    this.container.add(this.promptMesh);
    this.geometries.push(ringGeo);
    this.materials.push(ringMat);
  }

  /**
   * Animate the floating badge and ground bloom pulse
   */
  public update(deltaTime: number): void {
    super.update(deltaTime);
    
    if (this.bloomPulse) {
      this.bloomPulse.update(deltaTime);
    }

    if (this.isNearPlayer && this.promptMesh) {
      this.hoverTime += deltaTime * 5;
      
      const baseHeight = 1.5;
      this.promptMesh.position.y = baseHeight + Math.sin(this.hoverTime) * 0.15;
      this.promptMesh.rotation.z += deltaTime * 2.0; // Spin slow
      
      const promptPulse = 1.0 + Math.sin(this.hoverTime * 1.5) * 0.12;
      this.promptMesh.scale.set(promptPulse, promptPulse, promptPulse);
    }
  }

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
