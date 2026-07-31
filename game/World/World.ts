import * as THREE from 'three';
import { TileMap } from './TileMap';
import { SpatialHash } from '../Utils/SpatialHash';
import { EntityManager } from '../Entities/EntityManager';
import { Entity } from '../Entities/Entity';
import { Interactable } from '../Entities/Interactable';
import { InteractableTarget } from '../Entities/InteractableTarget';
import { CollisionSystem } from '../Systems/CollisionSystem';
import { Config } from '../Core/Config';

/**
 * World Coordinator Class.
 * Integrates the visual scene, procedural TileMap,
 * EntityManager collection, SpatialHash grids, and Collision System updates.
 */
export class World {
  private static instance: World | null = null;

  public scene: THREE.Scene;
  public tileMap: TileMap;
  public spatialHash: SpatialHash;
  public entityManager: EntityManager;

  // Track specific subsets of entities for fast lookup
  private interactables: Set<InteractableTarget> = new Set();
  private debugEnabled: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.tileMap = new TileMap();
    this.spatialHash = new SpatialHash(4.0); // 4x4 meter cell hash partition
    this.entityManager = new EntityManager(scene);
    
    World.instance = this;
    this.debugEnabled = Config.DEBUG?.ENABLED ?? false;
  }

  /**
   * Static singleton getter
   */
  public static getInstance(): World | null {
    return World.instance;
  }

  /**
   * Registers a game entity in the active world
   */
  public registerEntity(entity: Entity): void {
    this.entityManager.add(entity);
    
    // Register as interactable if it satisfies the interface (defines onInteract)
    if ('onInteract' in entity && typeof (entity as any).onInteract === 'function') {
      this.interactables.add(entity as unknown as InteractableTarget);
    }
    
    if (entity.collider) {
      this.spatialHash.insert(entity);
    }
  }

  /**
   * Removes a registered entity from the active world
   */
  public unregisterEntity(id: string): void {
    const entity = this.entityManager.get(id);
    if (entity) {
      if ('onInteract' in entity) {
        this.interactables.delete(entity as unknown as InteractableTarget);
      }
      this.entityManager.remove(id);
    }
  }

  /**
   * Returns a copy of all registered interactables
   */
  public getInteractables(): InteractableTarget[] {
    return Array.from(this.interactables);
  }

  /**
   * Returns all entities loaded in the EntityManager
   */
  public getAllEntities(): Entity[] {
    return this.entityManager.getAll();
  }

  /**
   * Toggles the physical box wireframe visual displays
   */
  public setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = enabled;
    if (!enabled) {
      CollisionSystem.clearDebugVisuals(this.scene);
    }
  }

  public isDebugEnabled(): boolean {
    return this.debugEnabled;
  }

  /**
   * Runs logical ticks for all characters, refreshes the spatial partition grid,
   * and triggers the visual collider bounding overlays.
   */
  public update(deltaTime: number): void {
    // 1. Refresh Entity updates (tick animations, player controls)
    this.entityManager.update(deltaTime);

    // 2. Clear and rebuild the Spatial Hash each frame to capture sliding character positions
    this.spatialHash.clear();
    const allEntities = this.entityManager.getAll();
    allEntities.forEach((entity) => {
      if (entity.isActive && entity.collider) {
        this.spatialHash.insert(entity);
      }
    });

    // 3. Render visual physics debug boxes if activated
    CollisionSystem.updateDebugVisuals(this.scene, allEntities, this.debugEnabled);
  }

  /**
   * Clean up world resources
   */
  public destroy(): void {
    this.entityManager.clear();
    this.interactables.clear();
    this.spatialHash.clear();
    CollisionSystem.clearDebugVisuals(this.scene);
    World.instance = null;
  }
}
