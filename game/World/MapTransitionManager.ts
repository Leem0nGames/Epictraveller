import * as THREE from 'three';
import { EventBus } from '../Core/EventBus';
import { World } from './World';
import { Player } from '../Entities/Player';
import { BaseEntity } from '../Entities/BaseEntity';

export interface TransitionState {
  isTransitioning: boolean;
  fadeOpacity: number;
  phase: 'idle' | 'fade_out' | 'loading' | 'fade_in';
  targetMapName?: string;
}

/**
 * MapTransitionManager handles smooth fade-in/fade-out transitions between maps
 * (Villa, Bosque, Mazmorra) and performs explicit memory cleanup & resource disposal
 * to prevent Three.js GPU & RAM memory leaks.
 */
export class MapTransitionManager {
  private static instance: MapTransitionManager | null = null;
  private eventBus: EventBus;
  private state: TransitionState = {
    isTransitioning: false,
    fadeOpacity: 0,
    phase: 'idle',
  };
  private fadeDurationMs: number = 400;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public static getInstance(): MapTransitionManager {
    if (!MapTransitionManager.instance) {
      MapTransitionManager.instance = new MapTransitionManager();
    }
    return MapTransitionManager.instance;
  }

  public get transitionState(): TransitionState {
    return { ...this.state };
  }

  public isTransitioning(): boolean {
    return this.state.isTransitioning;
  }

  /**
   * Executes a full map transition cycle with fade-out -> unload/load -> fade-in
   * @param targetMapId ID of map to load ('village', 'forest', 'dungeon')
   * @param targetName Display name of map
   * @param loadMapCallback Function that unloads old map & builds new map
   */
  public async transition(
    targetName: string,
    loadMapCallback: () => void
  ): Promise<void> {
    if (this.state.isTransitioning) {
      console.warn('[MapTransitionManager] Transition already in progress, ignoring duplicate call.');
      return;
    }

    this.state.isTransitioning = true;
    this.state.targetMapName = targetName;
    this.eventBus.emit('player:input:lock', true);

    // 1. Fade Out to Black
    await this.fade(0, 1, 'fade_out');

    // 2. Unload & Load Phase (Screen is fully black)
    this.state.phase = 'loading';
    this.eventBus.emit('map:transition_loading', { targetName });

    try {
      loadMapCallback();
    } catch (err) {
      console.error('[MapTransitionManager] Error during map load callback:', err);
    }

    // Small delay to ensure render frame registers loaded geometry
    await new Promise((resolve) => setTimeout(resolve, 60));

    // 3. Fade In from Black
    await this.fade(1, 0, 'fade_in');

    // 4. Reset to Idle
    this.state.isTransitioning = false;
    this.state.phase = 'idle';
    this.state.targetMapName = undefined;
    this.eventBus.emit('player:input:lock', false);
    this.eventBus.emit('map:transition_complete', { targetName });
  }

  /**
   * Smoothly animates fade opacity from startVal to endVal
   */
  private fade(startVal: number, endVal: number, phase: 'fade_out' | 'fade_in'): Promise<void> {
    this.state.phase = phase;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const step = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / this.fadeDurationMs);

        // Smooth cubic easing
        const eased = phase === 'fade_out' 
          ? Math.pow(progress, 2) 
          : 1 - Math.pow(1 - progress, 2);

        this.state.fadeOpacity = startVal + (endVal - startVal) * eased;

        this.eventBus.emit('map:fade_update', {
          opacity: this.state.fadeOpacity,
          phase: this.state.phase,
          targetName: this.state.targetMapName,
        });

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          this.state.fadeOpacity = endVal;
          this.eventBus.emit('map:fade_update', {
            opacity: endVal,
            phase: this.state.phase,
            targetName: this.state.targetMapName,
          });
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  }

  /**
   * Safely disposes and unloads all entities and THREE.js resources in a world
   * except the player character, preventing memory leaks.
   */
  public unloadWorldEntities(world: World): void {
    const allEntities = world.getAllEntities();
    let disposedCount = 0;

    allEntities.forEach((entity) => {
      if (!(entity instanceof Player)) {
        // Unregister entity from World physics / spatial hash
        world.unregisterEntity(entity.id);

        // Call destroy on entity to dispose geometries, materials, textures & remove meshes
        if (typeof (entity as any).destroy === 'function') {
          (entity as any).destroy();
        } else if (entity.container) {
          this.disposeObjectRecursive(entity.container);
        }
        disposedCount++;
      }
    });

    console.log(`[MapTransitionManager] Safely unloaded and disposed ${disposedCount} world entities.`);
  }

  /**
   * Deep recursive disposal of Three.js Object3D trees, geometries, and materials
   */
  public disposeObjectRecursive(object: THREE.Object3D): void {
    if (!object) return;

    object.children.slice().forEach((child) => {
      this.disposeObjectRecursive(child);
    });

    if (object instanceof THREE.Mesh) {
      if (object.geometry) {
        object.geometry.dispose();
      }

      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => this.disposeMaterial(mat));
        } else {
          this.disposeMaterial(object.material);
        }
      }
    }

    if (object.parent) {
      object.parent.remove(object);
    }
  }

  /**
   * Helper to dispose Three.js material & associated textures
   */
  private disposeMaterial(material: THREE.Material): void {
    if (!material) return;

    // Dispose maps
    const matAny = material as any;
    ['map', 'lightMap', 'bumpMap', 'normalMap', 'specularMap', 'envMap', 'alphaMap', 'roughnessMap', 'metalnessMap'].forEach((prop) => {
      if (matAny[prop] && typeof matAny[prop].dispose === 'function') {
        matAny[prop].dispose();
      }
    });

    material.dispose();
  }
}
