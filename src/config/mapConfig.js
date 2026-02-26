export const MAP_CONFIG = {
  key: 'forest-night',
  world: {
    width: 1280,
    height: 720,
  },
  assets: {
    background: {
      key: 'map-forest-bg',
      url: '/fighting-game/assets/sprites/background.png',
    },
    music: {
      key: 'map-forest-music',
      url: '/fighting-game/assets/sound/bg/grimyth - Nocturnis Stronghold.wav',
    },
    ambience: {
      key: 'map-forest-rain-ambience',
      url: '/fighting-game/assets/sound/bg/FarBeyond Studio - Atmos - Rain (CC-BY).ogg',
    },
    rainParticleTextureKey: 'rain-drop',
  },
  background: {
    fallbackColor: 0x0b1220,
    overlayColor: 0x05080f,
    overlayAlpha: 0.42,
    depth: -50,
  },
  collision: {
    ground: {
      x: 640,
      y: 690,
      width: 1280,
      height: 60,
    },
    boundaries: {
      left: {
        x: -16,
        y: 360,
        width: 32,
        height: 720,
      },
      right: {
        x: 1296,
        y: 360,
        width: 32,
        height: 720,
      },
      top: {
        x: 640,
        y: -16,
        width: 1280,
        height: 32,
      },
    },
    debugColor: 0x334155,
    debugAlpha: 0.95,
    debugVisible: true,
  },
  rain: {
    enabled: true,
    depth: 20,
    quantity: 3,
    frequency: 35,
    speedY: { min: 850, max: 1150 },
    speedX: { min: -60, max: -20 },
    angle: { min: 98, max: 110 },
    lifespan: 900,
    alpha: { start: 0.45, end: 0.08 },
    scale: { start: 0.8, end: 0.2 },
  },
  audio: {
    music: {
      channel: 'mapMusic',
      loop: true,
      volume: 1,
    },
    ambience: {
      channel: 'mapAmbience',
      loop: true,
      volume: 1,
    },
  },
};
