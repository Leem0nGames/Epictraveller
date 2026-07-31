'use client';

import React from 'react';
import { Home, Trees, Skull, ChevronRight } from 'lucide-react';
import { EventBus } from '../../game/Core/EventBus';

interface MapTabProps {
  currentMapId: string;
  onCloseMenu: () => void;
}

export const MapTab: React.FC<MapTabProps> = ({ currentMapId, onCloseMenu }) => {
  const handleMapTravel = (targetMapId: string) => {
    EventBus.getInstance().emit('map:change_request', { targetMapId });
    onCloseMenu();
  };

  return (
    <div className="space-y-3 select-none">
      <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-black block">
        DESTINOS DE VIAJE RÁPIDO
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Pueblo */}
        <button
          onClick={() => handleMapTravel('village')}
          className={`flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all text-left cursor-pointer group ${
            currentMapId === 'village'
              ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              : 'bg-[#121824] border-slate-800 hover:border-amber-500/50 hover:bg-[#182030]'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              {currentMapId === 'village' && (
                <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  ACTUAL
                </span>
              )}
            </div>
            <div>
              <h4 className="font-sans font-bold text-sm text-amber-100 uppercase">SANTUARIO DE MIDGARD-LOKA</h4>
              <p className="text-xs text-slate-400 mt-0.5 sm:mt-1">Santuario Central Seguro • Guardia Kshatriya y Altar del Soma</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-amber-400 font-bold group-hover:translate-x-1 transition-transform">
            <span>VIAJAR AQUÍ</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* Forest */}
        <button
          onClick={() => handleMapTravel('forest')}
          className={`flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all text-left cursor-pointer group ${
            currentMapId === 'forest'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
              : 'bg-[#121824] border-slate-800 hover:border-emerald-500/50 hover:bg-[#182030]'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Trees className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              {currentMapId === 'forest' && (
                <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  ACTUAL
                </span>
              )}
            </div>
            <div>
              <h4 className="font-sans font-bold text-sm text-emerald-100 uppercase">BOSQUE DE ASGARD-SAMSARA</h4>
              <p className="text-xs text-slate-400 mt-0.5 sm:mt-1">Bosque Sagrado • Siervos de Vritra Nv. 1-5</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-400 font-bold group-hover:translate-x-1 transition-transform">
            <span>VIAJAR AQUÍ</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* Dungeon */}
        <button
          onClick={() => handleMapTravel('dungeon')}
          className={`flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all text-left cursor-pointer group ${
            currentMapId === 'dungeon'
              ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
              : 'bg-[#121824] border-slate-800 hover:border-purple-500/50 hover:bg-[#182030]'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Skull className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              {currentMapId === 'dungeon' && (
                <span className="text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full">
                  ACTUAL
                </span>
              )}
            </div>
            <div>
              <h4 className="font-sans font-bold text-sm text-purple-100 uppercase">ABISMO DE NIFLHEIM-VRITRA</h4>
              <p className="text-xs text-slate-400 mt-0.5 sm:mt-1">Catacumbas del Caos • Jefes Nv. 5+</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-purple-400 font-bold group-hover:translate-x-1 transition-transform">
            <span>VIAJAR AQUÍ</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    </div>
  );
};
