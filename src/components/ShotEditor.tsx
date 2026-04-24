import React from 'react';
import { useAppStore } from '../store';
import { Film, Move, FastForward, Music, Layers } from 'lucide-react';

const SHOT_TYPES = ['WIDE', 'MEDIUM', 'CLOSE_UP', 'EXTREME_CU', 'COWBOY'];
const MOVEMENTS = ['DOLLY', 'PAN', 'TILT', 'TRACKING', 'FPV', 'CRANE'];
const TRANSITIONS = ['MATCH_CUT', 'WHIP_PAN', 'DISSOLVE', 'JUMP_CUT'];

export const ShotEditor: React.FC = () => {
  const { shotData, setShotData } = useAppStore();

  const handleToggleAudio = (layer: string) => {
    const current = shotData.audioLayers;
    const next = current.includes(layer)
      ? current.filter(l => l !== layer)
      : [...current, layer];
    setShotData({ audioLayers: next });
  };

  return (
    <div className="brutal-card p-4 glass-morphism space-y-4">
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <Film size={14} className="text-accent" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-accent">Shot Editor</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-tighter text-slate-500 flex items-center gap-1">
            <Layers size={10} /> Shot Type
          </label>
          <div className="flex flex-wrap gap-2">
            {SHOT_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setShotData({ type })}
                className={`text-[9px] px-2 py-1 rounded border border-white/10 transition-all ${
                  shotData.type === type ? 'bg-accent text-black border-accent' : 'hover:border-accent/40'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-tighter text-slate-500 flex items-center gap-1">
            <Move size={10} /> Movement
          </label>
          <select
            value={shotData.movement}
            onChange={(e) => setShotData({ movement: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs focus:border-accent outline-none"
          >
            {MOVEMENTS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-tighter text-slate-500 flex items-center gap-1">
            <FastForward size={10} /> Transition
          </label>
          <select
            value={shotData.transition}
            onChange={(e) => setShotData({ transition: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs focus:border-accent outline-none"
          >
            {TRANSITIONS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-tighter text-slate-500 flex items-center gap-1">
            <Music size={10} /> Audio Layers
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['AMBIENT', 'DIEDGE', 'FOLEY', 'SCORE'].map(layer => (
              <button
                key={layer}
                onClick={() => handleToggleAudio(layer)}
                className={`text-[9px] px-2 py-1 rounded border border-white/10 transition-all text-left flex justify-between items-center ${
                  shotData.audioLayers.includes(layer) ? 'bg-accent/20 text-accent border-accent/40' : 'hover:border-accent/20'
                }`}
              >
                {layer}
                {shotData.audioLayers.includes(layer) && <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
