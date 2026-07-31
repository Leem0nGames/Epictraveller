export interface ParticleConfig {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export class ParticleSystem {
  private pool: ParticleConfig[] = [];
  private activeParticles: ParticleConfig[] = [];
  private maxParticles = 200;

  constructor() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool.push(this.createEmptyParticle());
    }
  }

  private createEmptyParticle(): ParticleConfig {
    return { x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '#ffffff', size: 2 };
  }

  public emit(x: number, y: number, vx: number, vy: number, life: number, color: string, size: number): void {
    if (this.pool.length === 0) return;

    const p = this.pool.pop()!;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.color = color;
    p.size = size;
    this.activeParticles.push(p);
  }

  public update(dt: number): void {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.activeParticles.splice(i, 1);
        this.pool.push(p);
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.activeParticles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }
}
