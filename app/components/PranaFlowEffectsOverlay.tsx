'use client';

import React, { useEffect, useRef } from 'react';
import { PranaVisualSystem, PranaAbilityCategory } from '../../game/Effects/PranaVisualSystem';
import { EventBus } from '../../game/Core/EventBus';

interface PranaFlowEffectsOverlayProps {
  bp: number;
  boostLevel: number;
  isPlayerTurn: boolean;
  className?: string;
}

export const PranaFlowEffectsOverlay: React.FC<PranaFlowEffectsOverlayProps> = ({
  bp,
  boostLevel,
  isPlayerTurn,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Update system state
  useEffect(() => {
    const pranaSystem = PranaVisualSystem.getInstance();
    pranaSystem.setPranaState(bp, boostLevel);
  }, [bp, boostLevel]);

  // Handle EventBus ability bursts
  useEffect(() => {
    const eventBus = EventBus.getInstance();
    const pranaSystem = PranaVisualSystem.getInstance();

    const handleDamage = (data: any) => {
      if (data.attacker === 'PLAYER' || data.source === 'PLAYER') {
        const category: PranaAbilityCategory = data.skillCategory || (data.isCritical ? 'PHYSICAL' : 'MAGICAL');
        const canvas = canvasRef.current;
        const centerX = canvas ? canvas.width / 2 : 120;
        const centerY = canvas ? canvas.height / 2 : 120;
        pranaSystem.triggerAbilityPranaBurst(centerX, centerY, category, boostLevel);
      }
    };

    const handleStateUpdate = (data: any) => {
      if (data.player) {
        pranaSystem.setPranaState(data.player.bp ?? bp, data.player.boostLevel ?? boostLevel);
      }
    };

    eventBus.on('battle:damage', handleDamage);
    eventBus.on('battle:state_update', handleStateUpdate);

    return () => {
      eventBus.off('battle:damage', handleDamage);
      eventBus.off('battle:state_update', handleStateUpdate);
    };
  }, [bp, boostLevel]);

  // Animation Loop for Hero Canvas Shimmer & Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pranaSystem = PranaVisualSystem.getInstance();

    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2 + 10;

      // Update particle emissions and positions
      if (isPlayerTurn) {
        pranaSystem.updateAmbientEmitters(centerX, centerY, dt);
      }
      pranaSystem.update(dt);

      // Render onto canvas
      pranaSystem.renderHeroPranaCanvas(ctx, width, height, centerX, centerY);

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlayerTurn]);

  return (
    <div className={`relative pointer-events-none select-none ${className}`}>
      {/* 2D Canvas for High-Performance Prana Particle Shimmers */}
      <canvas
        ref={canvasRef}
        width={240}
        height={240}
        className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
      />
    </div>
  );
};

interface PranaGaugeHUDProps {
  bp: number;
  maxBp?: number;
  boostLevel: number;
  onBoostClick?: () => void;
  isPlayerTurn: boolean;
}

export const PranaGaugeHUD: React.FC<PranaGaugeHUDProps> = ({
  bp,
  maxBp = 5,
  boostLevel,
  onBoostClick,
  isPlayerTurn,
}) => {
  return (
    <div className="flex flex-col items-center gap-1 bg-slate-950/90 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md select-none">
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Energía Pránica:
        </span>
        <span className="text-xs font-mono font-black text-amber-200">{bp} / {maxBp} BP</span>
      </div>

      {/* 5 Prana Crystals / Orbs */}
      <div className="flex items-center gap-1.5 my-0.5">
        {Array.from({ length: maxBp }).map((_, idx) => {
          const isFilled = idx < bp;
          const isBoosted = idx < boostLevel;

          return (
            <div
              key={idx}
              className={`relative w-4 h-5 rounded-xs transition-all duration-300 flex items-center justify-center ${
                isBoosted
                  ? 'bg-gradient-to-t from-yellow-500 to-amber-300 border-2 border-white shadow-[0_0_12px_rgba(251,191,36,1)] scale-110 rotate-45'
                  : isFilled
                  ? 'bg-gradient-to-t from-amber-600 via-yellow-400 to-amber-300 border border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                  : 'bg-slate-900 border border-slate-700/80 opacity-60'
              }`}
            >
              {isFilled && (
                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_#fff] animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Boost State Sub-Label */}
      {boostLevel > 0 && (
        <span className="text-[8px] font-mono font-black text-amber-300 tracking-wider uppercase animate-bounce">
          ✦ FLUIJO PRÁNICO NIVEL {boostLevel} (x{1 + boostLevel}) ✦
        </span>
      )}
    </div>
  );
};
