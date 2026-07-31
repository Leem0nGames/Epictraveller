import { Entity } from '../Entities/Entity';

/**
 * High-performance 2D grid-based Spatial Hash.
 * Partitions the world on the horizontal X-Z plane to accelerate
 * collision checks and proximity interaction queries.
 */
export class SpatialHash {
  private cellSize: number;
  private grid: Map<string, Set<Entity>> = new Map();

  constructor(cellSize: number = 4) {
    this.cellSize = cellSize;
  }

  /**
   * Clears the spatial hash grid.
   */
  public clear(): void {
    this.grid.clear();
  }

  /**
   * Helper: Calculates grid cell string key from X and Z coordinates.
   */
  private getCellKey(x: number, z: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cz}`;
  }

  /**
   * Inserts an entity into the spatial hash based on its current position and collider.
   */
  public insert(entity: Entity): void {
    if (!entity.collider) return;

    const bounds = entity.collider.getBounds(entity.position);
    const minX = Math.floor(bounds.minX / this.cellSize);
    const maxX = Math.floor(bounds.maxX / this.cellSize);
    const minZ = Math.floor(bounds.minZ / this.cellSize);
    const maxZ = Math.floor(bounds.maxZ / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        const key = `${x},${z}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, new Set());
        }
        this.grid.get(key)!.add(entity);
      }
    }
  }

  /**
   * Queries all entities within the cells overlapping the given bounding box range.
   */
  public query(minX: number, minZ: number, maxX: number, maxZ: number): Set<Entity> {
    const result = new Set<Entity>();
    const startX = Math.floor(minX / this.cellSize);
    const endX = Math.floor(maxX / this.cellSize);
    const startZ = Math.floor(minZ / this.cellSize);
    const endZ = Math.floor(maxZ / this.cellSize);

    for (let x = startX; x <= endX; x++) {
      for (let z = startZ; z <= endZ; z++) {
        const key = `${x},${z}`;
        const cell = this.grid.get(key);
        if (cell) {
          cell.forEach((entity) => {
            result.add(entity);
          });
        }
      }
    }
    return result;
  }

  /**
   * Query all entities close to a given position within a radius.
   */
  public queryRadius(positionX: number, positionZ: number, radius: number): Set<Entity> {
    const minX = positionX - radius;
    const maxX = positionX + radius;
    const minZ = positionZ - radius;
    const maxZ = positionZ + radius;
    return this.query(minX, minZ, maxX, maxZ);
  }
}
