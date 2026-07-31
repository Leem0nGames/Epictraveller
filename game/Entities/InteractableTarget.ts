import * as THREE from 'three';

/**
 * Unified interface for any entity in the game world that can be interacted with.
 * Satisfied by Interactable objects (chests, signs) and NPCs.
 */
export interface InteractableTarget {
  id: string;
  position: THREE.Vector3;
  interactionRadius: number;
  isActive: boolean;
  setNearPlayer(near: boolean): void;
  onInteract(): void;
}
