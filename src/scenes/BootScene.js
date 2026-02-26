import Phaser from 'phaser';
import { AudioSystem } from '../systems/AudioSystem.js';
import { MAP_CONFIG } from '../config/mapConfig.js';
import { CHARACTER_CONFIG } from '../config/characterConfig.js';
import { Character } from '../domain/Character.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Booting...', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#f2f7ff',
      })
      .setOrigin(0.5);

    const { background, music, ambience } = MAP_CONFIG.assets;
    this.load.image(background.key, background.url);
    this.load.audio(music.key, [music.url]);
    this.load.audio(ambience.key, [ambience.url]);

    Character.preload(this, CHARACTER_CONFIG.hero);
    Character.preload(this, CHARACTER_CONFIG.enemy);
  }

  create() {
    const settings = AudioSystem.readSettings();
    this.registry.set('audio', settings);
    this.scene.start('MenuScene');
  }
}
