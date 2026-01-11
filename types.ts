
export type Emotion = 'neutral' | 'happy' | 'thinking' | 'sad' | 'angry' | 'surprised' | 'jealous' | 'caring';
export type HinataMood = 'soft' | 'friend' | 'normal' | 'strict' | 'girlfriend' | 'boyfriend';
export type MicrosoftTool = 'none' | 'excel' | 'word' | 'ppt' | 'video' | 'photo' | 'ocr' | 'image_gen' | 'pdf';
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type AIModel = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';
export type Persona = 'hinata' | 'kurama';

// Added RobotMood to fix import error in RobotCharacter.tsx
export enum RobotMood {
  NEUTRAL = 'neutral',
  SOFT = 'soft',
  STRICT = 'strict',
  THINKING = 'thinking',
  DANCING = 'dancing'
}

// Added SliderType to fix import errors in SidebarSliders and BottomSliders
export enum SliderType {
  NONE = 'none',
  PERSONA = 'persona',
  MICROSOFT = 'microsoft',
  TOOLS = 'tools',
  ALARM = 'alarm'
}

// Added PersonaMode to fix import error in SidebarSliders
export type PersonaMode = 'GF' | 'FRIEND' | 'NORMAL' | 'STRICT';

export interface ImageGenOptions {
  aspectRatio: AspectRatio;
  style: string;
  negativePrompt: string;
}

export interface PhotoEditSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  grayscale: number;
  hueRotate: number;
  blur: number;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  emotion?: Emotion;
  imageUrl?: string;
}

export interface Reminder {
  id: string;
  type: 'alarm' | 'sleep' | 'general';
  time: string;
  label: string;
  active: boolean;
  ringtone?: string;
}

export interface Keyframe {
  time: number;
  scale: number;
  opacity: number;
}

export interface ColorGrading {
  exposure: number;
  contrast: number;
  tint: number;
  temperature: number;
}

export interface VideoClip {
  id: string;
  url: string;
  isExtended: boolean;
  volume: number;
  startTrim: number;
  endTrim: number;
  transition: 'none' | 'fade' | 'wipe' | 'dissolve';
  colorGrading?: ColorGrading;
  keyframes?: Keyframe[];
}