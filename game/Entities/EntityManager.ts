import * as THREE from 'three';
import { BaseEntity } from './BaseEntity';

/**
 * Orchestrates high-performance updating, collection, and disposal
 * of hundreds of active entities in the world.
 */
export class EntityManager {
  private entities: Map<string, BaseEntity> = new Map();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Add an entity to the world
   */
  public add(entity: BaseEntity): void {
    if (this.entities.has(entity.id)) {
      console.warn(`EntityManager: Entity with ID "${entity.id}" already exists. Replacing.`);
      this.remove(entity.id);
    }

    entity.init();
    
    // Sync starting position
    entity.container.position.copy(entity.position);
    entity.container.rotation.copy(entity.rotation);
    entity.container.scale.copy(entity.scale);

    this.entities.set(entity.id, entity);
    this.scene.add(entity.container);
  }

  /**
   * Retrieve an entity by ID
   */
  public get(id: string): BaseEntity | undefined {
    return this.entities.get(id);
  }

  /**
   * Get list of all entities
   */
  public getAll(): BaseEntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Remove an entity by ID from the world
   */
  public remove(id: string): void {
    const entity = this.entities.get(id);
    if (entity) {
      this.scene.remove(entity.container);
      entity.destroy();
      this.entities.delete(id);
    }
  }

  /**
   * Update all active entities
   */
  public update(deltaTime: number): void {
    this.entities.forEach((entity) => {
      if (entity.isActive) {
        entity.update(deltaTime);
        
        // Ensure visual position matches logical position state
        entity.container.position.copy(entity.position);
        entity.container.rotation.copy(entity.rotation);
        entity.container.scale.copy(entity.scale);
      }
    });
  }

  /**
   * Clear and dispose all entities
   */
  public clear(): void {
    this.entities.forEach((entity) => {
      this.scene.remove(entity.container);
      entity.destroy();
    });
    this.entities.clear();
  }
}
