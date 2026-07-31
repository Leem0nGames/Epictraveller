import * as THREE from 'three';
import { ProceduralGenerator, TerrainSample } from './ProceduralGenerator';
import { ProceduralChunk } from './ProceduralChunk';
import { AssetLoader } from '../Systems/AssetLoader';
import { ToastManager } from '../Systems/ToastManager';

export class ProceduralChunkManager {
  private scene: THREE.Scene;
  private assetLoader: AssetLoader;
  private generator: ProceduralGenerator;

  private activeChunks: Map<string, ProceduralChunk> = new Map();
  private containerGroup: THREE.Group;

  // Chunk Streaming Configuration
  public readonly chunkSize: number = 32.0; // 32x32 meters per chunk
  public renderDistance: number = 2; // Render 2 chunks radius around player (5x5 grid = 25 chunks)

  private lastPlayerChunkX: number = Number.MAX_SAFE_INTEGER;
  private lastPlayerChunkZ: number = Number.MAX_SAFE_INTEGER;
  private lastSubBiomeTitle: string = '';
  private isEnabled: boolean = false;

  private frustum: THREE.Frustum = new THREE.Frustum();
  private projScreenMatrix: THREE.Matrix4 = new THREE.Matrix4();

  constructor(scene: THREE.Scene, assetLoader: AssetLoader, seed: number | string = 1337) {
    this.scene = scene;
    this.assetLoader = assetLoader;
    this.generator = new ProceduralGenerator(seed);

    this.containerGroup = new THREE.Group();
    this.scene.add(this.containerGroup);
  }

  /**
   * Set dynamic procedural terrain generation state
   */
  public setEnabled(enabled: boolean): void {
    if (this.isEnabled === enabled) return;
    this.isEnabled = enabled;

    if (!enabled) {
      this.clearAllChunks();
    }
  }

  public isTerrainEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Samples terrain elevation Y at exact world coordinate (x, z)
   */
  public getTerrainHeight(x: number, z: number): number {
    return this.generator.sampleTerrain(x, z).height;
  }

  /**
   * Samples full terrain metadata (height, biome, color) at (x, z)
   */
  public getTerrainSample(x: number, z: number): TerrainSample {
    return this.generator.sampleTerrain(x, z);
  }

  /**
   * Dynamic update tick executed on every frame
   * Checks player position, updates chunk stream, and executes frustum culling
   */
  public update(playerX: number, playerZ: number, camera?: THREE.Camera): void {
    if (!this.isEnabled) return;

    const currentChunkX = Math.floor(playerX / this.chunkSize);
    const currentChunkZ = Math.floor(playerZ / this.chunkSize);

    // Only recalculate chunk streaming when player crosses chunk boundary
    if (currentChunkX !== this.lastPlayerChunkX || currentChunkZ !== this.lastPlayerChunkZ) {
      this.lastPlayerChunkX = currentChunkX;
      this.lastPlayerChunkZ = currentChunkZ;
      this.updateChunkStreaming(currentChunkX, currentChunkZ);

      // Check for sub-biome discovery
      const chunkVar = this.generator.evaluateChunkVisualVariation(currentChunkX, currentChunkZ, this.chunkSize);
      if (this.lastSubBiomeTitle && chunkVar.subBiomeTitle !== this.lastSubBiomeTitle) {
        ToastManager.getInstance().show(`🗺️ Explorando: ${chunkVar.subBiomeTitle}`);
      }
      this.lastSubBiomeTitle = chunkVar.subBiomeTitle;
    }

    // Execute Frustum and Distance Culling across active chunks
    if (camera) {
      camera.updateMatrixWorld();
      this.projScreenMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
      const cameraPos = camera.position;

      this.activeChunks.forEach((chunk) => {
        chunk.updateCulling(this.frustum, cameraPos, 85.0);
      });
    }
  }

  /**
   * Stream chunks in and out based on player current chunk position
   */
  private updateChunkStreaming(centerChunkX: number, centerChunkZ: number): void {
    const neededChunkKeys = new Set<string>();

    for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
      for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
        const cx = centerChunkX + dx;
        const cz = centerChunkZ + dz;
        const key = `${cx}_${cz}`;
        neededChunkKeys.add(key);

        if (!this.activeChunks.has(key)) {
          // Calculate distance LOD: center chunks get LOD 1, distant chunks get LOD 2 or 4
          const dist = Math.max(Math.abs(dx), Math.abs(dz));
          let lodStep = 1;
          if (dist >= 2) lodStep = 2;

          const chunk = new ProceduralChunk(
            cx,
            cz,
            this.chunkSize,
            lodStep,
            this.generator,
            this.assetLoader
          );

          this.activeChunks.set(key, chunk);
          this.containerGroup.add(chunk.meshGroup);
        }
      }
    }

    // Unload chunks outside render distance
    this.activeChunks.forEach((chunk, key) => {
      if (!neededChunkKeys.has(key)) {
        this.containerGroup.remove(chunk.meshGroup);
        chunk.dispose();
        this.activeChunks.delete(key);
      }
    });
  }

  /**
   * Dispose all active chunks
   */
  public clearAllChunks(): void {
    this.activeChunks.forEach((chunk) => {
      this.containerGroup.remove(chunk.meshGroup);
      chunk.dispose();
    });
    this.activeChunks.clear();
    this.lastPlayerChunkX = Number.MAX_SAFE_INTEGER;
    this.lastPlayerChunkZ = Number.MAX_SAFE_INTEGER;
  }

  public destroy(): void {
    this.clearAllChunks();
    if (this.containerGroup.parent) {
      this.containerGroup.parent.remove(this.containerGroup);
    }
  }
}
