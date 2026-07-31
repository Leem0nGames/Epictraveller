'use client';

import { useState } from 'react';
import { EntityInspector } from './EntityInspector';

export function DebugMenu({ onClose }: { onClose: () => void }) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const tools = [
    { name: 'Entity Inspector', component: <EntityInspector /> },
    { name: 'Item Generator', component: <div>Item Generator (TBD)</div> },
    { name: 'Loot Simulator', component: <div>Loot Simulator (TBD)</div> },
    { name: 'Battle Debug', component: <div>Battle Debug (TBD)</div> },
  ];

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-full max-w-4xl h-[600px] flex flex-col text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{activeTool || 'Debug Menu'}</h2>
          <div className="flex gap-2">
            {activeTool && <button onClick={() => setActiveTool(null)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded">Back</button>}
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded">Close</button>
          </div>
        </div>
        
        <div className="flex-grow overflow-hidden">
          {!activeTool ? (
            <div className="grid grid-cols-2 gap-4">
              {tools.map(tool => (
                <button key={tool.name} onClick={() => setActiveTool(tool.name)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded text-left">
                  {tool.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="h-full">
              {tools.find(t => t.name === activeTool)?.component}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
