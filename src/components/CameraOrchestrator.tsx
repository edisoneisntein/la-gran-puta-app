import React from 'react';
import { useAppStore } from '../store';
import { Compass, Thermometer, ZoomIn, Camera, Aperture } from 'lucide-react';

export const CameraOrchestrator: React.FC = () => {
  const { shotParameters, setShotParameters } = useAppStore();

  const handleChange = (key: keyof typeof shotParameters, value: number) => {
    setShotParameters({ [key]: value });
  };

  const cameraCode = `[CAM]: R${shotParameters.azimuth}_E${shotParameters.elevation}_Z${shotParameters.zoom}x_f${shotParameters.fStop}_${shotParameters.focalLength}mm`;

  return (
    <div className="brutal-card p-4 glass-morphism space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
          <Camera size={14} /> Camera Orchestrator
        </h3>
        <div className="mono-dense text-[10px] text-accent/80 bg-accent/10 px-2 py-0.5 rounded">
          {cameraCode}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-tighter text-slate-500 flex items-center gap-1">
            <Compass size={10} /> Azimuth (0-360°)
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={shotParameters.azimuth}
            onChange={(e) => handleChange('azimuth', Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="mono-dense text-xs text-right">{shotParameters.azimuth}°</div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-tighter text-slate-500 flex items-center gap-1">
            <Thermometer size={10} /> Elevation (-30 - 90°)
          </label>
          <input
            type="range"
            min="-30"
            max="90"
            value={shotParameters.elevation}
            onChange={(e) => handleChange('elevation', Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="mono-dense text-xs text-right">{shotParameters.elevation}°</div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-tighter text-slate-500 flex items-center gap-1">
            <ZoomIn size={10} /> Zoom (0.5-20x)
          </label>
          <input
            type="range"
            min="0.5"
            max="20"
            step="0.1"
            value={shotParameters.zoom}
            onChange={(e) => handleChange('zoom', Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="mono-dense text-xs text-right">{shotParameters.zoom}x</div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-tighter text-slate-500 flex items-center gap-1">
            <Aperture size={10} /> f-stop (1.2-22)
          </label>
          <input
            type="range"
            min="1.2"
            max="22"
            step="0.1"
            value={shotParameters.fStop}
            onChange={(e) => handleChange('fStop', Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="mono-dense text-xs text-right">f/{shotParameters.fStop}</div>
        </div>

        <div className="col-span-2 space-y-2">
          <label className="text-[10px] uppercase tracking-tighter text-slate-500">Focal Length (12-300mm)</label>
          <input
            type="range"
            min="12"
            max="300"
            value={shotParameters.focalLength}
            onChange={(e) => handleChange('focalLength', Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="mono-dense text-xs text-right">{shotParameters.focalLength}mm</div>
        </div>
      </div>
    </div>
  );
};
