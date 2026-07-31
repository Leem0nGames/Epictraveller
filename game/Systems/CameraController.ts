import * as THREE from 'three';
import { Entity } from '../Entities/Entity';
import { Config } from '../Core/Config';

/**
 * Reusable Camera Tracking System.
 * Translates camera position smoothly using Lerp to follow any target entity.
 * Keeps camera operations entirely decoupled from player specific code.
 */
export class CameraController {
  private camera: THREE.Camera;
  private targetEntity: Entity | null = null;

  // Custom offset parameters
  private offset: THREE.Vector3;
  private lookOffset: THREE.Vector3;
  private lerpSpeed: number;
  private zoomFactor: number = 1.0;

  // Auto-Orbit camera settings
  private autoOrbit: boolean = false;
  private orbitAngle: number = 0;
  private orbitSpeed: number = 0.25; // Radians per second (slow rotation)

  constructor(camera: THREE.Camera) {
    this.camera = camera;

    // Load defaults from Config to eliminate magic numbers
    this.offset = new THREE.Vector3(
      Config.CAMERA?.OFFSET?.X ?? 0,
      Config.CAMERA?.OFFSET?.Y ?? 15,
      Config.CAMERA?.OFFSET?.Z ?? 15
    );

    this.lookOffset = new THREE.Vector3(
      Config.CAMERA?.TARGET_OFFSET?.X ?? 0,
      Config.CAMERA?.TARGET_OFFSET?.Y ?? 0,
      Config.CAMERA?.TARGET_OFFSET?.Z ?? 0
    );

    this.lerpSpeed = Config.CAMERA_CONTROLLER?.LERP_SPEED ?? 5.0;
  }

  /**
   * Focuses camera tracking on a specific entity
   */
  public setTarget(entity: Entity | null): void {
    this.targetEntity = entity;
  }

  /**
   * Set the interactive zoom factor
   */
  public setZoomFactor(factor: number): void {
    this.zoomFactor = Math.max(0.5, Math.min(3.0, factor));
  }

  /**
   * Get current zoom factor
   */
  public getZoomFactor(): number {
    return this.zoomFactor;
  }

  /**
   * Set if the camera should slowly rotate around the target player
   */
  public setAutoOrbit(enabled: boolean): void {
    this.autoOrbit = enabled;
  }

  /**
   * Check if Auto-Orbit camera is enabled
   */
  public isAutoOrbitEnabled(): boolean {
    return this.autoOrbit;
  }

  /**
   * Frame tick smooth tracking calculation
   */
  public update(deltaTime: number): void {
    if (!this.targetEntity) return;

    const targetPos = this.targetEntity.position;

    let currentOffsetX = this.offset.x;
    let currentOffsetZ = this.offset.z;

    if (this.autoOrbit) {
      this.orbitAngle += this.orbitSpeed * deltaTime;
      const twoPi = Math.PI * 2;
      if (this.orbitAngle >= twoPi) {
        this.orbitAngle -= twoPi;
      }

      // Calculate radius in the XZ plane based on current config offset
      const R = Math.sqrt(this.offset.x * this.offset.x + this.offset.z * this.offset.z) || 15;
      
      // Calculate rotating circular coordinates around the target Player
      currentOffsetX = R * Math.sin(this.orbitAngle);
      currentOffsetZ = R * Math.cos(this.orbitAngle);
    } else {
      this.orbitAngle = 0;
    }

    // Desired camera position coordinates scaled by interactive zoom factor
    const desiredX = targetPos.x + currentOffsetX * this.zoomFactor;
    const desiredY = targetPos.y + this.offset.y * this.zoomFactor;
    const desiredZ = targetPos.z + currentOffsetZ * this.zoomFactor;

    // Linear interpolation factor adjusted for deltaTime
    const t = 1.0 - Math.exp(-this.lerpSpeed * deltaTime);

    // Interpolate positions
    this.camera.position.x += (desiredX - this.camera.position.x) * t;
    this.camera.position.y += (desiredY - this.camera.position.y) * t;
    this.camera.position.z += (desiredZ - this.camera.position.z) * t;

    // Look at target with local height offset
    const lookAtPoint = new THREE.Vector3(
      targetPos.x + this.lookOffset.x,
      targetPos.y + this.lookOffset.y,
      targetPos.z + this.lookOffset.z
    );

    this.camera.lookAt(lookAtPoint);
  }

  /**
   * Allows configuring tracking offsets on-the-fly
   */
  public setOffset(x: number, y: number, z: number): void {
    this.offset.set(x, y, z);
  }

  /**
   * Configure vertical look height or side targeting offsets
   */
  public setLookOffset(x: number, y: number, z: number): void {
    this.lookOffset.set(x, y, z);
  }

  /**
   * Modify interpolating speeds
   */
  public setLerpSpeed(speed: number): void {
    this.lerpSpeed = speed;
  }

  public get activeTarget(): Entity | null {
    return this.targetEntity;
  }
}
