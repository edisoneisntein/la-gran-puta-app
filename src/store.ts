import { create } from 'zustand';

interface Scene {
  title: string;
  prompt: string;
  duration: string;
  transitionHook?: string;
}

interface AppState {
  mode: 'video' | 'image' | 'map';
  setMode: (mode: 'video' | 'image' | 'map') => void;
  stylePreset: string;
  setStylePreset: (preset: string) => void;
  input: string;
  setInput: (input: string) => void;
  model: string;
  setModel: (model: string) => void;
  images: string[];
  addImages: (images: string[]) => void;
  removeImage: (index: number) => void;
  clearImages: () => void;
  videos: string[];
  addVideo: (video: string) => void;
  removeVideo: (index: number) => void;
  clearVideos: () => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  agentResponses: Record<string, string>;
  setAgentResponses: (responses: Record<string, string>) => void;
  finalPrompt: string;
  setFinalPrompt: (prompt: string) => void;
  scenes: Scene[];
  setScenes: (scenes: Scene[]) => void;
  generatedImageUrl: string | null;
  setGeneratedImageUrl: (url: string | null) => void;
  isGeneratingImage: boolean;
  setIsGeneratingImage: (isGenerating: boolean) => void;
  characterDNA: string;
  setCharacterDNA: (dna: string) => void;
  voiceLogic: string;
  setVoiceLogic: (logic: string) => void;
  motionLogic: string;
  setMotionLogic: (logic: string) => void;
  temporalLogic: string;
  setTemporalLogic: (logic: string) => void;
  mapNodes: any[];
  addMapNode: (node: any) => void;
  resetMap: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'video',
  setMode: (mode) => set({ mode }),
  stylePreset: '',
  setStylePreset: (stylePreset) => set({ stylePreset }),
  input: '',
  setInput: (input) => set({ input }),
  model: 'OpenAI Sora (V2 Full Release)',
  setModel: (model) => set({ model }),
  images: [],
  addImages: (newImages) => set((state) => ({ images: [...state.images, ...newImages] })),
  removeImage: (index) => set((state) => ({ images: state.images.filter((_, i) => i !== index) })),
  clearImages: () => set({ images: [] }),
  videos: [],
  addVideo: (video) => set((state) => ({ videos: [...state.videos, video] })),
  removeVideo: (index) => set((state) => ({ videos: state.videos.filter((_, i) => i !== index) })),
  clearVideos: () => set({ videos: [] }),
  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  agentResponses: {},
  setAgentResponses: (agentResponses) => set({ agentResponses }),
  finalPrompt: '',
  setFinalPrompt: (finalPrompt) => set({ finalPrompt }),
  scenes: [],
  setScenes: (scenes) => set({ scenes }),
  generatedImageUrl: null,
  setGeneratedImageUrl: (generatedImageUrl) => set({ generatedImageUrl }),
  isGeneratingImage: false,
  setIsGeneratingImage: (isGeneratingImage) => set({ isGeneratingImage }),
  characterDNA: '',
  setCharacterDNA: (characterDNA) => set({ characterDNA }),
  voiceLogic: '',
  setVoiceLogic: (voiceLogic) => set({ voiceLogic }),
  motionLogic: '',
  setMotionLogic: (motionLogic) => set({ motionLogic }),
  temporalLogic: '',
  setTemporalLogic: (temporalLogic) => set({ temporalLogic }),
  mapNodes: [
    { id: "CORE", group: 1, label: "NÚCLEO_VAULT" },
    { id: "TRUTH_01", group: 3, label: "LA_PRIMERA_VERDAD" },
    { id: "MEM_01", group: 2, label: "PRIMER_CONTACTO" },
    { id: "MEM_02", group: 2, label: "SEMILLA_ORIGEN" },
  ],
  addMapNode: (node) => set((state) => ({ mapNodes: [...state.mapNodes, node] })),
  resetMap: () => set({
    mapNodes: [
      { id: "CORE", group: 1, label: "NÚCLEO_VAULT" },
      { id: "TRUTH_01", group: 3, label: "LA_PRIMERA_VERDAD" },
      { id: "MEM_01", group: 2, label: "PRIMER_CONTACTO" },
      { id: "MEM_02", group: 2, label: "SEMILLA_ORIGEN" },
    ]
  }),
}));
