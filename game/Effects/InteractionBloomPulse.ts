import * as THREE from 'three';

export interface BloomPulseOptions {
  colorHex?: number; // Primary bloom tint e.g. 0xffb700
  radius?: number; // Base radius of the ground bloom circle
  lightHeight?: number; // Height of the point light
}

/**
 * InteractionBloomPulse
 * Renders a subtle, breathing radial 'bloom' pulse aura with a ground halo,
 * rotating accent ring, and dynamic point light on interactable objects
 * when the player is within interaction range.
 */
export class InteractionBloomPulse {
  private parentContainer: THREE.Object3D;
  private group: THREE.Group;
  
  private bloomMesh: THREE.Mesh;
  private ringMesh: THREE.Mesh;
  private pointLight: THREE.PointLight;
  
  private texture: THREE.CanvasTexture;
  private bloomMat: THREE.MeshBasicMaterial;
  private ringMat: THREE.MeshBasicMaterial;
  private ringGeo: THREE.RingGeometry;
  private planeGeo: THREE.PlaneGeometry;
  
  private active: boolean = false;
  private currentAlpha: number = 0;
  private pulseTime: number = 0;
  private baseRadius: number;
  private colorHex: number;

  constructor(parentContainer: THREE.Object3D, options: BloomPulseOptions = {}) {
    this.parentContainer = parentContainer;
    this.baseRadius = options.radius ?? 0.8;
    this.colorHex = options.colorHex ?? 0xffb700;

    this.group = new THREE.Group();
    this.group.name = 'InteractionBloomPulse';

    // 1. Create procedural soft radial bloom texture
    this.texture = this.createRadialBloomTexture(this.colorHex);

    // 2. Outer Soft Radial Glow Plane
    this.planeGeo = new THREE.PlaneGeometry(this.baseRadius * 2.6, this.baseRadius * 2.6);
    this.bloomMat = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.bloomMesh = new THREE.Mesh(this.planeGeo, this.bloomMat);
    this.bloomMesh.rotation.x = -Math.PI / 2;
    this.bloomMesh.position.y = 0.03; // Just above floor tiles to prevent z-fighting
    this.group.add(this.bloomMesh);

    // 3. Inner Decorative Rotating Accent Ring
    this.ringGeo = new THREE.RingGeometry(this.baseRadius * 0.45, this.baseRadius * 0.62, 32);
    const threeColor = new THREE.Color(this.colorHex);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: threeColor,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.ringMesh = new THREE.Mesh(this.ringGeo, this.ringMat);
    this.ringMesh.rotation.x = -Math.PI / 2;
    this.ringMesh.position.y = 0.035;
    this.group.add(this.ringMesh);

    // 4. Dynamic Point Light casting ambient bloom onto object and environment
    const height = options.lightHeight ?? 0.8;
    this.pointLight = new THREE.PointLight(this.colorHex, 0, 3.5, 2);
    this.pointLight.position.set(0, height, 0);
    this.group.add(this.pointLight);

    this.group.visible = false;
    this.parentContainer.add(this.group);
  }

  /**
   * Generates a smooth 2D radial bloom gradient canvas texture
   */
  private createRadialBloomTexture(colorHex: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const color = new THREE.Color(colorHex);
      const r = Math.floor(color.r * 255);
      const g = Math.floor(color.g * 255);
      const b = Math.floor(color.b * 255);

      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1.0)`);
      grad.addColorStop(0.25, `rgba(${r}, ${g}, ${b}, 0.65)`);
      grad.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, 0.22)`);
      grad.addColorStop(1.0, `rgba(${r}, ${g}, ${b}, 0.0)`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Set color dynamically if object state changes (e.g. unopened vs opened chest)
   */
  public setColor(colorHex: number): void {
    if (this.colorHex === colorHex) return;
    this.colorHex = colorHex;
    const threeColor = new THREE.Color(colorHex);
    this.ringMat.color = threeColor;
    this.pointLight.color = threeColor;
    
    // Regenerate texture
    this.texture.dispose();
    this.texture = this.createRadialBloomTexture(colorHex);
    this.bloomMat.map = this.texture;
    this.bloomMat.needsUpdate = true;
  }

  /**
   * Toggles the proximity pulse bloom state
   */
  public setActive(active: boolean): void {
    this.active = active;
  }

  /**
   * Ticks animation updates (breathing pulse wave, rotation, fade transitions)
   */
  public update(deltaTime: number): void {
    const targetAlpha = this.active ? 1.0 : 0.0;
    
    // Smooth lerp transition for enter/exit
    this.currentAlpha += (targetAlpha - this.currentAlpha) * Math.min(1.0, deltaTime * 8.0);

    if (this.currentAlpha <= 0.001) {
      if (this.group.visible) {
        this.group.visible = false;
      }
      return;
    }

    if (!this.group.visible) {
      this.group.visible = true;
    }

    this.pulseTime += deltaTime * 3.2; // Rhythmic breathing speed

    // Sinusoidal pulse wave (-1.0 to +1.0)
    const wave = Math.sin(this.pulseTime);
    
    // Scale breathing (smooth expansion and contraction)
    const pulseScale = 1.0 + wave * 0.14;
    this.bloomMesh.scale.set(pulseScale, pulseScale, 1.0);
    
    const ringScale = 1.0 + Math.cos(this.pulseTime) * 0.10;
    this.ringMesh.scale.set(ringScale, ringScale, 1.0);
    
    // Counter-rotating accent ring
    this.ringMesh.rotation.z += deltaTime * 1.2;

    // Opacity pulse
    const bloomOpacity = (0.55 + wave * 0.25) * this.currentAlpha;
    const ringOpacity = (0.40 + Math.cos(this.pulseTime) * 0.20) * this.currentAlpha;
    
    this.bloomMat.opacity = Math.max(0, Math.min(1.0, bloomOpacity));
    this.ringMat.opacity = Math.max(0, Math.min(1.0, ringOpacity));

    // Dynamic point light intensity bloom
    const lightIntensity = (1.2 + wave * 0.6) * this.currentAlpha;
    this.pointLight.intensity = Math.max(0, lightIntensity);
  }

  /**
   * Disposal of WebGL resources
   */
  public destroy(): void {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
    this.texture.dispose();
    this.planeGeo.dispose();
    this.ringGeo.dispose();
    this.bloomMat.dispose();
    this.ringMat.dispose();
  }
}
