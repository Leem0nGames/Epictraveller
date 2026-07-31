import * as THREE from 'three';
import { SpriteManifestEntry } from '../Assets/AssetManifest';

/**
 * Reusable SpriteRenderer component for JRPG Sprites.
 * Manages frame calculations, materials, scales, offsets, pivots, and billboard orientations.
 * Entirely decoupled from the player; can be reused for NPCs, enemies, and props.
 */
export class SpriteRenderer {
  private container: THREE.Group;
  private entry: SpriteManifestEntry;
  
  private geometry!: THREE.PlaneGeometry;
  private material!: THREE.MeshStandardMaterial;
  private mesh!: THREE.Mesh;
  private baseTexture: THREE.Texture;
  private instanceTexture!: THREE.Texture;
  private lastOffsetHash: string = '';

  constructor(container: THREE.Group, baseTexture: THREE.Texture, entry: SpriteManifestEntry) {
    this.container = container;
    this.baseTexture = baseTexture;
    this.entry = entry;
    this.init();
  }

  private init(): void {
    // Clone texture to prevent UV changes from spilling over to other entities sharing the asset
    this.instanceTexture = this.baseTexture.clone();
    this.instanceTexture.needsUpdate = true;

    // Apply nearest filter for crisp pixel art
    this.instanceTexture.minFilter = THREE.NearestFilter;
    this.instanceTexture.magFilter = THREE.NearestFilter;

    // Calculate initial repeating scale
    const columns = this.entry.columns || 1;
    const rows = this.entry.rows || 1;
    this.instanceTexture.repeat.set(1.0 / columns, 1.0 / rows);

    // Default frame row/col
    this.setFrame(0, 0);

    // Create a high-quality standard material (supports shadow casting, double sided, pixelated alpha)
    this.material = new THREE.MeshStandardMaterial({
      map: this.instanceTexture,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.6,
      metalness: 0.1,
    });

    // Create plane geometry
    const width = this.entry.scale?.x ?? 1.0;
    const height = this.entry.scale?.y ?? 1.0;
    this.geometry = new THREE.PlaneGeometry(width, height);

    // Apply pivot offset (feet or center)
    const pivotX = this.entry.pivot?.x ?? 0.5;
    const pivotY = this.entry.pivot?.y ?? 0.5;
    
    const pivotXOffset = (0.5 - pivotX) * width;
    const pivotYOffset = (0.5 - pivotY) * height;
    
    this.geometry.translate(pivotXOffset, height / 2 - (pivotY * height), 0);

    // Build the mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Add to container
    this.container.add(this.mesh);
  }

  /**
   * Directly updates texture offsets to point to the correct spritesheet coordinates
   */
  public setFrame(col: number, row: number): void {
    const columns = this.entry.columns || 1;
    const rows = this.entry.rows || 1;
    
    const uOffset = col / columns;
    const vOffset = 1.0 - ((row + 1) / rows);

    const offsetHash = `${uOffset}_${vOffset}`;
    if (this.lastOffsetHash !== offsetHash) {
      this.instanceTexture.offset.set(uOffset, vOffset);
      this.lastOffsetHash = offsetHash;
    }
  }

  /**
   * Sets a new active texture and its manifest descriptor.
   */
  public setTexture(texture: THREE.Texture, entry: SpriteManifestEntry): void {
    if (this.baseTexture === texture) return;
    
    // Dispose old instance texture
    if (this.instanceTexture) {
      this.instanceTexture.dispose();
    }

    this.baseTexture = texture;
    this.entry = entry;

    this.instanceTexture = texture.clone();
    this.instanceTexture.needsUpdate = true;
    this.instanceTexture.minFilter = THREE.NearestFilter;
    this.instanceTexture.magFilter = THREE.NearestFilter;

    const columns = this.entry.columns || 1;
    const rows = this.entry.rows || 1;
    this.instanceTexture.repeat.set(1.0 / columns, 1.0 / rows);

    this.material.map = this.instanceTexture;
    this.material.needsUpdate = true;

    this.lastOffsetHash = '';
    this.setFrame(0, 0);
  }

  /**
   * Updates standard billboard orientation to face the active camera plane
   */
  public updateBillboard(camera: THREE.Camera): void {
    this.mesh.quaternion.copy(camera.quaternion);
  }

  /**
   * Set custom scale factor
   */
  public setScale(x: number, y: number): void {
    const isFlipped = this.mesh.scale.x < 0;
    this.mesh.scale.set(isFlipped ? -x : x, y, 1.0);
  }

  private isFlipped: boolean = false;

  /**
   * Horizontally flips the sprite mesh to change facing direction
   */
  public setFlipped(flipped: boolean): void {
    if (this.isFlipped === flipped) return;
    this.isFlipped = flipped;
    
    const scaleX = Math.abs(this.mesh.scale.x);
    this.mesh.scale.x = flipped ? -scaleX : scaleX;
  }

  public getFlipped(): boolean {
    return this.isFlipped;
  }

  /**
   * Sets custom positional offset within the container
   */
  public setOffset(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z);
  }

  /**
   * Sets local meshes rotation
   */
  public setRotation(yRotation: number): void {
    this.mesh.rotation.y = yRotation;
  }

  /**
   * Clean up WebGL resources
   */
  public destroy(): void {
    if (this.mesh) {
      this.container.remove(this.mesh);
    }
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.instanceTexture) this.instanceTexture.dispose();
  }

  public get rawMesh(): THREE.Mesh {
    return this.mesh;
  }
}
