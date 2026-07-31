import * as THREE from 'three';
import { Config } from '../Core/Config';

/**
 * Manages scene lights and shadow configuration.
 * Creates an atmospheric environment with high quality shadow mapping.
 */
export class Lighting {
  private scene: THREE.Scene;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Create Ambient Light
    this.ambientLight = new THREE.AmbientLight(
      Config.LIGHTS.AMBIENT.COLOR,
      Config.LIGHTS.AMBIENT.INTENSITY
    );
    scene.add(this.ambientLight);

    // 2. Create Directional Light (Main Sun)
    this.directionalLight = new THREE.DirectionalLight(
      Config.LIGHTS.DIRECTIONAL.COLOR,
      Config.LIGHTS.DIRECTIONAL.INTENSITY
    );

    const pos = Config.LIGHTS.DIRECTIONAL.POSITION;
    this.directionalLight.position.set(pos.X, pos.Y, pos.Z);

    // Configure shadows
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.bias = Config.LIGHTS.DIRECTIONAL.SHADOW_BIAS;
    
    // Shadow map size (higher values mean crisper shadow lines)
    this.directionalLight.shadow.mapSize.width = Config.LIGHTS.DIRECTIONAL.SHADOW_MAP_SIZE;
    this.directionalLight.shadow.mapSize.height = Config.LIGHTS.DIRECTIONAL.SHADOW_MAP_SIZE;

    // Configure shadow camera boundaries
    const camSize = Config.LIGHTS.DIRECTIONAL.SHADOW_CAMERA_SIZE;
    this.directionalLight.shadow.camera.left = -camSize;
    this.directionalLight.shadow.camera.right = camSize;
    this.directionalLight.shadow.camera.top = camSize;
    this.directionalLight.shadow.camera.bottom = -camSize;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 100;

    scene.add(this.directionalLight);
  }

  /**
   * Adjusts lighting settings to match map atmosphere (overworld, forest, dungeon)
   */
  public setMapLighting(
    lighting: { ambientColor: number; ambientIntensity: number; sunColor: number; sunIntensity: number; sunPosition: { X: number; Y: number; Z: number } },
    mapType: 'village' | 'forest' | 'dungeon' | 'procedural' = 'village'
  ): void {
    this.ambientLight.color.setHex(lighting.ambientColor);
    this.ambientLight.intensity = lighting.ambientIntensity;

    this.directionalLight.color.setHex(lighting.sunColor);
    this.directionalLight.intensity = lighting.sunIntensity;
    this.directionalLight.position.set(lighting.sunPosition.X, lighting.sunPosition.Y, lighting.sunPosition.Z);

    // Synchronize atmospheric fog & background tint to map theme
    let fogColor = 0x0d1117;
    let fogNear = 12;
    let fogFar = 38;

    if (mapType === 'forest') {
      fogColor = 0x064e3b; // Mystic emerald forest haze
      fogNear = 10;
      fogFar = 32;
    } else if (mapType === 'dungeon') {
      fogColor = 0x0f0e17; // Deep dark void abyss
      fogNear = 6;
      fogFar = 26;
    }

    this.scene.background = new THREE.Color(fogColor);
    this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
  }

  /**
   * Updates light positions if they need to follow a player or transition time of day
   */
  public update(targetX: number, targetZ: number): void {
    // Optional: Directional light can follow the camera's focus target 
    // to ensure shadows are always centered on the active scene bounds.
    const pos = Config.LIGHTS.DIRECTIONAL.POSITION;
    this.directionalLight.position.set(
      targetX + pos.X,
      pos.Y,
      targetZ + pos.Z
    );
    
    // Point light's shadow map camera to follow the target grid coordinates
    this.directionalLight.shadow.camera.updateProjectionMatrix();
  }

  /**
   * Clean up light references
   */
  public destroy(): void {
    this.ambientLight.dispose();
    this.directionalLight.dispose();
  }
}
