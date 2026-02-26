import { AUDIO_CONFIG } from '../config/audioConfig.js';

const STORAGE_KEY = 'age-of-blades-audio';
const CHANNELS = AUDIO_CONFIG.channelOrder;

export class AudioSystem {
  constructor(scene) {
    this.scene = scene;
    this.sound = scene.sound;
    this.instances = new Map();
    this.settings = AudioSystem.readSettings();
  }

  static readSettings() {
    const defaults = AUDIO_CONFIG.defaults;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return this.#cloneDefaults();
      }

      const parsed = JSON.parse(raw);
      return this.#normalizeSettings(parsed, defaults);
    } catch {
      return this.#cloneDefaults();
    }
  }

  static writeSettings(values) {
    const payload = this.#normalizeSettings(values, AUDIO_CONFIG.defaults);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  }

  static #normalizeSettings(values, defaults) {
    const fallbackChannels = defaults.channels;
    const nextChannels = {};

    for (const channel of CHANNELS) {
      const fallback = fallbackChannels[channel];
      const mappedLegacy = channel === 'sfx' ? values?.mapSfxVolume : undefined;
      const legacy = channel === 'music' ? values?.musicVolume : mappedLegacy;
      const current = values?.channels?.[channel] ?? values?.[`${channel}Volume`] ?? legacy;
      nextChannels[channel] = this.#clamp(current, fallback);
    }

    return {
      muted: Boolean(values?.muted),
      channels: nextChannels,
    };
  }

  static #cloneDefaults() {
    return {
      muted: AUDIO_CONFIG.defaults.muted,
      channels: { ...AUDIO_CONFIG.defaults.channels },
    };
  }

  static #clamp(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return fallback;
    }

    return Math.min(AUDIO_CONFIG.limits.max, Math.max(AUDIO_CONFIG.limits.min, n));
  }

  setSettings(nextSettings) {
    this.settings = AudioSystem.writeSettings(nextSettings);
    this.applySettingsToActiveSounds();
    return this.settings;
  }

  getSettings() {
    return {
      muted: this.settings.muted,
      channels: { ...this.settings.channels },
    };
  }

  setMuted(muted) {
    return this.setSettings({ ...this.settings, muted: Boolean(muted) });
  }

  setChannelVolume(channel, volume) {
    if (!CHANNELS.includes(channel)) {
      return this.getSettings();
    }

    return this.setSettings({
      ...this.settings,
      channels: {
        ...this.settings.channels,
        [channel]: volume,
      },
    });
  }

  play(key, options = {}) {
    if (!key || !this.sound) {
      return null;
    }

    if (!this.scene.cache.audio.exists(key)) {
      return null;
    }

    const {
      channel = 'sfx',
      loop = false,
      detune = 0,
      rate = 1,
      allowMultiple = false,
    } = options;

    const safeChannel = CHANNELS.includes(channel) ? channel : 'sfx';
    const instanceKey = allowMultiple ? `${safeChannel}:${key}:${performance.now()}` : `${safeChannel}:${key}`;
    const existing = this.instances.get(instanceKey);

    if (existing?.isPlaying) {
      if (!allowMultiple) {
        return existing;
      }
    }

    if (existing && !existing.isPlaying) {
      existing.destroy();
      this.instances.delete(instanceKey);
    }

    const sound = this.sound.add(key, {
      loop,
      detune,
      rate,
      volume: this.#effectiveVolume(safeChannel),
    });

    this.instances.set(instanceKey, sound);
    if (allowMultiple) {
      sound.once('complete', () => {
        sound.destroy();
        this.instances.delete(instanceKey);
      });
    }
    sound.play();

    return sound;
  }

  stop(key, channel = 'sfx') {
    const safeChannel = CHANNELS.includes(channel) ? channel : 'sfx';
    const instanceKey = `${safeChannel}:${key}`;
    const sound = this.instances.get(instanceKey);
    if (!sound) {
      return;
    }

    if (sound.isPlaying) {
      sound.stop();
    }

    sound.destroy();
    this.instances.delete(instanceKey);
  }

  stopAll() {
    for (const [instanceKey, sound] of this.instances.entries()) {
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.destroy();
      this.instances.delete(instanceKey);
    }
  }

  applySettingsToActiveSounds() {
    for (const [instanceKey, sound] of this.instances.entries()) {
      const [channel] = instanceKey.split(':');
      if (!CHANNELS.includes(channel)) {
        continue;
      }

      sound.setVolume(this.#effectiveVolume(channel));
    }
  }

  destroy() {
    this.stopAll();
  }

  #effectiveVolume(channel) {
    if (this.settings.muted) {
      return 0;
    }

    return this.settings.channels[channel] ?? AUDIO_CONFIG.defaults.channels[channel] ?? 1;
  }
}
