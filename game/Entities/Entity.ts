import * as THREE from 'three';

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface Collider {
  type: 'box' | 'sphere';
  offset: THREE.Vector3;
  getBounds(position: THREE.Vector3): BoundingBox;
}

/**
 * Base Game Entity Class.
 * Manages position, rotation, scale, and core lifecycle hooks.
 * Designed to be lightweight and scalable for all RPG objects.
 */
export abstract class Entity {
  public id: string;
  public position: THREE.Vector3 = new THREE.Vector3();
  public rotation: THREE.Euler = new THREE.Euler();
  public scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);
  
  // Optional physical body collider
  public collider?: Collider;
  
  // Three.js Object3D container for graphical representation
  public container: THREE.Group;
  
  protected active: boolean = true;

  constructor(id: string) {
    this.id = id;
    this.container = new THREE.Group();
  }

  /**
   * Initializes graphical or logic elements.
   * Add visual components directly to `this.container`.
   */
  public abstract init(): void;

  /**
   * Logical tick update.
   */
  public abstract update(deltaTime: number): void;

  /**
   * Clean up WebGL resources, materials, geometries, or subscriptions.
   */
  public abstract destroy(): void;

  /**
   * Active state query.
   */
  public get isActive(): boolean {
    return this.active;
  }

  /**
   * Toggles entity visibility and game loop active status.
   */
  public setActive(active: boolean): void {
    this.active = active;
    this.container.visible = active;
  }
}
