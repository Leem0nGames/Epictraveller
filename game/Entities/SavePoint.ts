import * as THREE from 'three';
import { Interactable } from './Interactable';
import { EventBus } from '../Core/EventBus';
import { AssetLoader } from '../Systems/AssetLoader';

/**
 * SavePoint Entity.
 * Renders a floating, rotating, glowing blue crystalline star in 3D.
 * Triggers game state saving (local storage persistence) on interaction.
 */
export class SavePoint extends Interactable {
  private crystalMesh!: THREE.Mesh;
  private glowMesh!: THREE.Mesh;
  private crystalHoverTime: number = 0;

  constructor(id: string, assetLoader: AssetLoader) {
    super(id, 'SAVE_POINT', assetLoader);
  }

  /**
   * Builds custom 3D crystalline star geometries and attaches them to container.
   */
  public init(): void {
    super.init();

    // 1. Double octahedron to construct a beautiful classic fantasy RPG save crystal
    const crystalGeo = new THREE.OctahedronGeometry(0.4, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x3399ff, // Cool magic sapphire blue
      emissive: 0x0044aa,
      roughness: 0.1,
      metalness: 0.9,
      flatShading: true,
    });

    this.crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    this.crystalMesh.position.set(0, 1.2, 0); // Float at chest height
    this.container.add(this.crystalMesh);

    // 2. Halo glow effect (translucent outer shell)
    const glowGeo = new THREE.OctahedronGeometry(0.55, 0);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
    });

    this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.glowMesh.position.set(0, 1.2, 0);
    this.container.add(this.glowMesh);

    // Keep references to clean up
    this.geometries.push(crystalGeo, glowGeo);
    this.materials.push(crystalMat, glowMat);
  }

  /**
   * Action trigger E pressed near SavePoint.
   * Saves progress and triggers localized dialog.
   */
  public onInteract(): void {
    // 1. Emit SAVE_GAME via EventSystem cleanly
    EventBus.getInstance().emit('events:execute', [{ type: 'SAVE_GAME' }]);

    // 2. Display immersive floating dialog feedback
    EventBus.getInstance().emit('dialogue:trigger', {
      dialogueId: 'save_point_talk',
      speaker: 'Cristal de Luz',
      npcId: this.id,
    });
  }

  /**
   * Frame tick updates (animates floating and spinning).
   */
  public update(deltaTime: number): void {
    if (!this.isActive) return;

    super.update(deltaTime);

    // Spin the crystal and glow halo at different rates
    if (this.crystalMesh && this.glowMesh) {
      this.crystalHoverTime += deltaTime * 2.5;
      
      this.crystalMesh.rotation.y += deltaTime * 1.5;
      this.crystalMesh.rotation.x += deltaTime * 0.5;
      this.crystalMesh.position.y = 1.2 + Math.sin(this.crystalHoverTime) * 0.12;

      this.glowMesh.rotation.y -= deltaTime * 0.8;
      this.glowMesh.rotation.z += deltaTime * 0.4;
      this.glowMesh.position.y = 1.2 + Math.sin(this.crystalHoverTime) * 0.12;
    }
  }

  protected getPromptText(): string {
    return 'Guardar Progreso';
  }
}
