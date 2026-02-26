import Phaser from 'phaser';
import { createTextButton } from '../ui/MenuUI.js';
import { AUDIO_CONFIG } from '../config/audioConfig.js';
import { AudioSystem } from '../systems/AudioSystem.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.audioSystem = null;
  }

  create() {
    this.audioSystem = new AudioSystem(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.disposeAudio());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.disposeAudio());
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const title = this.add
      .text(centerX, centerY - 170, 'AGE OF BLADES', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#f2f7ff',
      })
      .setOrigin(0.5);

    title.setShadow(0, 8, '#020617', 10);

    createTextButton(this, {
      label: 'Start',
      x: centerX,
      y: centerY - 20,
      onClick: () => this.scene.start('GameScene'),
    });

    this.createVolumeControls(centerX, centerY + 100);

    this.add
      .text(centerX, this.scale.height - 40, 'Controls in game: Arrow Keys + Space | Esc to Menu', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#95a3b8',
      })
      .setOrigin(0.5);
  }

  createVolumeControls(centerX, startY) {
    const settings = this.registry.get('audio') || AudioSystem.readSettings();
    this.audioSystem.setSettings(settings);

    const muteLabel = this.add.text(centerX - 220, startY - 60, '', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#cbd5e1',
    });

    const channelLabels = new Map();
    AUDIO_CONFIG.channelOrder.forEach((channel, index) => {
      const label = this.add.text(centerX - 220, startY + index * 50, '', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#cbd5e1',
      });
      channelLabels.set(channel, label);
    });

    const updateLabels = (currentSettings) => {
      muteLabel.setText(`Sound: ${currentSettings.muted ? 'Off' : 'On'}`);
      AUDIO_CONFIG.channelOrder.forEach((channel) => {
        const label = channelLabels.get(channel);
        const title = AUDIO_CONFIG.channelLabels[channel];
        const percent = Math.round((currentSettings.channels[channel] || 0) * 100);
        label.setText(`${title}: ${percent}%`);
      });
    };

    const step = AUDIO_CONFIG.limits.step;

    createTextButton(this, {
      label: 'Toggle Sound',
      x: centerX + 140,
      y: startY - 45,
      onClick: () => {
        const next = this.audioSystem.setMuted(!this.audioSystem.getSettings().muted);
        this.persistAudioSettings(next);
        updateLabels(next);
      },
    }).setScale(0.55);

    AUDIO_CONFIG.channelOrder.forEach((channel, index) => {
      const y = startY + index * 50 + 15;

      createTextButton(this, {
        label: '-',
        x: centerX + 160,
        y,
        onClick: () => {
          const current = this.audioSystem.getSettings();
          const nextValue = Math.max(AUDIO_CONFIG.limits.min, current.channels[channel] - step);
          const next = this.audioSystem.setChannelVolume(channel, nextValue);
          this.persistAudioSettings(next);
          updateLabels(next);
        },
      }).setScale(0.7);

      createTextButton(this, {
        label: '+',
        x: centerX + 220,
        y,
        onClick: () => {
          const current = this.audioSystem.getSettings();
          const nextValue = Math.min(AUDIO_CONFIG.limits.max, current.channels[channel] + step);
          const next = this.audioSystem.setChannelVolume(channel, nextValue);
          this.persistAudioSettings(next);
          updateLabels(next);
        },
      }).setScale(0.7);
    });

    updateLabels(this.audioSystem.getSettings());
  }

  persistAudioSettings(settings) {
    this.registry.set('audio', settings);
  }

  disposeAudio() {
    if (this.audioSystem) {
      this.audioSystem.destroy();
      this.audioSystem = null;
    }
  }
}
