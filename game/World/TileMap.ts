import { Config } from '../Core/Config';

/**
 * Tile Types representing different ground surfaces
 */
export enum TileType {
  GRASS = 'grass',
  STONE = 'stone',
  LEDGE = 'ledge',
  WATER = 'water',
}

/**
 * Grid Cell metadata
 */
export interface TileInfo {
  x: number;
  z: number;
  type: TileType;
  walkable: boolean;
  height: number;
}

/**
 * TileMap class.
 * Tracks ground zones and obstacle locations in grid coords.
 */
export class TileMap {
  private width: number;
  private depth: number;
  private tiles: Map<string, TileInfo> = new Map();

  constructor() {
    this.width = Config.WORLD?.TERRAIN_WIDTH ?? 32;
    this.depth = Config.WORLD?.TERRAIN_DEPTH ?? 32;
    this.generateProceduralGrid();
  }

  /**
   * Procedural Tile creation matching terrain layers
   */
  private generateProceduralGrid(): void {
    const halfW = Math.floor(this.width / 2);
    const halfD = Math.floor(this.depth / 2);

    for (let x = -halfW; x < halfW; x++) {
      for (let z = -halfD; z < halfD; z++) {
        const key = `${x},${z}`;
        
        let type = TileType.GRASS;
        let walkable = true;
        let height = 0.0;

        // Sync grid tiles with Terrain.ts elevate step zones
        // Ledge 1: center -8, -8, width 6, depth 6, height 0.5
        if (x >= -11 && x <= -5 && z >= -11 && z <= -5) {
          type = TileType.LEDGE;
          height = 0.5;
        }
        // Ledge 2: center 4, 6, width 8, depth 4, height 1.0
        else if (x >= 0 && x <= 8 && z >= 4 && z <= 8) {
          type = TileType.LEDGE;
          height = 1.0;
        }
        // Ledge 3: center 6, -6, width 5, depth 5, height 1.5
        else if (x >= 4 && x <= 8 && z >= -8 && z <= -4) {
          type = TileType.LEDGE;
          height = 1.5;
        }

        // Add a small river/water layout running along the edge
        if (x === -14 || x === -13) {
          type = TileType.WATER;
          walkable = false; // Water is impassable
        }

        this.tiles.set(key, { x, z, type, walkable, height });
      }
    }
  }

  /**
   * Retrieves Tile metadata based on scene coordinates
   */
  public getTileAt(x: number, z: number): TileInfo | undefined {
    const gx = Math.floor(x);
    const gz = Math.floor(z);
    return this.tiles.get(`${gx},${gz}`);
  }

  /**
   * Utility check for walkability
   */
  public isWalkable(x: number, z: number): boolean {
    const tile = this.getTileAt(x, z);
    if (!tile) return false; // Out of bounds
    return tile.walkable;
  }
}
