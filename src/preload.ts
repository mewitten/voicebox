/**
 * Preload script — runs in renderer context with access to Node.js APIs.
 * Exposes a safe, typed API surface to the renderer via contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron';

export type TTSEngine = 'system' | 'elevenlabs' | 'openai' | 'azure';

export interface SpeakOptions {
  text: string;
  engine?: TTSEngine;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface VoiceboxAPI {
  speak: (options: SpeakOptions) => Promise<void>;
  stop: () => Promise<void>;
  getVoices: (engine?: TTSEngine) => Promise<string[]>;
  getEngines: () => Promise<TTSEngine[]>;
  onSpeakStart: (cb: () => void) => () => void;
  onSpeakEnd: (cb: () => void) => () => void;
  onSpeakError: (cb: (err: string) => void) => () => void;
  getSettings: () => Promise<Record<string, unknown>>;
  saveSettings: (settings: Record<string, unknown>) => Promise<void>;
}

const voicebox: VoiceboxAPI = {
  speak: (options) => ipcRenderer.invoke('tts:speak', options),

  stop: () => ipcRenderer.invoke('tts:stop'),

  getVoices: (engine) => ipcRenderer.invoke('tts:get-voices', engine),

  getEngines: () => ipcRenderer.invoke('tts:get-engines'),

  onSpeakStart: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('tts:speak-start', handler);
    return () => ipcRenderer.removeListener('tts:speak-start', handler);
  },

  onSpeakEnd: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('tts:speak-end', handler);
    return () => ipcRenderer.removeListener('tts:speak-end', handler);
  },

  onSpeakError: (cb) => {
    const handler = (_event: Electron.IpcRendererEvent, err: string) => cb(err);
    ipcRenderer.on('tts:speak-error', handler);
    return () => ipcRenderer.removeListener('tts:speak-error', handler);
  },

  getSettings: () => ipcRenderer.invoke('settings:get'),

  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
};

contextBridge.exposeInMainWorld('voicebox', voicebox);
