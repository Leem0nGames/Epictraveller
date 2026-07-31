'use client';

import React from 'react';
import { Sliders, Smartphone, Eye, RotateCw } from 'lucide-react';

interface SettingsTabProps {
  telemetryQuality: string;
  forceTouch: boolean;
  debugCollidersEnabled?: boolean;
  debugAutoOrbitEnabled?: boolean;
  onChangeQuality: (level: 'LOW' | 'MEDIUM' | 'HIGH') => void;
  onToggleTouch: () => void;
  onToggleColliders: () => void;
  onToggleAutoOrbit: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  telemetryQuality,
  forceTouch,
  debugCollidersEnabled = false,
  debugAutoOrbitEnabled = false,
  onChangeQuality,
  onToggleTouch,
  onToggleColliders,
  onToggleAutoOrbit,
}) => {
  return (
    <div className="space-y-4 sm:space-y-5 max-w-xl mx-auto select-none">
      {/* Graphics Quality */}
      <div className="bg-[#101522] border border-slate-800 p-3.5 sm:p-4 rounded-2xl space-y-2.5">
        <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-black flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-amber-500 shrink-0" /> CALIDAD GRÁFICA DE RENDERIZADO
        </span>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => {
            const isActive = (telemetryQuality || 'MEDIUM') === lvl;
            const label = lvl === 'LOW' ? 'BAJO' : lvl === 'MEDIUM' ? 'MEDIO' : 'ALTO';
            return (
              <button
                key={lvl}
                onClick={() => onChangeQuality(lvl)}
                className={`py-2 text-xs font-black tracking-wider rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-amber-50 shadow-md border border-amber-400'
                    : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tools & Overlays */}
      <div className="bg-[#101522] border border-slate-800 p-3.5 sm:p-4 rounded-2xl space-y-2.5">
        <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-black block">
          HERRAMIENTAS Y OVERLAYS
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={onToggleTouch}
            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              forceTouch
                ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 shrink-0 text-amber-400" /> Táctil
            </span>
            <span className="text-[10px] font-mono font-black">{forceTouch ? 'FORZAR' : 'AUTO'}</span>
          </button>

          <button
            onClick={onToggleColliders}
            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              debugCollidersEnabled
                ? 'bg-sky-500/20 border-sky-500 text-sky-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 shrink-0 text-sky-400" /> Colisiones
            </span>
            <span className="text-[10px] font-mono font-black">{debugCollidersEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onToggleAutoOrbit}
            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              debugAutoOrbitEnabled
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <RotateCw className="w-4 h-4 shrink-0 text-indigo-400" /> Órbita
            </span>
            <span className="text-[10px] font-mono font-black">{debugAutoOrbitEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
