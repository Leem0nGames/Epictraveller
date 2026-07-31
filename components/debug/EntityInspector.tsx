'use client';
import { useState, useEffect } from 'react';
import { World } from '@/game/World/World';

export function EntityInspector() {
  const [entities, setEntities] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    const update = () => {
      const world = World.getInstance();
      if (world) {
        setEntities(world.entityManager.getAll());
      }
    };
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-[400px]">
      <div className="w-1/3 border-r border-slate-700 overflow-y-auto">
        <h3 className="p-2 font-bold bg-slate-800">Entities</h3>
        {entities.map(e => (
          <div key={e.id} onClick={() => setSelected(e)} className={`p-2 cursor-pointer hover:bg-slate-700 ${selected?.id === e.id ? 'bg-slate-700' : ''}`}>
            {e.constructor.name} ({e.id.substring(0, 5)})
          </div>
        ))}
      </div>
      <div className="w-2/3 p-4 overflow-y-auto">
        {selected ? (
          <div>
            <h3 className="font-bold text-lg">{selected.constructor.name}</h3>
            <pre className="text-xs text-slate-300">{JSON.stringify({
              id: selected.id,
              position: selected.position,
              rotation: selected.rotation,
              scale: selected.scale,
              // Add more fields if available
            }, null, 2)}</pre>
          </div>
        ) : (
          <div>Select an entity</div>
        )}
      </div>
    </div>
  );
}
