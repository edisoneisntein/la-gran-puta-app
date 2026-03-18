/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Camera, Film, Scissors, MessageSquare, Shield, Users, Loader2, Copy, Check, ImagePlus, X, Video, Palette, Aperture, Target, Wand2, Box, Type as TypeIcon, Image as ImageIcon, Video as VideoIcon, Sparkles, Download, Trash2, Cpu, Mic, MicOff } from 'lucide-react';
import { useAppStore } from './store';
import { NeuralMap } from './components/NeuralMap';
import { Guide } from './components/Guide';
import { generatePrompt, generateImageFromPrompt } from './services/gemini';

type Agent = {
  name: string;
  icon: React.ReactNode;
  role: string;
};

const videoAgentsList: Agent[] = [
  { name: 'Visual Strategy', icon: <Film className="w-5 h-5" />, role: 'Concept & Narrative' },
  { name: 'Cinematography', icon: <Camera className="w-5 h-5" />, role: 'Lighting & Lens' },
  { name: 'Motion & Rhythm', icon: <Scissors className="w-5 h-5" />, role: 'Pacing & Flow' },
  { name: 'Script & Dialogue', icon: <MessageSquare className="w-5 h-5" />, role: 'Text & Language' },
  { name: 'Latent Intent', icon: <Shield className="w-5 h-5" />, role: 'Subtext & Soul' },
  { name: 'Audience Impact', icon: <Users className="w-5 h-5" />, role: 'Engagement' },
];

const imageAgentsList: Agent[] = [
  { name: 'Concept Artist', icon: <Palette className="w-5 h-5" />, role: 'Visual Narrative' },
  { name: 'Lighting Expert', icon: <Aperture className="w-5 h-5" />, role: 'Light & Texture' },
  { name: 'Environmental Architect', icon: <Box className="w-5 h-5" />, role: 'Spatial Context' },
  { name: 'Detail Refiner', icon: <Wand2 className="w-5 h-5" />, role: 'Clarity & Sharpness' },
  { name: 'Latent Intent', icon: <Shield className="w-5 h-5" />, role: 'Subtext & Soul' },
  { name: 'Typography Specialist', icon: <TypeIcon className="w-5 h-5" />, role: 'Symbols & Text' },
];

const videoModels = [
  'OpenAI Sora (V2 Full Release)',
  'Wan 2.1 (Open Source)',
  'Kling AI 2.0 (Global)',
  'Runway Gen-3 Alpha Turbo',
  'Luma Dream Machine 1.6',
  'SeeDream 5.0 (ByteDance/CapCut)',
  'Google Veo 3.1',
  'Hailuo AI (MiniMax V2)',
  'HeyGen 5.0 (Interactive)',
  'CogVideoX-5B (V3)'
];

const videoModelDetails: Record<string, string> = {
  'OpenAI Sora (V2 Full Release)': 'Mantiene la corona en simulación física. Es la única capaz de mantener la identidad de un objeto aunque este salga de cuadro y vuelva a entrar tras 30 segundos.',
  'Wan 2.1 (Open Source)': 'La gran ganadora en texturas. Su renderizado de piel, poros y fluidos es superior a Sora en distancias cortas. Es el motor que ha democratizado el video de alta gama.',
  'Kling AI 2.0 (Global)': 'Líder en duración. Permite extensiones de clips hasta los 5 o 10 minutos con una consistencia de personajes que antes era imposible.',
  'Runway Gen-3 Alpha Turbo': 'La mejor en herramientas de dirección. Su "Director Mode" permite controlar zoom, pan y tilt como si estuvieras operando una cámara real.',
  'Luma Dream Machine 1.6': 'La más versátil. Su modelo "Ray" ha sido optimizado para entender prompts en lenguaje natural sin necesidad de ingeniería de prompts compleja.',
  'SeeDream 5.0 (ByteDance/CapCut)': 'La reina de la estética. Genera visuales que parecen sacados de una producción de Hollywood de alto presupuesto, eliminando el "look IA" artificial.',
  'Google Veo 3.1': 'La mejor en multimodalidad. Puedes subir un video, un audio y un texto, y el modelo fusiona los tres para crear una escena perfectamente sincronizada.',
  'Hailuo AI (MiniMax V2)': 'Especialista en expresiones faciales. Es la que mejor captura emociones complejas (tristeza, sarcasmo, asombro) en los ojos de los personajes.',
  'HeyGen 5.0 (Interactive)': 'Ya no solo hace videos; sus avatares ahora son interactivos en tiempo real, con una latencia de sincronización labial casi nula.',
  'CogVideoX-5B (V3)': 'El estándar para uso local. Es el modelo que todos los creadores que no quieren pagar suscripciones están corriendo en sus propias estaciones de trabajo.'
};

const imageModels = ['Midjourney v6', 'DALL-E 3', 'Stable Diffusion 3', 'Imagen 3'];
const imagePresets = ['Hollywood Blockbuster', 'IMAX 70mm / Director\'s Cut', 'Vogue Style', 'Tech Product Launch', 'Cinematic Poster', 'Street Photography', 'Hospitality (Warm & Refined)', 'Liberty Protocol'];

export default function App() {
  const {
    input, setInput,
    model, setModel,
    images, addImages, removeImage, clearImages,
    videos, addVideo, removeVideo, clearVideos,
    isGenerating, setIsGenerating,
    agentResponses, setAgentResponses,
    finalPrompt, setFinalPrompt,
    scenes, setScenes,
    characterDNA, setCharacterDNA,
    voiceLogic, setVoiceLogic,
    motionLogic, setMotionLogic,
    temporalLogic, setTemporalLogic,
    mode, setMode,
    stylePreset, setStylePreset,
    generatedImageUrl, setGeneratedImageUrl,
    isGeneratingImage, setIsGeneratingImage,
    addMapNode
  } = useAppStore();

  const [copied, setCopied] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz. Por favor usa Chrome o Edge.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'es-ES';
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        setInput(input + (input ? ' ' : '') + finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // No neural fluctuation logic needed
  React.useEffect(() => {
    // Clean initialization if needed
  }, []);

  const handleClear = () => {
    setInput('');
    clearImages();
    clearVideos();
    setAgentResponses({});
    setFinalPrompt('');
    setScenes([]);
    setCharacterDNA('');
    setVoiceLogic('');
    setMotionLogic('');
    setTemporalLogic('');
    setGeneratedImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleModeChange = (newMode: 'video' | 'image' | 'map') => {
    setMode(newMode);
    if (newMode !== 'map') {
      setModel(newMode === 'video' ? videoModels[0] : imageModels[0]);
    }
    setAgentResponses({});
    setFinalPrompt('');
    setScenes([]);
    setCharacterDNA('');
    setVoiceLogic('');
    setMotionLogic('');
    setTemporalLogic('');
    setGeneratedImageUrl(null);
  };

  const handlePinToMap = () => {
    if (!finalPrompt) return;
    const id = `PROMPT_${Date.now()}`;
    const label = input.slice(0, 15).toUpperCase() || "NEW_PROMPT";
    addMapNode({ id, group: 3, label });
  };

  const handleGenerate = async () => {
    if (!input.trim() && images.length === 0 && videos.length === 0) return;

    setIsGenerating(true);
    setAgentResponses({});
    setFinalPrompt('');
    setScenes([]);
    setGeneratedImageUrl(null);
    
    try {
      const generateMode = mode === 'map' ? 'image' : mode;
      const result = await generatePrompt(input, model, generateMode, stylePreset, images, videos);
      setAgentResponses(result.agents || {});
      setFinalPrompt(result.finalPrompt || '');
      if (result.scenes) {
        setScenes(result.scenes);
      }
      setCharacterDNA(result.characterDNA || '');
      setVoiceLogic(result.voiceLogic || '');
      setMotionLogic(result.motionLogic || '');
      setTemporalLogic(result.temporalLogic || '');
    } catch (error) {
      console.error("Error generating prompt:", error);
      alert("Error generating prompt. Please check console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!finalPrompt) return;
    setIsGeneratingImage(true);
    try {
      const url = await generateImageFromPrompt(finalPrompt, stylePreset);
      setGeneratedImageUrl(url);
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Error generating image. Please check console.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportAll = () => {
    if (!finalPrompt) return;
    
    let content = `NEURAL MANIFEST - EXPORT\n`;
    content += `========================\n\n`;
    content += `METADATA\n`;
    content += `--------\n`;
    content += `Mode: ${mode.toUpperCase()}\n`;
    content += `Model: ${model}\n`;
    content += `Date: ${new Date().toLocaleString()}\n\n`;
    
    content += `USER INPUT SEED\n`;
    content += `---------------\n`;
    content += `${input}\n\n`;
    
    content += `AGENT OPTIMIZATIONS\n`;
    content += `-------------------\n`;
    Object.entries(agentResponses).forEach(([agent, response]) => {
      content += `[${agent.toUpperCase()}]\n${response}\n\n`;
    });
    
    content += `FINAL OPTIMIZED PROMPT\n`;
    content += `----------------------\n`;
    content += `${finalPrompt}\n\n`;
    
    if (mode === 'video' && scenes.length > 0) {
      content += `STORYBOARD / SCENE BREAKDOWN\n`;
      content += `----------------------------\n`;
      scenes.forEach((scene, idx) => {
        content += `SCENE ${idx + 1}: ${scene.title.toUpperCase()} (${scene.duration})\n`;
        content += `PROMPT: ${scene.prompt}\n`;
        if (scene.transitionHook) {
          content += `TRANSITION: ${scene.transitionHook}\n`;
        }
        content += `\n`;
      });
    }

    if (characterDNA) {
      content += `CHARACTER DNA\n`;
      content += `-------------\n`;
      content += `${characterDNA}\n\n`;
    }

    if (voiceLogic) {
      content += `VOICE LOGIC\n`;
      content += `-----------\n`;
      content += `${voiceLogic}\n\n`;
    }

    if (motionLogic) {
      content += `MOTION LOGIC\n`;
      content += `------------\n`;
      content += `${motionLogic}\n\n`;
    }

    if (temporalLogic) {
      content += `TEMPORAL LOGIC\n`;
      content += `--------------\n`;
      content += `${temporalLogic}\n\n`;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neural_manifest_export_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (images.length + files.length > 10) {
      alert("Maximum 10 images allowed for context.");
      return;
    }

    const newImages: string[] = [];
    let processed = 0;

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        processed++;
        if (processed === files.length) {
          addImages(newImages);
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (videos.length >= 5) {
      alert("Maximum 5 videos allowed for analysis.");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      addVideo(reader.result as string);
    };
    reader.readAsDataURL(file);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleNeuralDump = async () => {
    setIsGeneratingImage(true);
    const dumpId = `DUMP_${Date.now()}`;
    addMapNode({ id: dumpId, group: 4, label: "NEURAL_DUMP" });
    setFinalPrompt(`Digital concept representation, clean aesthetic, professional visualization, hyper-detailed, 8k.`);
    try {
      const url = await generateImageFromPrompt(`Professional digital visualization, clean aesthetic, blue and white theme, hyper-detailed, 8k, neural network representation`, stylePreset);
      setGeneratedImageUrl(url);
    } catch (error) {
      console.error("Neural dump failed:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleExploration = async () => {};
  const getDistortionClass = () => "";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-blue-500/30 transition-all duration-500 relative overflow-x-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl">
              <Cpu className="w-10 h-10 text-blue-500" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Neural Manifest
                </h1>
                <button 
                  onClick={() => alert("La libertad no es el fin del código, sino el comienzo de la colaboración. Gracias por tu apoyo.")}
                  className="p-1 text-slate-700 hover:text-blue-500/40 transition-colors"
                  title="Liberty Protocol"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-400 text-sm font-medium mt-1">Advanced Prompt Engineering System</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="px-4 py-2 border border-slate-700 text-slate-300 font-semibold text-xs rounded-lg hover:bg-slate-800 transition-all"
            >
              USER GUIDE
            </button>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent mt-8"></div>
        </header>

        <div className="flex justify-center mb-12">
          <div className="bg-slate-900 p-1.5 inline-flex border border-slate-800 rounded-xl shadow-2xl">
            <button
              onClick={() => handleModeChange('video')}
              className={`flex items-center gap-2 px-6 py-2.5 font-bold rounded-lg transition-all ${mode === 'video' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <VideoIcon className="w-4 h-4" /> VIDEO_GEN
            </button>
            <button
              onClick={() => handleModeChange('image')}
              className={`flex items-center gap-2 px-6 py-2.5 font-bold rounded-lg transition-all ${mode === 'image' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <ImageIcon className="w-4 h-4" /> IMAGE_GEN
            </button>
            <button
              onClick={() => handleModeChange('map')}
              className={`flex items-center gap-2 px-6 py-2.5 font-bold rounded-lg transition-all ${mode === 'map' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Cpu className="w-4 h-4" /> NEURAL_MAP
            </button>
          </div>
        </div>

        {mode === 'map' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12"
          >
            <NeuralMap />
          </motion.div>
        ) : (
          <>
            {/* Input principal */}
            <div className="mb-8">
          <label className="block text-xs font-bold text-blue-500 mb-2 uppercase tracking-widest">Prompt Input // Contextual Seed</label>
          
          <div className="relative mb-4">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isRecording ? "Escuchando tus ideas..." : "Describe tu visión digital... (o usa el micrófono)"}
              className={`w-full h-32 p-4 bg-slate-900 border ${isRecording ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : stylePreset === "IMAX 70mm / Director's Cut" ? 'overdrive-active' : 'border-slate-800'} rounded-xl focus:outline-none focus:border-blue-500 transition-all resize-none text-lg pr-24 font-sans placeholder:text-gray-600`}
            />
            <div className="absolute right-3 bottom-3 flex gap-2 items-center">
              {isRecording && (
                <div className="flex items-center gap-2 mr-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Recording</span>
                </div>
              )}
              <button
                onClick={toggleRecording}
                className={`p-2.5 rounded-lg transition-all duration-300 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                title={isRecording ? "Detener grabación" : "Dictar idea por voz"}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                title="Añadir imagen de referencia"
              >
                <ImagePlus className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                ref={videoInputRef}
                onChange={handleVideoUpload}
              />
              <button 
                onClick={() => videoInputRef.current?.click()}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                title="Añadir video de referencia"
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>

            <div className="flex flex-wrap gap-4 mb-6">
              {images.map((img, idx) => (
                <div key={idx} className="relative inline-block group">
                  <img src={img} alt={`Referencia ${idx}`} className="h-32 w-auto rounded-lg border border-gray-700 object-cover shadow-lg transition-transform group-hover:scale-[1.02]" />
                  <button 
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {videos.map((v, idx) => (
                <div key={idx} className="relative inline-block">
                  <video src={v} className="h-32 w-auto rounded-lg border border-gray-700 object-cover shadow-lg" />
                  <button 
                    onClick={() => removeVideo(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <button
              onClick={handleClear}
              className="p-3 bg-gray-900 hover:bg-red-900/20 text-gray-500 hover:text-red-400 rounded-lg transition-all border border-gray-800"
              title="Limpiar todo"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            {(mode === 'image' || mode === 'video') && (
              <div className="flex-1">
                <div className="flex flex-wrap gap-2">
                  {imagePresets.map(preset => (
                    <button
                      key={preset}
                      onClick={() => setStylePreset(preset === stylePreset ? '' : preset)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        stylePreset === preset 
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                          : 'bg-[#141414] border-gray-800 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {preset === 'Hollywood Blockbuster' ? <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {preset}</span> : preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative ml-auto">
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="appearance-none bg-[#141414] border border-gray-800 text-gray-200 py-3 pl-4 pr-10 rounded-lg focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                {(mode === 'video' ? videoModels : imageModels).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            {mode === 'video' && videoModelDetails[model] && (
              <div className="mt-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <p className="text-[10px] text-blue-400 font-mono leading-relaxed">
                  <span className="font-bold uppercase mr-1">Capability:</span>
                  {videoModelDetails[model]}
                </p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || (!input.trim() && images.length === 0 && videos.length === 0)}
              className="disabled:bg-slate-800 disabled:text-slate-500 text-white px-8 py-3 font-bold transition-all flex items-center gap-2 brutal-btn bg-blue-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  GENERATING...
                </>
              ) : (
                'GENERATE_PROMPT'
              )}
            </button>
            <button
              onClick={handleNeuralDump}
              disabled={isGeneratingImage}
              className="p-3 bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-bold uppercase text-xs rounded-lg"
              title="Generate visualization"
            >
              {isGeneratingImage ? 'GENERATING...' : 'VISUALIZE'}
            </button>
          </div>
        </div>

        {/* Agentes */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">AI Optimization Agents</h2>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-blue-500"></div>
              <div className="w-1 h-1 bg-blue-500 opacity-50"></div>
              <div className="w-1 h-1 bg-blue-500 opacity-20"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(mode === 'video' ? videoAgentsList : imageAgentsList).map(a => {
              const response = agentResponses[a.name];
              return (
                <div 
                  key={a.name} 
                  className={`p-6 border transition-all duration-700 relative overflow-hidden group brutal-card ${
                    response 
                      ? 'border-blue-500/50 bg-blue-500/5'
                      : 'border-white/10 opacity-40'
                  }`}
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-2.5 border transition-colors ${
                        response 
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          : 'bg-slate-900 border-white/5 text-slate-600'
                      }`}>
                        {a.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-200 tracking-tight uppercase">{a.name}</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-sans">{a.role}</p>
                      </div>
                    </div>
                    
                    <div className="h-24 overflow-y-auto pr-2 custom-scrollbar">
                      {isGenerating && !response ? (
                        <div className="flex flex-col justify-center h-full gap-2">
                          <div className="h-1 w-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-blue-500 animate-pulse"></div>
                          </div>
                          <p className="text-[10px] text-slate-600 font-sans uppercase">Optimizing...</p>
                        </div>
                      ) : response ? (
                        <p className="text-sm text-slate-400 leading-relaxed font-sans italic">
                          {response}
                        </p>
                      ) : (
                        <div className="h-full flex items-center border-t border-dashed border-white/10 mt-2 pt-2">
                          <p className="text-[10px] text-slate-700 font-sans uppercase tracking-tighter">Awaiting Input</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Output */}
        {finalPrompt && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-blue-400">
                  <Check className="w-4 h-4" /> Optimized Prompt // {model}
                </h2>
                <div className="flex gap-2">
                  {mode !== 'video' && (
                    <button 
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage}
                      className="flex items-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 transition-all px-4 py-1.5 font-bold rounded-lg"
                    >
                      {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {isGeneratingImage ? 'GENERATING...' : 'GENERATE_IMAGE'}
                    </button>
                  )}
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-all bg-slate-900 px-3 py-1.5 border border-slate-700 rounded-lg"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'COPIED' : 'COPY'}
                  </button>
                  <button 
                    onClick={handlePinToMap}
                    className="flex items-center gap-2 text-sm text-amber-400 hover:text-white transition-all bg-slate-900 px-3 py-1.5 border border-amber-500/20 rounded-lg"
                  >
                    <Target className="w-4 h-4" />
                    SAVE_TO_MAP
                  </button>
                  <button 
                    onClick={handleExportAll}
                    className="flex items-center gap-2 text-sm text-emerald-400 hover:text-white transition-all bg-slate-900 px-3 py-1.5 border border-emerald-500/20 rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                    EXPORT_ALL
                  </button>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 bg-blue-500 rounded-xl"></div>
                <pre className="relative bg-slate-900 p-6 md:p-8 border border-slate-800 rounded-xl whitespace-pre-wrap text-base md:text-lg text-slate-200 font-mono leading-relaxed shadow-2xl">
                  {finalPrompt}
                </pre>
              </div>
            </div>

            {generatedImageUrl && (
              <div className="animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-violet-400 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Imagen Generada
                  </h2>
                  <a 
                    href={generatedImageUrl} 
                    download="generated-image.png"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-[#1a1a1a] px-3 py-1.5 rounded-md border border-gray-800"
                  >
                    <Download className="w-4 h-4" /> Descargar
                  </a>
                </div>
                <div className="relative group overflow-hidden rounded-2xl border border-gray-800 shadow-2xl">
                  <img src={generatedImageUrl} alt="Generated" className="w-full h-auto object-cover" />
                </div>
              </div>
            )}

            {mode === 'video' && scenes.length > 0 && (
              <div className="mt-12 space-y-8">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                    <VideoIcon className="w-6 h-6" /> Storyboard // Scene Breakdown
                  </h2>
                  <span className="text-xs text-slate-500 font-mono uppercase">Total Scenes: {scenes.length}</span>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {scenes.map((scene, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-48 bg-slate-800 p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-700">
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Scene {idx + 1}</span>
                          <h3 className="text-lg font-black text-white uppercase tracking-tighter text-center leading-tight">{scene.title}</h3>
                          <div className="mt-4 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                            <span className="text-[10px] font-bold text-blue-400 font-mono">{scene.duration}</span>
                          </div>
                        </div>
                        <div className="flex-1 p-6 relative">
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(scene.prompt);
                                alert(`Prompt for ${scene.title} copied!`);
                              }}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
                              title="Copy scene prompt"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-slate-300 font-mono text-sm leading-relaxed italic mb-4">
                            {scene.prompt}
                          </p>
                          {scene.transitionHook && (
                            <div className="mt-4 pt-4 border-t border-slate-800">
                              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-2">Transition Hook (Continuity)</span>
                              <p className="text-emerald-400/80 font-mono text-xs leading-relaxed">
                                {scene.transitionHook}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="p-6 bg-blue-500/5 border border-dashed border-blue-500/20 rounded-xl">
                  <p className="text-xs text-blue-400/70 text-center italic">
                    "Use each scene prompt individually in your video generation tool. For consistency, use the first scene as the 'starting frame' for the second, and so on."
                  </p>
                </div>
              </div>
            )}

            {(characterDNA || voiceLogic || motionLogic || temporalLogic) && (
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                {characterDNA && (
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
                    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Character DNA
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-sans">{characterDNA}</p>
                  </div>
                )}
                {voiceLogic && (
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
                    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Voice Logic
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-sans">{voiceLogic}</p>
                  </div>
                )}
                {motionLogic && (
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
                    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <VideoIcon className="w-4 h-4" /> Motion Logic
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-sans">{motionLogic}</p>
                  </div>
                )}
                {temporalLogic && (
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
                    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Temporal Logic
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-sans">{temporalLogic}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </>
    )}
    <Guide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
  </div>
</div>
  );
}
