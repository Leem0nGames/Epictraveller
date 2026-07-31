import * as THREE from 'three';

/**
 * High-performance, memory-safe in-memory cache for Three.js Texture assets.
 * Ensures that no duplicate downloads are issued for duplicate assets across different game scenes.
 */
export class TextureCache {
  private static instance: TextureCache;
  private cache: Map<string, THREE.Texture> = new Map();
  private loader: THREE.TextureLoader;

  private constructor() {
    this.loader = new THREE.TextureLoader();
    // Allow cross-origin requests for GitHub & jsDelivr textures
    this.loader.setCrossOrigin('anonymous');
  }

  /**
   * Get Singleton Instance
   */
  public static getInstance(): TextureCache {
    if (!TextureCache.instance) {
      TextureCache.instance = new TextureCache();
    }
    return TextureCache.instance;
  }

  /**
   * Load a texture or fetch it from the cache if it already exists
   * @param url Resolved HTTP or local pathway
   */
  public load(url: string): Promise<THREE.Texture> {
    if (this.cache.has(url)) {
      return Promise.resolve(this.cache.get(url)!);
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          // Pixelated texture filtering (HD-2D style)
          texture.minFilter = THREE.NearestFilter;
          texture.magFilter = THREE.NearestFilter;
          texture.generateMipmaps = false;
          texture.colorSpace = THREE.SRGBColorSpace;

          this.cache.set(url, texture);
          resolve(texture);
        },
        undefined,
        (error) => {
          console.warn(`TextureCache: Failed to load texture from "${url}"`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Manual insertion for procedurally generated Canvas textures
   */
  public set(key: string, texture: THREE.Texture): void {
    this.cache.set(key, texture);
  }

  /**
   * Retrieve cached texture without issuing a network request
   */
  public get(key: string): THREE.Texture | undefined {
    return this.cache.get(key);
  }

  /**
   * Checks if an asset exists in cache
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Clean and dispose of all loaded textures
   */
  public clear(): void {
    this.cache.forEach((texture) => {
      texture.dispose();
    });
    this.cache.clear();
  }
}
