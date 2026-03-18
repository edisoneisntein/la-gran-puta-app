import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Video, Image as ImageIcon, Network, Info } from 'lucide-react';

interface GuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Guide: React.FC<GuideProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-950 border border-slate-800 w-full max-w-2xl overflow-hidden shadow-2xl rounded-2xl"
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">USER_GUIDE</h2>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">System Documentation v1.0</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3 h-3" /> System Overview
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Welcome to Neural Manifest. This platform is designed to optimize your creative inputs into highly effective prompts for AI image and video generation models. Our multi-agent system analyzes your seed and expands it with technical specifications and artistic direction.
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <Video className="w-5 h-5 text-blue-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">VIDEO_MODE</h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Generate cinematic scripts for models like Runway Gen-3 or Sora. Optimized for temporal flow and motion.
                  </p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">IMAGE_MODE</h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Create detailed visual prompts and generate high-quality image previews for your concepts.
                  </p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <Network className="w-5 h-5 text-blue-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">NEURAL_MAP</h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Visualize your prompt history. Each generated concept is saved as a node in your local session map.
                  </p>
                </div>
              </div>

              <section className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <p className="text-[11px] text-blue-300 italic text-center">
                  "Efficiency in creation through structured intelligence."
                </p>
              </section>
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-colors rounded-lg"
              >
                CLOSE
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
