import { ParticleSystem } from '../Effects/ParticleSystem';

export class FootstepSystem {
  private isMoving = false;
  private particleSystem: ParticleSystem;

  constructor(particleSystem: ParticleSystem) {
    this.particleSystem = particleSystem;
  }

  public update(isMoving: boolean, x: number, y: number): void {
    if (isMoving && !this.isMoving) {
      // Inicio movimiento
    }
    
    if (isMoving) {
      // Durante movimiento: emitir partículas de polvo ocasionales
      if (Math.random() < 0.1) {
        this.particleSystem.emit(x, y + 32, (Math.random() - 0.5) * 10, -5, 0.5, '#cccccc', 2);
      }
    }

    if (!isMoving && this.isMoving) {
      // Fin movimiento
    }

    this.isMoving = isMoving;
  }
}
