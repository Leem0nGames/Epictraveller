import * as THREE from 'three';

export type AmbientMapTheme = 'village' | 'forest' | 'dungeon' | 'procedural';

/**
 * Creates 3D atmospheric particle systems (fireflies, golden dust, embers)
 * tailored to each map type.
 */
export class MapEnvironmentEffects {
  private scene: THREE.Scene;
  private particlePoints: THREE.Points | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particleMaterial: THREE.PointsMaterial | null = null;

  private particleCount = 180;
  private positions: Float32Array = new Float32Array(0);
  private velocities: Float32Array = new Float32Array(0);
  private currentTheme: AmbientMapTheme = 'village';

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public setMapTheme(theme: AmbientMapTheme): void {
    this.clear();
    this.currentTheme = theme;

    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);

    let color = 0xfde047; // Village: Golden prana dust
    let size = 0.25;

    if (theme === 'forest') {
      color = 0x34d399; // Forest: Emerald fireflies
      size = 0.35;
    } else if (theme === 'dungeon') {
      color = 0xf97316; // Dungeon: Fiery embers
      size = 0.30;
    } else if (theme === 'procedural') {
      color = 0x38bdf8; // Procedural: Sky blue mana wisps
      size = 0.30;
    }

    // Initialize random particle positions around map bounds
    for (let i = 0; i < this.particleCount; i++) {
      this.positions[i * 3] = (Math.random() - 0.5) * 32;
      this.positions[i * 3 + 1] = Math.random() * 4 + 0.5;
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * 32;

      this.velocities[i * 3] = (Math.random() - 0.5) * 0.4;
      this.velocities[i * 3 + 1] = Math.random() * 0.3 + 0.1;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.particleMaterial = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particlePoints = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particlePoints);
  }

  public update(deltaTime: number): void {
    if (!this.particlePoints || !this.particleGeometry) return;

    const positions = this.particleGeometry.attributes.position.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      // Update Y (rise)
      positions[i * 3 + 1] += this.velocities[i * 3 + 1] * deltaTime;
      // Gentle sway
      positions[i * 3] += Math.sin(Date.now() * 0.002 + i) * 0.2 * deltaTime;
      positions[i * 3 + 2] += Math.cos(Date.now() * 0.002 + i) * 0.2 * deltaTime;

      // Wrap around
      if (positions[i * 3 + 1] > 5.0) {
        positions[i * 3 + 1] = 0.2;
        positions[i * 3] = (Math.random() - 0.5) * 32;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 32;
      }
    }

    this.particleGeometry.attributes.position.needsUpdate = true;
  }

  public clear(): void {
    if (this.particlePoints) {
      this.scene.remove(this.particlePoints);
      this.particlePoints = null;
    }
    if (this.particleGeometry) {
      this.particleGeometry.dispose();
      this.particleGeometry = null;
    }
    if (this.particleMaterial) {
      this.particleMaterial.dispose();
      this.particleMaterial = null;
    }
  }

  public destroy(): void {
    this.clear();
  }
}
