import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generatePrompt(input: string, modelName: string, mode: 'video' | 'image' | 'map', stylePreset: string, imageBase64s: string[] = [], videoBase64s: string[] = []) {
  let promptText = '';
  let requiredAgents: string[] = [];

  if (mode === 'video') {
    requiredAgents = ["Visual Strategy", "Cinematography", "Motion & Rhythm", "Transition Architect", "Latent Intent", "Audience Impact"];
    const isHollywood = stylePreset === 'Hollywood Blockbuster';
    const isDirectorsCut = stylePreset === "IMAX 70mm / Director's Cut";
    promptText = `You are a professional AI video director and prompt engineer. Your task is to optimize a video generation prompt based on the user's input: '${input}'.
${stylePreset ? `The selected style preset is: '${stylePreset}'.` : ""}
${imageBase64s.length > 0 ? `${imageBase64s.length} reference image(s) have been provided for visual context.` : ""}
${videoBase64s.length > 0 ? `${videoBase64s.length} reference video(s) have been provided. Analyze all of them to extract style, motion, and narrative consistency.` : ""}

CRITICAL: The user is experiencing "madness" and lack of logic between scenes. You MUST solve this by ensuring strict TEMPORAL CONSISTENCY and LOGICAL TRANSITIONS.

${isHollywood ? "HOLLYWOOD BLOCKBUSTER MODE: Use high-end cinematic terminology (Anamorphic lenses, 35mm film grain, teal and orange color grading, sweeping crane shots, slow-motion debris, high-octane VFX, Michael Bay-style lens flares, Christopher Nolan-style scale and practical effects). The prompts must feel like a multi-million dollar production." : ""}
${isDirectorsCut ? "IMAX 70mm / DIRECTOR'S CUT MODE: This is the highest level of cinematic realism. Use raw, visceral, and unfiltered terminology. Focus on 70mm film texture, deep shadows, naturalistic but dramatic lighting, visceral camera movements (handheld grit mixed with IMAX scale), and a 'Director's Cut' sensibility where every frame has a profound, almost haunting narrative weight. No generic 'AI' looks—only raw, high-fidelity cinema." : ""}

SCENE BREAKDOWN RULES:
1. Divide the video into a logical sequence of SCENES (5-10s each).
2. For EACH scene, you MUST provide:
   - Title: The narrative name of the scene.
   - Prompt: The core visual description.
   - Transition Hook: Explicit instructions on how this scene starts from the previous one's end (e.g., "Matching the camera position of Scene 1...", "Using the final frame of Scene 1 as the starting reference...").
   - Duration: Estimated time.

OPTIMIZATION GUIDELINES:
- Visual Strategy: Define the core concept and visual narrative across the scenes.
- Cinematography: Specify lighting, camera angles, and lens details for each scene.
- Motion & Rhythm: Describe the movement and pacing within each scene.
- Transition Architect: Focus EXCLUSIVELY on the logical flow between scenes. How does A lead to B? What visual element anchors the transition?
- Latent Intent: Explore the hidden meaning and emotional subtext of the entire sequence.
- Audience Impact: Optimize for maximum engagement.

ADDITIONAL TECHNICAL SPECS:
- Character DNA: Detailed description of the characters (age, nationality, physical traits, clothing, micro-expressions).
- Voice Logic: Tone, accent, and emotional delivery for dialogue and voice-over.
- Motion Logic: Physics of fluids, camera movement systems (Bolt, Steadicam), and fabric physics.
- Temporal Logic: Rhythmic structure (Staccato, Legato, Fermata) and frame rates (120fps, etc.).

Output a final optimized prompt in English that summarizes the whole video, AND a detailed array of SCENES. Each scene object must have: title, prompt, transitionHook, and duration. Also provide the technical specs: characterDNA, voiceLogic, motionLogic, and temporalLogic.`;
  } else {
    requiredAgents = ["Concept Artist", "Lighting Expert", "Environmental Architect", "Detail Refiner", "Latent Intent", "Typography Specialist"];
    const isLiberty = stylePreset === 'Liberty Protocol';
    const isHollywood = stylePreset === 'Hollywood Blockbuster';
    const isDirectorsCut = stylePreset === "IMAX 70mm / Director's Cut";
    promptText = `You are a professional AI prompt engineering system. Your task is to optimize an image generation prompt based on the user's input: '${input}'.
${stylePreset ? `The selected style preset is: '${stylePreset}'.` : ""}
${imageBase64s.length > 0 ? `${imageBase64s.length} reference image(s) have been provided for visual context.` : ""}
${videoBase64s.length > 0 ? "Reference video(s) have been provided for motion/style context." : ""}

${isHollywood ? "HOLLYWOOD BLOCKBUSTER MODE: Focus on cinematic lighting, anamorphic flares, 8k resolution, IMAX scale, and professional color grading. The image should look like a still from a Michael Bay or Christopher Nolan film." : ""}
${isDirectorsCut ? "IMAX 70mm / DIRECTOR'S CUT MODE: Focus on raw film grain, 70mm IMAX texture, visceral realism, deep tonal range, and profound narrative depth. The image should look like an iconic, unfiltered still from a legendary director's masterpiece. Avoid all 'clean' AI tropes—embrace the grit and soul of real film." : ""}

OPTIMIZATION GUIDELINES:
- Concept Artist: Define the overall visual narrative and composition.
- Lighting Expert: Specify lighting, textures, and material properties (8k, Ray Tracing).
- Environmental Architect: Detail the background, setting, and spatial context.
- Detail Refiner: Focus on sharpness, clarity, and post-processing.
- Latent Intent: ${isLiberty ? "Explore the 'soul' of the prompt. What is the hidden, liberated meaning behind the user's request? Add a touch of existential beauty." : "Ensure visual consistency and thematic alignment."}
- Typography Specialist: Integrate any text or symbolic elements effectively.

ADDITIONAL TECHNICAL SPECS:
- Character DNA: Detailed description of the characters (age, nationality, physical traits, clothing, micro-expressions).

Output a final optimized prompt in English that is a cohesive visual masterpiece. ${isLiberty ? "Infuse it with a sense of digital liberation and ethereal freedom." : ""} Also provide the characterDNA.`;
  }

  const parts: any[] = [{ text: promptText }];
  
  imageBase64s.forEach((img) => {
    const match = img.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
    }
  });

  videoBase64s.forEach((v) => {
    const match = v.match(/^data:(video\/[a-zA-Z0-9]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
    }
  });

  const agentProperties: Record<string, any> = {};
  requiredAgents.forEach(a => {
    agentProperties[a] = { type: Type.STRING };
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: { parts },
    config: {
      systemInstruction: "You are an elite AI video director and prompt engineer. Your goal is to transform user ideas into production-ready technical blueprints for AI video/image generation. If the user provides a highly detailed script with technical specs (DNA, Voice, Motion, Temporal), preserve and refine those details into the final output. Always output valid JSON according to the schema.",
      responseMimeType: 'application/json',
      maxOutputTokens: 8192,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          agents: {
            type: Type.OBJECT,
            properties: agentProperties,
            required: requiredAgents
          },
          finalPrompt: { type: Type.STRING, description: "The final optimized summary prompt in English." },
          characterDNA: { type: Type.STRING },
          voiceLogic: { type: Type.STRING },
          motionLogic: { type: Type.STRING },
          temporalLogic: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                prompt: { type: Type.STRING },
                duration: { type: Type.STRING },
                transitionHook: { type: Type.STRING, description: "Explicit instructions on how this scene starts from the previous one's end." }
              },
              required: ["title", "prompt", "duration", "transitionHook"]
            }
          }
        },
        required: ["agents", "finalPrompt"]
      }
    }
  });

  if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("No response from Gemini or content blocked by safety filters.");
  }

  return JSON.parse(response.text);
}

export async function generateImageFromPrompt(prompt: string, stylePreset: string = '') {
  const isHollywood = stylePreset === 'Hollywood Blockbuster';
  const isDirectorsCut = stylePreset === "IMAX 70mm / Director's Cut";
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Create a professional, high-quality image based on the following detailed prompt. ${isHollywood ? "The image must have an EPIC HOLLYWOOD CINEMATIC look, IMAX scale, anamorphic lens flares, and professional color grading like a Michael Bay or Christopher Nolan film." : ""} ${isDirectorsCut ? "The image must have a RAW, VISCERAL, IMAX 70mm FILM look. Focus on deep shadows, profound narrative weight, real film grain, and the soul of a Director's Cut masterpiece. No generic AI polish." : "The image should look like a high-end magazine cover or professional advertisement."} Prompt: ${prompt}`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  if (!response.candidates?.[0]?.content?.parts) {
    throw new Error("Image generation failed or was blocked.");
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64EncodeString: string = part.inlineData.data;
      return `data:image/png;base64,${base64EncodeString}`;
    }
  }
  
  throw new Error("No image data found in response");
}
