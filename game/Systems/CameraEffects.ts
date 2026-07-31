export interface CameraConfig {
  lag: number; // 0 (sin lag) a 1 (máximo lag)
  zoom: number;
}

export class CameraEffects {
  private config: CameraConfig;
  private targetX: number = 0;
  private targetY: number = 0;
  public currentX: number = 0;
  public currentY: number = 0;

  constructor(config: CameraConfig) {
    this.config = config;
  }

  public setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  public update(dt: number): void {
    // Interpolación suave
    this.currentX += (this.targetX - this.currentX) * (1 - this.config.lag);
    this.currentY += (this.targetY - this.currentY) * (1 - this.config.lag);
  }
}
