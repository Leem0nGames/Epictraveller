import * as THREE from 'three';
import { Interactable } from './Interactable';
import { EventBus } from '../Core/EventBus';
import { AssetLoader } from '../Systems/AssetLoader';

/**
 * Map Transition Portal/Door.
 * Interacting with or stepping onto this portal triggers a map transition.
 */
export class Portal extends Interactable {
  public targetMapId: string;
  public targetX: number;
  public targetZ: number;
  public targetName: string;
  private ringMesh: THREE.Mesh | null = null;

  constructor(
    id: string,
    assetLoader: AssetLoader,
    targetMapId: string,
    targetX: number,
    targetZ: number,
    targetName: string,
    promptMessage?: string
  ) {
    super(id, 'DOOR', assetLoader);
    this.targetMapId = targetMapId;
    this.targetX = targetX;
    this.targetZ = targetZ;
    this.targetName = targetName;
    this.messageText = promptMessage || `Entrada a ${targetName}`;
  }

  public override init(): void {
    super.init();

    // Portals are walkable area triggers, not solid physical walls
    this.collider = undefined;

    // Add a glowing magic portal ring effect around the doorway
    const ringGeo = new THREE.TorusGeometry(0.8, 0.08, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.targetMapId === 'dungeon' ? 0x9933ff : 0x00e5ff,
      transparent: true,
      opacity: 0.8,
    });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.rotation.x = Math.PI / 2;
    this.ringMesh.position.y = 0.05;
    this.container.add(this.ringMesh);
    this.geometries.push(ringGeo);
    this.materials.push(ringMat);
  }

  public override update(deltaTime: number): void {
    super.update(deltaTime);
    if (this.ringMesh) {
      this.ringMesh.rotation.z += deltaTime * 1.5;
    }
  }

  public override onInteract(): void {
    EventBus.getInstance().emit('map:change_request', {
      targetMapId: this.targetMapId,
      targetX: this.targetX,
      targetZ: this.targetZ,
      targetName: this.targetName,
    });
  }

  protected override getPromptText(): string {
    return `Viajar a ${this.targetName}`;
  }
}
