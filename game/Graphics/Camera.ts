import * as THREE from 'three';
import { Config } from '../Core/Config';

/**
 * Fixed JRPG-style isometric perspective camera.
 * Supports smooth camera-target tracking with linear interpolation (lerp).
 */
export class Camera {
  private perspectiveCamera: THREE.PerspectiveCamera;
  private container: HTMLElement;
  private target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private currentPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(container: HTMLElement) {
    this.container = container;

    // Create a perspective camera with a narrow FOV to emulate an orthographic look
    this.perspectiveCamera = new THREE.PerspectiveCamera(
      Config.CAMERA.FOV,
      this.aspectRatio,
      Config.CAMERA.NEAR,
      Config.CAMERA.FAR
    );

    // Initial position based on Config offsets
    this.resetCameraPosition();
    this.resize();
  }

  /**
   * Calculate current aspect ratio
   */
  private get aspectRatio(): number {
    return this.container.clientWidth / this.container.clientHeight;
  }

  /**
   * Resets the camera offsets relative to the target
   */
  public resetCameraPosition(): void {
    const offset = Config.CAMERA.OFFSET;
    this.currentPosition.set(
      this.target.x + offset.X,
      this.target.y + offset.Y,
      this.target.z + offset.Z
    );
    this.perspectiveCamera.position.copy(this.currentPosition);

    const lookTarget = new THREE.Vector3(
      this.target.x + Config.CAMERA.TARGET_OFFSET.X,
      this.target.y + Config.CAMERA.TARGET_OFFSET.Y,
      this.target.z + Config.CAMERA.TARGET_OFFSET.Z
    );
    this.perspectiveCamera.lookAt(lookTarget);
  }

  /**
   * Set focus target coordinates
   */
  public setTarget(x: number, y: number, z: number): void {
    this.target.set(x, y, z);
  }

  /**
   * Smoothly interpolate camera position towards target
   * @param deltaTime Elapsed time since last frame
   * @param speed Speed rate of the camera following action
   */
  public update(deltaTime: number, speed: number = 5.0): void {
    const offset = Config.CAMERA.OFFSET;
    const targetCamX = this.target.x + offset.X;
    const targetCamY = this.target.y + offset.Y;
    const targetCamZ = this.target.z + offset.Z;

    // Smoothly interpolate current camera position to target position
    const lerpFactor = 1 - Math.exp(-speed * deltaTime);
    this.perspectiveCamera.position.x += (targetCamX - this.perspectiveCamera.position.x) * lerpFactor;
    this.perspectiveCamera.position.y += (targetCamY - this.perspectiveCamera.position.y) * lerpFactor;
    this.perspectiveCamera.position.z += (targetCamZ - this.perspectiveCamera.position.z) * lerpFactor;

    // Update lookAt
    const lookTarget = new THREE.Vector3(
      this.target.x + Config.CAMERA.TARGET_OFFSET.X,
      this.target.y + Config.CAMERA.TARGET_OFFSET.Y,
      this.target.z + Config.CAMERA.TARGET_OFFSET.Z
    );
    this.perspectiveCamera.lookAt(lookTarget);
  }

  /**
   * Update aspect ratio on resize
   */
  public resize(): void {
    const aspect = this.aspectRatio;
    this.perspectiveCamera.aspect = aspect;

    // Adjust FOV dynamically based on aspect ratio!
    // If aspect ratio is small (portrait), we increase the FOV to zoom out and prevent horizontal stretch.
    if (aspect < 1) {
      // Scale FOV up so everything fits beautifully on narrow phone displays
      this.perspectiveCamera.fov = Config.CAMERA.FOV + (1.0 - aspect) * 28;
    } else {
      // Landscape mode: standard FOV
      this.perspectiveCamera.fov = Config.CAMERA.FOV;
    }

    this.perspectiveCamera.updateProjectionMatrix();
  }

  /**
   * Get raw perspective camera instance
   */
  public get raw(): THREE.PerspectiveCamera {
    return this.perspectiveCamera;
  }
}
