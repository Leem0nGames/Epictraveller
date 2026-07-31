'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, MapPin, Sparkles, X, Shield, Skull, Package, Navigation, Home, Eye } from 'lucide-react';
import { MAP_DEFINITIONS, MapDefinition } from '@/game/World/MapDefinitions';
import { EventBus } from '@/game/Core/EventBus';

interface MapOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMapId: string;
}

export const MapOverlayModal: React.FC<MapOverlayModalProps> = ({
  isOpen,
  onClose,
  currentMapId,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'PORTALS' | 'NPCS' | 'ENEMIES' | 'CHESTS'>('ALL');

  if (!isOpen) return null;

  const mapDef: MapDefinition = MAP_DEFINITIONS[currentMapId] || MAP_DEFINITIONS.village;

  // Coordinate normalizer for 32x32 terrain grid (-16 to +16 -> 0% to 100%)
  const toMapPos = (x: number, z: number) => {
    const mapSize = 32;
    const px = Math.min(100, Math.max(0, ((x + mapSize / 2) / mapSize) * 100));
    const py = Math.min(100, Math.max(0, ((z + mapSize / 2) / mapSize) * 100));
    return { left: `${px}%`, top: `${py}%` };
  };

  const handleFastTravel = (portal: any) => {
    EventBus.getInstance().emit('map:change_request', {
      targetMapId: portal.targetMapId,
      targetX: portal.targetX,
      targetZ: portal.targetZ,
      targetName: portal.targetName,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl rounded-2xl border border-amber-500/30 bg-[#0b0f17]/95 p-6 shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Compass className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-serif text-amber-100">{mapDef.name}</h2>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {mapDef.type}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{mapDef.subtitle}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Map Filters & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              {(['ALL', 'PORTALS', 'NPCS', 'ENEMIES', 'CHESTS'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    filterType === type
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {type === 'ALL' && 'Todos'}
                  {type === 'PORTALS' && 'Portales'}
                  {type === 'NPCS' && 'NPCs'}
                  {type === 'ENEMIES' && 'Enemigos'}
                  {type === 'CHESTS' && 'Tesores'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Escala: Grid Tactical 32x32m</span>
            </div>
          </div>

          {/* Tactical Blueprint Canvas Container */}
          <div className="relative flex-1 min-h-[360px] max-h-[500px] w-full rounded-xl border border-slate-800 bg-[#06090e] p-4 overflow-hidden shadow-inner flex items-center justify-center">
            {/* Grid overlay lines */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
                backgroundSize: '8% 8%',
              }}
            />

            {/* Tactical Radar Display Area */}
            <div className="relative w-full h-full max-w-[480px] max-h-[480px] aspect-square rounded-xl border border-amber-500/20 bg-slate-950/60 p-2 shadow-2xl">
              {/* Compass Ring decor */}
              <div className="absolute inset-2 rounded-lg border border-slate-800/80 pointer-events-none" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-amber-500/60 font-bold">N</div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-600 font-bold">S</div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-600 font-bold">E</div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-600 font-bold">W</div>

              {/* Player Icon Pin */}
              <div
                className="absolute z-30 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                style={toMapPos(mapDef.playerSpawn.x, mapDef.playerSpawn.z)}
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-6 h-6 rounded-full bg-sky-400/30 animate-ping" />
                  <div className="w-4 h-4 rounded-full bg-sky-400 border-2 border-white shadow-lg shadow-sky-400/50 flex items-center justify-center text-[8px] font-bold text-slate-950">
                    P
                  </div>
                </div>
              </div>

              {/* Portals */}
              {(filterType === 'ALL' || filterType === 'PORTALS') &&
                mapDef.spawns.portals.map((portal) => (
                  <div
                    key={portal.id}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    style={toMapPos(portal.x, portal.z)}
                    onClick={() => handleFastTravel(portal)}
                  >
                    <div className="p-1.5 rounded-full bg-purple-600/80 border border-purple-300 text-white shadow-lg hover:scale-125 transition-transform">
                      <Navigation className="w-3.5 h-3.5" />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col items-center whitespace-nowrap bg-slate-900 border border-purple-500/50 px-2 py-1 rounded text-[10px] text-purple-200 z-40 shadow-xl">
                      <span className="font-bold">{portal.targetName}</span>
                      <span className="text-[9px] text-slate-400">Clic para Viajar</span>
                    </div>
                  </div>
                ))}

              {/* Save Points & Chests */}
              {(filterType === 'ALL' || filterType === 'CHESTS') &&
                mapDef.spawns.interactables.map((item) => (
                  <div
                    key={item.id}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group"
                    style={toMapPos(item.x, item.z)}
                  >
                    <div
                      className={`p-1 rounded-full border text-white shadow-md ${
                        item.type === 'SAVE_POINT'
                          ? 'bg-amber-500/80 border-amber-300'
                          : 'bg-emerald-600/80 border-emerald-300'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[10px] text-amber-200 z-40">
                      {item.type === 'SAVE_POINT' ? 'Cristal de Guardado' : 'Cofre de Tesoro'}
                    </div>
                  </div>
                ))}

              {/* NPCs & Enemies */}
              {mapDef.spawns.npcs.map((npc) => {
                const isEnemy = npc.isEnemy;
                if (filterType === 'NPCS' && isEnemy) return null;
                if (filterType === 'ENEMIES' && !isEnemy) return null;

                return (
                  <div
                    key={npc.id}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group"
                    style={toMapPos(npc.x, npc.z)}
                  >
                    <div
                      className={`p-1 rounded-full border text-white shadow-md ${
                        isEnemy
                          ? 'bg-rose-600/80 border-rose-300'
                          : 'bg-sky-600/80 border-sky-300'
                      }`}
                    >
                      {isEnemy ? <Skull className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[10px] text-slate-200 z-40">
                      {npc.name || npc.id}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map Footer Legend */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-white" /> Jugador</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Portal Portal</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Cristal Guardado</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Cofres</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Enemigos</div>
            </div>

            <div className="text-[11px] font-mono text-amber-300/80">
              Presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-200">M</kbd> para Cerrar
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
