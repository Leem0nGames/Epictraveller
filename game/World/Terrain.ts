import * as THREE from 'three';
import { Config } from '../Core/Config';
import { AssetLoader } from '../Systems/AssetLoader';
import { ProceduralChunkManager } from './ProceduralChunkManager';

/**
 * Creates and styles the physical overworld ground terrain.
 * Supports static grid structures, elevated steps, and dynamic OpenSimplex procedural chunk streaming.
 */
export class Terrain {
  private container: THREE.Group;
  private assetLoader: AssetLoader;
  private geometries: THREE.BufferGeometry[] = [];
  public readonly chunkManager: ProceduralChunkManager;

  constructor(scene: THREE.Scene, assetLoader: AssetLoader) {
    this.container = new THREE.Group();
    this.assetLoader = assetLoader;
    this.chunkManager = new ProceduralChunkManager(scene, assetLoader);

    scene.add(this.container);
    this.buildWorldTerrain('village');
  }

  /**
   * Clears existing terrain meshes and loads the specified map type
   */
  public loadMapTerrain(mapType: 'village' | 'forest' | 'dungeon' | 'procedural'): void {
    // Clear old geometries
    this.geometries.forEach((geo) => geo.dispose());
    this.geometries = [];

    // Remove all children
    while (this.container.children.length > 0) {
      const child = this.container.children[0];
      this.container.remove(child);
    }

    if (mapType === 'procedural') {
      this.chunkManager.setEnabled(true);
      return;
    }

    this.chunkManager.setEnabled(false);
    this.buildWorldTerrain(mapType);
  }

  /**
   * Updates procedural chunk streaming and culling around player
   */
  public update(playerX: number = 0, playerZ: number = 0, camera?: THREE.Camera): void {
    if (this.chunkManager.isTerrainEnabled()) {
      this.chunkManager.update(playerX, playerZ, camera);
    }
  }

  /**
   * Sample elevation at world coordinate (x, z)
   */
  public getTerrainHeight(x: number, z: number): number {
    if (this.chunkManager.isTerrainEnabled()) {
      return this.chunkManager.getTerrainHeight(x, z);
    }
    return 0;
  }

  /**
   * Generates a map terrain matching the map type (village, forest, dungeon)
   */
  private buildWorldTerrain(mapType: 'village' | 'forest' | 'dungeon' = 'village'): void {
    const grassMat = this.assetLoader.getMaterial('grass');
    const stoneMat = this.assetLoader.getMaterial('stone');

    const tileWidth = Config.WORLD.TERRAIN_WIDTH;
    const tileDepth = Config.WORLD.TERRAIN_DEPTH;

    if (mapType === 'dungeon') {
      // Dark Stone Dungeon Floor
      const groundGeo = new THREE.PlaneGeometry(tileWidth + 8, tileDepth + 8, 1, 1);
      groundGeo.rotateX(-Math.PI / 2);
      
      const dungeonMat = this.assetLoader.getMaterial('stone', { roughness: 0.9, metalness: 0.2 });
      const groundMesh = new THREE.Mesh(groundGeo, dungeonMat);
      groundMesh.receiveShadow = true;
      groundMesh.position.set(0, 0, 0);
      this.container.add(groundMesh);
      this.geometries.push(groundGeo);

      if (dungeonMat.map) {
        dungeonMat.map.repeat.set((tileWidth + 8) / 2, (tileDepth + 8) / 2);
      }

      // Outer Perimeter Dungeon Fortress Walls
      this.createWallBorder(tileWidth + 4, tileDepth + 4, 4.0, stoneMat);

      // Dungeon pathway highlights
      this.createPathSegment(-12, 0, 3, 28, stoneMat, 0.02);
      this.createPathSegment(0, -5, 24, 3, stoneMat, 0.02);
      return;
    }

    // 1. Core Flat Ground Plane for Overworld / Forest
    const groundGeo = new THREE.PlaneGeometry(tileWidth, tileDepth, 1, 1);
    groundGeo.rotateX(-Math.PI / 2); // Lay flat
    
    const floorMat = mapType === 'forest' 
      ? this.assetLoader.getMaterial('grass', { roughness: 0.95 }) 
      : grassMat;

    const groundMesh = new THREE.Mesh(groundGeo, floorMat);
    groundMesh.receiveShadow = true;
    groundMesh.position.set(0, 0, 0);
    this.container.add(groundMesh);
    this.geometries.push(groundGeo);

    // Apply seamless texture tiling
    if (floorMat.map) {
      floorMat.map.repeat.set(tileWidth / 4, tileDepth / 4);
    }

    if (mapType === 'forest') {
      // Forest elevated platforms
      this.createLedge(-10, -8, 8, 6, 0.8, floorMat, stoneMat);
      this.createLedge(8, 8, 8, 6, 1.2, floorMat, stoneMat);
      this.createLedge(6, -8, 6, 6, 1.5, floorMat, stoneMat);

      // Forest dirt trails connecting portals
      this.createPathSegment(0, 0, 2.5, 26, stoneMat, 0.015);
      this.createPathSegment(6, -6, 18, 2.5, stoneMat, 0.015);

      // Mystic pond in forest
      this.createPond(-6, 6, 4, 3);
    } else {
      // Village elevated JRPG steps
      this.createLedge(-8, -8, 6, 6, 0.5, grassMat, stoneMat);
      this.createLedge(4, 6, 8, 4, 1.0, grassMat, stoneMat);
      this.createLedge(6, -6, 5, 5, 1.5, grassMat, stoneMat);

      // Cobblestone Sanctuary Plaza & Crossroads
      this.createPathSegment(0, 0, 3.2, 28, stoneMat, 0.02); // Main North-South road
      this.createPathSegment(0, 0, 28, 3.2, stoneMat, 0.02); // Main East-West road
      this.createPathSegment(0, 0, 7.0, 7.0, stoneMat, 0.025); // Central Plaza square
    }
  }

  /**
   * Helper: Generates dungeon outer border walls
   */
  private createWallBorder(width: number, depth: number, height: number, material: THREE.Material): void {
    const halfW = width / 2;
    const halfD = depth / 2;
    const thickness = 2.0;

    // North, South, East, West border walls
    const borders = [
      { x: 0, z: -halfD, w: width, d: thickness },
      { x: 0, z: halfD, w: width, d: thickness },
      { x: -halfW, z: 0, w: thickness, d: depth },
      { x: halfW, z: 0, w: thickness, d: depth },
    ];

    borders.forEach((b) => {
      const geo = new THREE.BoxGeometry(b.w, height, b.d);
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(b.x, height / 2, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.container.add(mesh);
      this.geometries.push(geo);
    });
  }

  /**
   * Helper: Generates an elevated grass platform with a stone border wall
   */
  private createLedge(
    centerX: number,
    centerZ: number,
    width: number,
    depth: number,
    height: number,
    topMaterial: THREE.Material,
    wallMaterial: THREE.Material
  ): void {
    const ledgeGroup = new THREE.Group();
    ledgeGroup.position.set(centerX, height / 2, centerZ);

    // Stone wall base (blocking box)
    const wallGeo = new THREE.BoxGeometry(width, height, depth);
    const wallMesh = new THREE.Mesh(wallGeo, wallMaterial);
    wallMesh.receiveShadow = true;
    wallMesh.castShadow = true;
    ledgeGroup.add(wallMesh);
    this.geometries.push(wallGeo);

    // Top grass lid (offset slightly higher to overlay stone bevels)
    const topGeo = new THREE.BoxGeometry(width - 0.05, 0.1, depth - 0.05);
    const topMesh = new THREE.Mesh(topGeo, topMaterial);
    topMesh.position.y = height / 2 + 0.05;
    topMesh.receiveShadow = true;
    topMesh.castShadow = true;
    ledgeGroup.add(topMesh);
    this.geometries.push(topGeo);

    this.container.add(ledgeGroup);
  }

  /**
   * Helper: Generates a paved path / stone walkway overlay segment
   */
  private createPathSegment(
    centerX: number,
    centerZ: number,
    width: number,
    depth: number,
    material: THREE.Material,
    yOffset: number = 0.015
  ): void {
    const geo = new THREE.PlaneGeometry(width, depth);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(centerX, yOffset, centerZ);
    mesh.receiveShadow = true;
    this.container.add(mesh);
    this.geometries.push(geo);
  }

  /**
   * Helper: Generates a mystic water pond
   */
  private createPond(centerX: number, centerZ: number, width: number, depth: number): void {
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const pondGeo = new THREE.PlaneGeometry(width, depth);
    pondGeo.rotateX(-Math.PI / 2);
    const pondMesh = new THREE.Mesh(pondGeo, waterMat);
    pondMesh.position.set(centerX, 0.02, centerZ);
    pondMesh.receiveShadow = true;
    this.container.add(pondMesh);
    this.geometries.push(pondGeo);
  }

  /**
   * Free graphics resources
   */
  public destroy(): void {
    if (this.chunkManager) {
      this.chunkManager.destroy();
    }
    this.geometries.forEach((geo) => geo.dispose());
    this.geometries = [];
    if (this.container.parent) {
      this.container.parent.remove(this.container);
    }
  }
}
