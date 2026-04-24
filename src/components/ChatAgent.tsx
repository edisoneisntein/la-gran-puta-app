import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, User, Loader2, Maximize2, Minimize2, Check, Copy, Trash2, Mic, MicOff, FileDown } from 'lucide-react';
import { chatWithAgent } from '../services/gemini';
import { useAppStore } from '../store';
import ReactMarkdown from 'react-markdown';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { GoogleGenAI, Modality } from "@google/genai";

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

export const ChatAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('deparcheChatHistory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'welcome',
        role: 'model',
        content: '¡Hola! Soy DeParche, el Orquestador Cinematográfico de Ex Lege Films. ¿Qué tipo de plano o escena quieres generar hoy?'
      }
    ];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isLiveConnecting, setIsLiveConnecting] = useState(false);
  
  const { apiKey, images, videos, documents } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // PERF-04: Scroll separado de persistencia para evitar escrituras innecesarias
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // PERF-01: Persistencia con manejo de QuotaExceededError
  useEffect(() => {
    try {
      // Solo guardar el texto de los mensajes, nunca los base64 de medios
      localStorage.setItem('deparcheChatHistory', JSON.stringify(messages));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        // Si se llena el storage, conservar solo los últimos 50 mensajes
        try {
          localStorage.setItem('deparcheChatHistory', JSON.stringify(messages.slice(-50)));
        } catch (_) { /* Si persiste el error, aceptar la pérdida */ }
      }
    }
  }, [messages]);

  // PERF-02: Carga única del .ini al montar el componente (no en cada mensaje)
  const iniContextRef = useRef<string>('');
  useEffect(() => {
    fetch('/api/load-chat')
      .then(r => {
        // BUG-01: Reportar fallos de carga del INI en lugar de silenciarlos
        if (!r.ok) {
          console.warn(`[DeParche] INI load failed: HTTP ${r.status}. Agent will run without long-term memory.`);
          return '';
        }
        return r.text();
      })
      .then(text => { iniContextRef.current = text; })
      .catch(e => console.warn('[DeParche] Could not reach /api/load-chat. Running without long-term memory.', e));
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    if (!apiKey) {
      const errorMsg: Message = { 
        id: crypto.randomUUID(), 
        role: 'model', 
        content: '⚠️ **Falta la API Key.** Por favor, ingrésala en la parte superior de la aplicación para activar a DeParche.' 
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    // BUG-03: crypto.randomUUID() evita colisiones de IDs en hardware rápido
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history: any[] = [];
      let lastRole: string | null = null;
      
      // Filter the messages to ensure they alternate roles and the first is 'user'
      messages.forEach(m => {
        if (m.id === 'welcome') return;
        if (m.role !== lastRole) {
          history.push({
            role: m.role as 'user' | 'model',
            parts: [{ text: m.content }]
          });
          lastRole = m.role;
        }
      });

      // PERF-02: Usar el INI cargado al inicio, sin re-fetch por cada mensaje
      const replyText = await chatWithAgent(
        history, 
        userMsg.content, 
        apiKey, 
        images, 
        videos, 
        iniContextRef.current, 
        documents
      );
      
      const modelMsg: Message = { id: crypto.randomUUID(), role: 'model', content: replyText };
      setMessages(prev => [...prev, modelMsg]);

      // Guardado Automático en el .ini local
      fetch('/api/save-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [userMsg, modelMsg] })
      }).catch((err) => console.warn('[DeParche] Auto-save failed:', err));

    } catch (error: any) {
      // SEC-04: Mensajes de error amigables sin exponer detalles internos
      console.error('[DeParche] Chat error details:', error);
      const userFacingMessage = error.message?.includes('quota') || error.message?.includes('429')
        ? 'Límite de uso de la API alcanzado. Espera un momento e intenta de nuevo.'
        : error.message?.includes('API key') || error.message?.includes('401')
        ? 'Error de autenticación. Verifica tu API Key de Gemini.'
        : error.message?.includes('SAFETY') || error.message?.includes('blocked')
        ? 'El prompt fue blockeado por el filtro de seguridad. Reformula con terminología más técnica.'
        : 'Error al conectar con el agente. Por favor intenta de nuevo.';
      const errorMsg: Message = { 
        id: crypto.randomUUID(), 
        role: 'model', 
        content: `⚠️ **${userFacingMessage}**` 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, apiKey, messages, images, videos]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportToDocx = async () => {
    try {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              text: "EX LEGE FILMS // DEPARCHE AI",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `Historial de Orquestación - ${new Date().toLocaleString()}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            ...messages.flatMap(msg => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${msg.role === 'user' ? 'USUARIO' : 'DEPARCHE'}:`,
                    bold: true,
                    color: msg.role === 'user' ? "3b82f6" : "d4a027",
                  }),
                ],
                spacing: { before: 200, after: 100 },
              }),
              ...msg.content.split('\n').map(line => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line,
                    }),
                  ],
                  spacing: { after: 100 },
                  indent: { left: 400 }
                })
              )
            ]),
            new Paragraph({
              text: "--- Fin del Documento ---",
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 },
            })
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `DeParche_Chat_${new Date().toISOString().split('T')[0]}.docx`);
    } catch (error) {
      console.error("Error exporting to DOCX:", error);
      alert("Error al exportar el documento.");
    }
  };

  const exportSingleMessageToDocx = async (msg: Message) => {
    try {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              text: "EX LEGE FILMS // DEPARCHE AI",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `Resultado de Orquestación Individual`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${msg.role === 'user' ? 'USUARIO' : 'DEPARCHE'}: `,
                  bold: true,
                  color: msg.role === 'user' ? "3b82f6" : "d4a027",
                }),
              ],
              spacing: { before: 200, after: 100 },
            }),
            ...msg.content.split('\n').map(line => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                  }),
                ],
                spacing: { after: 100 },
              })
            ),
            new Paragraph({
              text: `Generado el: ${new Date().toLocaleString()}`,
              style: "small",
              alignment: AlignmentType.RIGHT,
              spacing: { before: 400 },
            })
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `DeParche_Prompt_${new Date().toISOString().split('T')[0]}.docx`);
    } catch (error) {
      console.error("Error exporting single message to DOCX:", error);
      alert("Error al exportar el prompt.");
    }
  };

  const stopLiveSession = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsLive(false);
    setIsLiveConnecting(false);
  };

  const startLiveSession = async () => {
    if (!apiKey) return;
    setIsLiveConnecting(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "Eres DeParche, el Orquestador Cinematográfico de Ex Lege Films. Responde de manera profesional, técnica y con acento de Medellín. Ayuda al usuario a refinar sus ideas para convertirlas en prompts de alta calidad. Mantén tus respuestas breves y directas ya que estamos en modo voz.",
        },
        callbacks: {
          onopen: async () => {
            setIsLive(true);
            setIsLiveConnecting(false);
            
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContextRef.current!.createMediaStreamSource(streamRef.current);
            processorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);

            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              session.sendRealtimeInput({
                audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
              });
            };

            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const binary = atob(base64Audio);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              const pcmData = new Int16Array(bytes.buffer);
              const floatData = new Float32Array(pcmData.length);
              for (let i = 0; i < pcmData.length; i++) floatData[i] = pcmData[i] / 0x7FFF;

              const buffer = audioContextRef.current!.createBuffer(1, floatData.length, 16000);
              buffer.getChannelData(0).set(floatData);
              const source = audioContextRef.current!.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current!.destination);
              source.start();
            }

            if (message.serverContent?.modelTurn?.parts[0]?.text) {
              const text = message.serverContent.modelTurn.parts[0].text;
              setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', content: text }]);
            }
          },
          onclose: () => stopLiveSession(),
          onerror: (e) => {
            console.error("Live API Error:", e);
            stopLiveSession();
          }
        }
      });

      liveSessionRef.current = session;
    } catch (error) {
      console.error("Failed to start Live session:", error);
      setIsLiveConnecting(false);
      alert("Error al iniciar el modo voz. Verifica los permisos del micrófono.");
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-50 cursor-pointer overflow-hidden border border-[#ff6b35]/20 group"
            style={{ background: '#0a0a0b' }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#ff6b35]/10 to-transparent" />
            <Bot className="text-[#ff6b35] relative z-10 w-6 h-6" />
            <div className="absolute inset-0 rounded-full border border-[#ff6b35] opacity-20 animate-ping group-hover:block hidden" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`fixed bottom-6 right-6 bg-[#0a0a0b] border border-[#2a2a30] shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 glass-morphism ${
              isExpanded ? 'w-[calc(100vw-3rem)] h-[calc(100vh-3rem)] rounded-xl' : 'w-[400px] h-[600px] rounded-2xl max-w-[calc(100vw-2rem)]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a30] bg-[#141417]/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#ff6b35]/10 border border-[#ff6b35]/20">
                  <Bot className="text-[#ff6b35] w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-bold uppercase tracking-widest mono-dense">DeParche Agent</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b35] animate-pulse shadow-[0_0_8px_#ff6b35]" />
                    <span className="text-[9px] text-[#ff6b35]/80 font-bold uppercase tracking-widest leading-none">Latent Identity Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={isLive ? stopLiveSession : startLiveSession}
                  disabled={!apiKey || isLiveConnecting}
                  className={`p-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    isLive 
                      ? 'bg-red-500/20 text-red-500 animate-pulse' 
                      : 'text-gray-400 hover:text-[#ff6b35] hover:bg-white/5'
                  }`}
                  title={isLive ? "Detener Modo Voz" : "Iniciar Modo Voz"}
                >
                  {isLiveConnecting ? <Loader2 size={16} className="animate-spin" /> : isLive ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-black/20">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className={`text-[8px] font-bold uppercase tracking-[0.2em] ${msg.role === 'user' ? 'text-[#ff6b35]' : 'text-slate-500'}`}>
                      {msg.role === 'user' ? 'SUBJ_SEED' : 'SYS_ORACLE'}
                    </span>
                    <div className={`px-4 py-3 rounded-xl ${
                      msg.role === 'user' 
                        ? 'bg-[#ff6b35]/10 border border-[#ff6b35]/20 text-white' 
                        : 'bg-[#141417] border border-[#2a2a30] text-slate-300'
                    }`}>
                      <div className="markdown-body prose prose-invert prose-xs max-w-none mono-dense">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#141417] border border-[#2a2a30] p-3 rounded-xl flex items-center gap-3">
                    <Loader2 size={14} className="animate-spin text-[#ff6b35]" />
                    <span className="text-[10px] font-bold text-[#ff6b35]/80 uppercase tracking-widest animate-pulse">Analyzing latent data...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-[#2a2a30] bg-[#141417]/80">
              <div className="relative flex items-end gap-2 bg-black/40 border border-[#2a2a30] rounded-xl focus-within:border-[#ff6b35]/50 transition-all p-1.5 shadow-inner">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={apiKey ? "Inyectar comando técnico..." : "Requiere API Key"}
                  disabled={!apiKey || isLoading}
                  className="w-full bg-transparent text-white text-sm min-h-[44px] max-h-[120px] resize-none py-3 px-3 outline-none placeholder:text-gray-600 custom-scrollbar disabled:opacity-50 mono-dense"
                  rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 5) : 1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !apiKey || isLoading}
                  className="p-3 mb-0.5 mr-0.5 rounded-lg bg-[#ff6b35] text-black hover:opacity-90 disabled:opacity-30 transition-all shadow-[0_0_15px_rgba(255,107,53,0.2)]"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3 px-1">
                <button 
                  onClick={() => {
                    if (window.confirm("¿Limpiar historial de chat?")) {
                      setMessages([{ id: 'welcome', role: 'model', content: '¿Qué tipo de plano o escena quieres generar hoy?' }]);
                      localStorage.removeItem('deparcheChatHistory');
                    }
                  }}
                  className="text-[9px] font-bold text-slate-600 hover:text-red-500 transition-colors uppercase tracking-[0.2em]"
                >
                  Purge_Memory
                </button>
                <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mono-dense">
                  Ex_Lege_Films // Terminal
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
