import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EventBus } from '../Core/EventBus';
import { AssetManifest, SpriteManifestEntry } from '../Assets/AssetManifest';
import { AssetResolver } from './AssetResolver';
import { TextureCache } from './TextureCache';
import { ClaudecraftAssets } from '../Assets/ClaudecraftAssets';

/**
 * Enhanced AssetLoader.
 * Leverages AssetResolver for dynamic CDNs, preloads textures via TextureCache,
 * preloads GLTF models, and hosts procedural fallbacks for JRPG sprite grids when offline or blocked.
 */
export class AssetLoader {
  private textures: Map<string, THREE.Texture> = new Map();
  private materials: Map<string, THREE.Material> = new Map();
  private models: Map<string, THREE.Object3D> = new Map();
  private gltfLoader: GLTFLoader = new GLTFLoader();
  private eventBus: EventBus;
  private textureCache: TextureCache;
  private totalAssets: number = 0;
  private loadedAssets: number = 0;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.textureCache = TextureCache.getInstance();
  }

  /**
   * Preloads necessary world and character assets
   */
  public async loadAll(): Promise<void> {
    const spriteEntries = AssetManifest.sprites;
    const modelEntries = Object.entries(ClaudecraftAssets.MODELS);
    
    // Total assets = 3 (terrain templates) + sprite manifest sheets + 3D GLB models
    this.totalAssets = 3 + spriteEntries.length + modelEntries.length;
    this.loadedAssets = 0;

    // 1. Generate procedural flat tiles
    await this.generateProceduralWorldAssets();

    // 2. Load 3D GLB models asynchronously
    const modelLoadPromises = modelEntries.map(async ([key, url]) => {
      try {
        await this.loadGLTF(key, url);
      } catch (err) {
        console.warn(`AssetLoader: Failed GLB model load for ${key}`, err);
      } finally {
        this.onAssetLoaded();
      }
    });

    // 3. Load all sprite assets asynchronously
    const spriteLoadPromises = spriteEntries.map(async (entry) => {
      try {
        const resolvedUrl = AssetResolver.resolve(entry.url);
        // Load through unified cache
        const texture = await this.textureCache.load(resolvedUrl);
        this.textures.set(entry.id, texture);
      } catch (error) {
        console.warn(`AssetLoader: Failed to fetch online asset "${entry.id}" (${entry.url}). Generating beautiful local fallback.`, error);
        const fallbackTex = this.generateFallbackSpriteSheet(entry);
        this.textures.set(entry.id, fallbackTex);
        this.textureCache.set(entry.id, fallbackTex);
      } finally {
        this.onAssetLoaded();
      }
    });

    await Promise.all([...modelLoadPromises, ...spriteLoadPromises]);
  }

  /**
   * Asynchronously load a single GLTF/GLB model
   */
  public async loadGLTF(key: string, url: string): Promise<THREE.Object3D | null> {
    if (this.models.has(key)) {
      return this.models.get(key)!;
    }
    return new Promise((resolve) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const object = gltf.scene;
          object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.models.set(key, object);
          resolve(object);
        },
        undefined,
        (error) => {
          console.warn(`AssetLoader: Could not load 3D GLTF model "${key}" (${url}). Using procedural fallback.`, error);
          resolve(null);
        }
      );
    });
  }

  /**
   * Returns a cloned instance of a preloaded GLTF model
   */
  public getModelInstance(key: string): THREE.Object3D | null {
    const model = this.models.get(key);
    if (!model) return null;
    const clone = model.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }

  /**
   * Generates or loads base terrain textures from CDN with procedural fallbacks
   */
  private async generateProceduralWorldAssets(): Promise<void> {
    // 1. Checkerboard
    const checkerboard = this.createProceduralCheckerboard(128, 0x1f2430, 0x1a1d26);
    this.textures.set('checkerboard', checkerboard);
    this.onAssetLoaded();

    // Helper to load or fallback texture
    const loadBiomeTex = async (key: string, url: string, fallbackFn: () => THREE.Texture) => {
      try {
        const tex = await this.textureCache.load(url);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        this.textures.set(key, tex);
      } catch {
        const fb = fallbackFn();
        this.textures.set(key, fb);
      }
    };

    // 2. Grass
    await loadBiomeTex('grass', ClaudecraftAssets.TERRAIN.grass_color, () => this.createProceduralGrass(128));
    await loadBiomeTex('grass_normal', ClaudecraftAssets.TERRAIN.grass_normal, () => this.createProceduralGrass(128));
    this.onAssetLoaded();

    // 3. Stone
    await loadBiomeTex('stone', ClaudecraftAssets.TERRAIN.stone_color, () => this.createProceduralStone(128));
    await loadBiomeTex('stone_normal', ClaudecraftAssets.TERRAIN.stone_normal, () => this.createProceduralStone(128));
    this.onAssetLoaded();

    // 4. Dirt
    await loadBiomeTex('dirt', ClaudecraftAssets.TERRAIN.dirt_color, () => this.createProceduralGrass(128));
    await loadBiomeTex('dirt_normal', ClaudecraftAssets.TERRAIN.dirt_normal, () => this.createProceduralGrass(128));

    // 5. Rock
    await loadBiomeTex('rock', ClaudecraftAssets.TERRAIN.rock_color, () => this.createProceduralStone(128));

    // 6. Snow
    await loadBiomeTex('snow', ClaudecraftAssets.TERRAIN.snow_color, () => this.createProceduralGrass(128));

    // 7. Lava
    await loadBiomeTex('lava', ClaudecraftAssets.TERRAIN.lava_color, () => this.createProceduralGrass(128));
  }

  /**
   * Called when any asset completes loading to update progress bar
   */
  private onAssetLoaded(): void {
    this.loadedAssets++;
    const progress = Math.min(1.0, this.loadedAssets / this.totalAssets);
    this.eventBus.emit('asset:progress', progress);

    if (this.loadedAssets === this.totalAssets) {
      this.eventBus.emit('asset:loaded');
    }
  }

  /**
   * Retrieve a preloaded texture
   */
  public getTexture(key: string): THREE.Texture | undefined {
    return this.textures.get(key);
  }

  /**
   * Create standard material using preloaded texture
   */
  public getMaterial(textureKey: string, options: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
    const materialKey = `${textureKey}_${JSON.stringify(options)}`;
    if (this.materials.has(materialKey)) {
      return this.materials.get(materialKey) as THREE.MeshStandardMaterial;
    }

    const texture = this.getTexture(textureKey);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.1,
      ...options,
    });

    this.materials.set(materialKey, material);
    return material;
  }

  /**
   * Helper: Draw an elegant retro fallback LPC-styled spritesheet
   * to ensure full offline playability when Github/CDN links are blocked or offline.
   */
  private generateFallbackSpriteSheet(entry: SpriteManifestEntry): THREE.Texture {
    const canvas = document.createElement('canvas');
    // Generates a large grid corresponding to the rows/columns
    const frameSize = 32;
    canvas.width = entry.columns * frameSize;
    canvas.height = entry.rows * frameSize;
    
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pick distinct colors based on character ID
    let headColor = '#ffa07a';
    let bodyColor = '#4682b4';
    if (entry.id === 'knight_armor') {
      headColor = '#dcdcdc';
      bodyColor = '#708090';
    } else if (entry.id === 'slime_enemy') {
      headColor = '#00ffff';
      bodyColor = '#008080';
    }

    // Populate the entire grid
    for (let r = 0; r < entry.rows; r++) {
      for (let c = 0; c < entry.columns; c++) {
        const x = c * frameSize;
        const y = r * frameSize;

        // Draw sub-pixels to make it look like a cute retro JRPG sprite
        ctx.fillStyle = bodyColor;
        ctx.fillRect(x + 6, y + 12, 20, 16); // Body

        ctx.fillStyle = headColor;
        ctx.fillRect(x + 10, y + 2, 12, 10); // Head

        // Draw eyes looking left, right, up, down depending on row indices
        ctx.fillStyle = '#000000';
        const eyeOffset = (c % 4) * 0.5; // Slight animation float
        
        // Rows mapping to directions
        const dir = r % 4; 
        if (dir === 2) { // Down
          ctx.fillRect(x + 12, y + 5 + eyeOffset, 2, 2);
          ctx.fillRect(x + 18, y + 5 + eyeOffset, 2, 2);
        } else if (dir === 1) { // Left
          ctx.fillRect(x + 11, y + 5 + eyeOffset, 2, 2);
          ctx.fillRect(x + 15, y + 5 + eyeOffset, 2, 2);
        } else if (dir === 3) { // Right
          ctx.fillRect(x + 15, y + 5 + eyeOffset, 2, 2);
          ctx.fillRect(x + 19, y + 5 + eyeOffset, 2, 2);
        } else { // Up (Draw hair back)
          ctx.fillStyle = '#5c4033';
          ctx.fillRect(x + 10, y + 2, 12, 6);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Helper: Generate a Checkerboard Texture
   */
  private createProceduralCheckerboard(size: number, colorA: number, colorB: number): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const hexColorA = `#${colorA.toString(16).padStart(6, '0')}`;
    const hexColorB = `#${colorB.toString(16).padStart(6, '0')}`;

    const half = size / 2;
    ctx.fillStyle = hexColorA;
    ctx.fillRect(0, 0, half, half);
    ctx.fillRect(half, half, half, half);

    ctx.fillStyle = hexColorB;
    ctx.fillRect(half, 0, half, half);
    ctx.fillRect(0, half, half, half);

    ctx.strokeStyle = '#0e1117';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Helper: Generate a stylistic JRPG grass pixel texture
   */
  private createProceduralGrass(size: number): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#2a4e2b');
    gradient.addColorStop(1, '#1c331d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#396b3a';
    for (let i = 0; i < 40; i++) {
      const gx = Math.random() * size;
      const gy = Math.random() * size;
      const gw = 2 + Math.random() * 4;
      const gh = 4 + Math.random() * 6;
      ctx.fillRect(gx, gy, gw, gh);
    }

    ctx.strokeStyle = '#152616';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Helper: Generate a stylistic stone tile pattern
   */
  private createProceduralStone(size: number): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#404654';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#252932';
    ctx.lineWidth = 4;
    ctx.fillStyle = '#545c6e';

    const half = size / 2;
    const gap = 4;

    ctx.fillRect(gap, gap, half - gap * 2, half - gap * 2);
    ctx.strokeRect(gap, gap, half - gap * 2, half - gap * 2);

    ctx.fillRect(half + gap, gap, half - gap * 2, half - gap * 2);
    ctx.strokeRect(half + gap, gap, half - gap * 2, half - gap * 2);

    ctx.fillRect(gap, half + gap, half - gap * 2, half - gap * 2);
    ctx.strokeRect(gap, half + gap, half - gap * 2, half - gap * 2);

    ctx.fillRect(half + gap, half + gap, half - gap * 2, half - gap * 2);
    ctx.strokeRect(half + gap, half + gap, half - gap * 2, half - gap * 2);

    ctx.strokeStyle = '#2d323c';
    ctx.beginPath();
    ctx.moveTo(gap * 2, gap * 3);
    ctx.lineTo(gap * 5, gap * 6);
    ctx.lineTo(gap * 3, gap * 9);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Clean up textures and materials
   */
  public destroy(): void {
    this.textures.forEach((texture) => texture.dispose());
    this.textures.clear();

    this.materials.forEach((material) => material.dispose());
    this.materials.clear();
    this.textureCache.clear();
  }
}
