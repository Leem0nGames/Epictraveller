import { Entity } from '../Entities/Entity';
import { Config } from '../Core/Config';

/**
 * Reusable MovementSystem for the overworld map.
 * Enforces map boundaries and clipping rules.
 */
export class MovementSystem {
  private mapLimitX: number;
  private mapLimitZ: number;

  constructor() {
    // Read limits from central config or fall back to safe default of 14 units
    const terrainWidth = Config.WORLD?.TERRAIN_WIDTH ?? 32;
    const terrainDepth = Config.WORLD?.TERRAIN_DEPTH ?? 32;
    
    // Half-size less a tiny padding margin to keep characters inside the visual grid
    this.mapLimitX = (terrainWidth / 2) - 1.5;
    this.mapLimitZ = (terrainDepth / 2) - 1.5;
  }

  /**
   * Evaluates coordinates and constraints on any game Entity
   */
  public update(entity: Entity, isProcedural: boolean = false): void {
    if (isProcedural) return; // Unbounded infinite map

    // Keep coordinates bounded for standard maps
    if (entity.position.x > this.mapLimitX) entity.position.x = this.mapLimitX;
    if (entity.position.x < -this.mapLimitX) entity.position.x = -this.mapLimitX;
    
    if (entity.position.z > this.mapLimitZ) entity.position.z = this.mapLimitZ;
    if (entity.position.z < -this.mapLimitZ) entity.position.z = -this.mapLimitZ;
  }
}
