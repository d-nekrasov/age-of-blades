import Phaser from 'phaser';
import { AudioSystem } from '../systems/AudioSystem.js';
import { Map } from '../domain/Map.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.audioSystem = null;
    this.map = null;
    this.player = null;
    this.cursors = null;
    this.jumpKey = null;
    this.menuKey = null;
  }

  create() {
    this.audioSystem = new AudioSystem(this);
    const settings = this.registry.get('audio') || AudioSystem.readSettings();
    this.audioSystem.setSettings(settings);

    this.map = new Map(this, this.audioSystem).create();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.disposeSceneState());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.disposeSceneState());

    this.player = this.add.rectangle(200, 560, 70, 120, 0xf97316);
    this.physics.add.existing(this.player);

    const body = this.player.body;
    body.setCollideWorldBounds(true);
    body.setSize(70, 120);
    this.physics.world.setBounds(0, 0, 1280, 720);
    this.physics.add.collider(this.player, this.map.getCollisionBodies());

    this.cursors = this.input.keyboard.createCursorKeys();
    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.menuKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.add
      .text(20, 20, 'Game Scene (Scaffold)\nMove: Left/Right\nJump: Space\nEsc: Menu', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#e2e8f0',
      })
      .setDepth(10);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.menuKey)) {
      this.scene.start('MenuScene');
      return;
    }

    const body = this.player.body;
    const speed = 260;

    if (this.cursors.left.isDown) {
      body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(speed);
    } else {
      body.setVelocityX(0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.jumpKey) && body.blocked.down) {
      body.setVelocityY(-620);
    }
  }

  disposeSceneState() {
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }

    if (this.audioSystem) {
      this.audioSystem.destroy();
      this.audioSystem = null;
    }
  }
}
