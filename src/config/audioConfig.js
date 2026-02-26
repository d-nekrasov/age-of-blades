export const AUDIO_CONFIG = {
  defaults: {
    muted: false,
    channels: {
      music: 0.6,
      sfx: 0.8,
      ambience: 0.7,
    },
  },
  limits: {
    min: 0,
    max: 1,
    step: 0.1,
  },
  channelOrder: ['music', 'sfx', 'ambience'],
  channelLabels: {
    music: 'Music',
    sfx: 'SFX',
    ambience: 'Ambience',
  },
};
