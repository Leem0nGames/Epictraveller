'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Game } from '../Core/Game';
import { MobileConfig } from '../Mobile/MobileConfig';

interface VirtualJoystickProps {
  isVisible: boolean;
}

/**
 * High-Performance Touch Analog Joystick.
 * Binds pointer capture coordinates to feed fluid normalized vectors into the overworld engine.
 */
export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ isVisible }) => {
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Offset coordinates of inner knob
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null); // Pointer ID tracking for multitouch isolation
  const startPosRef = useRef({ x: 0, y: 0 }); // Center of the joystick base

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const game = (window as any)._gameInstance || Game.getInstance();
      if (game?.input) {
        game.input.setVirtualMovement(0, 0);
      }
    };
  }, []);

  if (!isVisible) return null;

  const config = MobileConfig.TOUCH.JOYSTICK;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (touchIdRef.current !== null) return; // Already tracking a finger

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Center of the joystick base in client coordinates
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    startPosRef.current = { x: centerX, y: centerY };
    touchIdRef.current = e.pointerId;
    
    // Request pointer capture to receive events even outside the joystick container
    containerRef.current?.setPointerCapture(e.pointerId);
    setActive(true);

    processPointerMove(e.clientX, e.clientY);
  };

  const processPointerMove = (clientX: number, clientY: number) => {
    const startX = startPosRef.current.x;
    const startY = startPosRef.current.y;

    let deltaX = clientX - startX;
    let deltaY = clientY - startY;

    // Calculate absolute Euclidean distance
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxRadius = config.SIZE / 2;

    // Calculate unit direction vectors
    const angle = Math.atan2(deltaY, deltaX);

    // Apply deadzone check
    const distanceRatio = Math.min(distance / maxRadius, 1.0);
    
    let moveX = 0;
    let moveZ = 0;

    if (distanceRatio > config.DEADZONE) {
      // Calculate normalized vector based on deadzone scaling and multiplier sensitivity
      const adjustedRatio = ((distanceRatio - config.DEADZONE) / (1.0 - config.DEADZONE)) * config.SENSITIVITY;
      const finalRatio = Math.min(adjustedRatio, 1.0);

      moveX = Math.cos(angle) * finalRatio;
      moveZ = Math.sin(angle) * finalRatio; // Z matches the depth axis in the 3D overworld
    }

    // Set knob offset position visually
    const cappedDistance = Math.min(distance, maxRadius);
    setPosition({
      x: Math.cos(angle) * cappedDistance,
      y: Math.sin(angle) * cappedDistance,
    });

    // Feed movement vectors into the centralized game InputManager
    const game = (window as any)._gameInstance || Game.getInstance();
    if (game?.input) {
      game.input.setVirtualMovement(moveX, moveZ);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (touchIdRef.current !== e.pointerId || !active) return;
    processPointerMove(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (touchIdRef.current !== e.pointerId) return;

    setActive(false);
    setPosition({ x: 0, y: 0 });
    touchIdRef.current = null;

    // Reset overworld speed vector
    const game = (window as any)._gameInstance || Game.getInstance();
    if (game?.input) {
      game.input.setVirtualMovement(0, 0);
    }
  };

  return (
    <div
      className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 select-none pointer-events-auto touch-none"
      style={{
        paddingBottom: MobileConfig.SAFE_AREA.NOTCH_PADDING_BOTTOM,
        paddingLeft: MobileConfig.SAFE_AREA.NOTCH_PADDING_LEFT,
      }}
    >
      <div
        ref={containerRef}
        className="relative rounded-full flex items-center justify-center border-2 bg-slate-950/40 backdrop-blur-[2px] transition-all"
        style={{
          width: config.SIZE,
          height: config.SIZE,
          opacity: active ? config.OPACITY_ACTIVE : config.OPACITY_IDLE,
          borderColor: active ? 'rgba(245, 158, 11, 0.65)' : 'rgba(71, 85, 105, 0.4)',
          boxShadow: active ? '0 0 15px rgba(245, 158, 11, 0.15)' : 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Decorative inner guide ring */}
        <div 
          className="absolute rounded-full border border-slate-700/20"
          style={{ width: config.SIZE * 0.45, height: config.SIZE * 0.45 }}
        />

        {/* Floating Joystick Knob */}
        <div
          className="absolute rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-600 shadow-md flex items-center justify-center transition-shadow duration-150"
          style={{
            width: config.KNOB_SIZE,
            height: config.KNOB_SIZE,
            transform: `translate(${position.x}px, ${position.y}px)`,
            borderColor: active ? '#d97706' : '#475569',
            boxShadow: active 
              ? '0 4px 10px rgba(0,0,0,0.5), inset 0 2px 2px rgba(255,255,255,0.1), 0 0 8px rgba(245, 158, 11, 0.4)' 
              : '0 4px 10px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Knob core decorative indent */}
          <div 
            className="rounded-full bg-slate-950/40 border border-slate-700/10"
            style={{ 
              width: config.KNOB_SIZE * 0.4, 
              height: config.KNOB_SIZE * 0.4,
              borderColor: active ? 'rgba(245,158,11,0.3)' : 'rgba(71,85,105,0.15)'
            }}
          />
        </div>
      </div>
    </div>
  );
};
