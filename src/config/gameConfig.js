import Phaser from 'phaser';
import { PHYSICS_CONFIG } from './physicsConfig.js';
import { BootScene } from '../scenes/BootScene.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { GameScene } from '../scenes/GameScene.js';

export const GAME_CONFIG = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 1280,
  height: 720,
  backgroundColor: '#0e141b',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: PHYSICS_CONFIG.gravityY },
      debug: PHYSICS_CONFIG.debug,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    gamepad: true,
  },
  scene: [BootScene, MenuScene, GameScene],
};
