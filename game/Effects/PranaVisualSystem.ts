export type PranaAbilityCategory = 'PHYSICAL' | 'MAGICAL' | 'HEAL' | 'BUFF' | 'BOOST';

export interface PranaParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  glowColor: string;
  type: 'ORBIT' | 'RISE' | 'SPARK' | 'BURST' | 'SHIMMER';
  alpha: number;
  angle: number;
  radius: number;
}

export class PranaVisualSystem {
  private static instance: PranaVisualSystem;
  private particles: PranaParticle[] = [];
  private particleIdCounter = 0;

  // Shimmer & Aura state
  private shimmerTime = 0;
  private currentBp = 0;
  private currentBoostLevel = 0;

  private constructor() {}

  public static getInstance(): PranaVisualSystem {
    if (!PranaVisualSystem.instance) {
      PranaVisualSystem.instance = new PranaVisualSystem();
    }
    return PranaVisualSystem.instance;
  }

  public setPranaState(bp: number, boostLevel: number): void {
    this.currentBp = bp;
    this.currentBoostLevel = boostLevel;
  }

  /**
   * Emit passive ambient Prana particles around the hero model based on current Prana/BP level
   */
  public updateAmbientEmitters(
    centerX: number,
    centerY: number,
    dt: number
  ): void {
    this.shimmerTime += dt;

    // Emission rate scales with Prana BP level (0 to 5) and Boost Level (0 to 3)
    const totalEnergy = this.currentBp + this.currentBoostLevel * 2;
    if (totalEnergy <= 0) return;

    // Spawn orbital and rising prana particles
    const spawnChance = Math.min(0.8, 0.08 * totalEnergy);
    if (Math.random() < spawnChance) {
      const isHighPrana = totalEnergy >= 4;
      const angle = Math.random() * Math.PI * 2;
      const radius = 25 + Math.random() * 35;

      const colors = isHighPrana
        ? ['#fef08a', '#fbbf24', '#f59e0b', '#38bdf8', '#c084fc']
        : ['#38bdf8', '#818cf8', '#67e8f9', '#fef08a'];

      const selectedColor = colors[Math.floor(Math.random() * colors.length)];
      const maxLife = 0.8 + Math.random() * 1.2;

      this.particles.push({
        id: ++this.particleIdCounter,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 20,
        vy: -30 - Math.random() * 40 - totalEnergy * 8, // Faster rise at high prana
        life: maxLife,
        maxLife,
        size: 2 + Math.random() * (isHighPrana ? 4.5 : 3),
        color: selectedColor,
        glowColor: isHighPrana ? '#f59e0b' : '#38bdf8',
        type: Math.random() > 0.4 ? 'RISE' : 'ORBIT',
        alpha: 1,
        angle,
        radius,
      });
    }

    // High Prana extra shimmer sparks
    if (totalEnergy >= 3 && Math.random() < 0.2) {
      this.particles.push({
        id: ++this.particleIdCounter,
        x: centerX + (Math.random() - 0.5) * 50,
        y: centerY + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        size: 1.5 + Math.random() * 2.5,
        color: '#ffffff',
        glowColor: '#fbbf24',
        type: 'SHIMMER',
        alpha: 1,
        angle: 0,
        radius: 0,
      });
    }
  }

  /**
   * Trigger explosive Prana-Flow ability particles when an ability or boost is used
   */
  public triggerAbilityPranaBurst(
    centerX: number,
    centerY: number,
    category: PranaAbilityCategory,
    boostLevel: number = 0
  ): void {
    const particleCount = 25 + boostLevel * 20;

    let palette = ['#38bdf8', '#818cf8', '#fef08a'];
    let primaryGlow = '#38bdf8';

    switch (category) {
      case 'PHYSICAL':
        palette = ['#fbbf24', '#f59e0b', '#fef08a', '#ffffff'];
        primaryGlow = '#f59e0b';
        break;
      case 'MAGICAL':
        palette = ['#c084fc', '#a855f7', '#38bdf8', '#67e8f9'];
        primaryGlow = '#a855f7';
        break;
      case 'HEAL':
        palette = ['#34d399', '#10b981', '#6ee7b7', '#fef08a'];
        primaryGlow = '#34d399';
        break;
      case 'BUFF':
      case 'BOOST':
        palette = ['#fef08a', '#fbbf24', '#f59e0b', '#67e8f9'];
        primaryGlow = '#fbbf24';
        break;
    }

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 60 + Math.random() * (120 + boostLevel * 50);
      const color = palette[Math.floor(Math.random() * palette.length)];
      const maxLife = 0.5 + Math.random() * 0.7;

      this.particles.push({
        id: ++this.particleIdCounter,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: maxLife,
        maxLife,
        size: 3 + Math.random() * 5,
        color,
        glowColor: primaryGlow,
        type: 'BURST',
        alpha: 1,
        angle,
        radius: 0,
      });
    }
  }

  /**
   * Update particle positions and lifespans
   */
  public update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.type === 'RISE') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.96;
      } else if (p.type === 'ORBIT') {
        p.angle += dt * 3;
        p.y += p.vy * dt * 0.5;
        p.x += Math.cos(p.angle) * 15 * dt;
      } else if (p.type === 'BURST' || p.type === 'SPARK') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92; // Friction deceleration
        p.vy *= 0.92;
      } else if (p.type === 'SHIMMER') {
        p.size *= 0.95;
      }
    }
  }

  /**
   * Render hero aura, shimmer shader waves, and prana flow particles on 2D Canvas
   */
  public renderHeroPranaCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerX: number,
    centerY: number
  ): void {
    ctx.clearRect(0, 0, width, height);

    const totalEnergy = this.currentBp + this.currentBoostLevel * 2;

    // 1. DYNAMIC HIGH-PRANA AURA SHIMMER (BACKGROUND RINGS)
    if (totalEnergy > 0) {
      ctx.save();

      const pulseScale = 1 + Math.sin(this.shimmerTime * 4) * 0.08;
      const auraRadius = (35 + totalEnergy * 6) * pulseScale;

      // Outer Ethereal Glow
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        5,
        centerX,
        centerY,
        auraRadius * 1.4
      );

      if (this.currentBoostLevel >= 2 || totalEnergy >= 5) {
        // Max Prana Gold-Arcane Aura
        auraGradient.addColorStop(0, 'rgba(254, 240, 138, 0.6)');
        auraGradient.addColorStop(0.4, 'rgba(245, 158, 11, 0.35)');
        auraGradient.addColorStop(0.8, 'rgba(56, 189, 248, 0.2)');
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (totalEnergy >= 3) {
        // High Prana Cyan-Gold Aura
        auraGradient.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
        auraGradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        // Gentle Prana Blue Aura
        auraGradient.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
        auraGradient.addColorStop(0.7, 'rgba(129, 140, 248, 0.15)');
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, auraRadius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // High Prana Rotating Energy Ring
      if (totalEnergy >= 2) {
        ctx.strokeStyle = this.currentBoostLevel > 0 ? 'rgba(251, 191, 36, 0.7)' : 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1.5 + this.currentBoostLevel;
        ctx.setLineDash([8, 6]);

        ctx.beginPath();
        ctx.ellipse(
          centerX,
          centerY + 20,
          auraRadius * 0.9,
          auraRadius * 0.35,
          this.shimmerTime * 1.5,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
      }

      ctx.restore();
    }

    // 2. PRANA-FLOW PARTICLES
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      // Glow effect around each particle
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.glowColor;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Particle Core Highlight
      if (p.size > 3) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 3. HIGH-PRANA SHIMMER WAVE OVERLAY
    if (this.currentBoostLevel >= 1 || totalEnergy >= 4) {
      ctx.save();      const waveCount = 3 + this.currentBoostLevel * 2;
      for (let i = 0; i < waveCount; i++) {
        const offset = (this.shimmerTime * 80 + i * 25) % height;
        const waveY = height - offset;
        const opacity = Math.sin((waveY / height) * Math.PI) * (0.15 + this.currentBoostLevel * 0.08);

        ctx.strokeStyle = i % 2 === 0 ? `rgba(254, 240, 138, ${opacity})` : `rgba(56, 189, 248, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 40, waveY);
        ctx.quadraticCurveTo(
          centerX + Math.sin(this.shimmerTime * 5 + i) * 15,
          waveY - 10,
          centerX + 40,
          waveY
        );
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}
