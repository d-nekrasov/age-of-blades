import Phaser from 'phaser';
import { AudioSystem } from '../systems/AudioSystem.js';
import { Map } from '../domain/Map.js';
import { Character } from '../domain/Character.js';
import { CHARACTER_CONFIG } from '../config/characterConfig.js';
import { MAP_CONFIG } from '../config/mapConfig.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.audioSystem = null;
    this.map = null;
    this.player = null;
    this.enemy = null;
    this.cursors = null;
    this.jumpKey = null;
    this.attackKey = null;
    this.menuKey = null;
    this.connectedPad = null;
  }

  create() {
    this.audioSystem = new AudioSystem(this);
    const settings = this.registry.get('audio') || AudioSystem.readSettings();
    this.audioSystem.setSettings(settings);

    this.map = new Map(this, this.audioSystem).create();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.disposeSceneState());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.disposeSceneState());

    this.physics.world.setBounds(0, 0, MAP_CONFIG.world.width, MAP_CONFIG.world.height);

    this.player = new Character(this, this.audioSystem, CHARACTER_CONFIG.hero);
    this.enemy = new Character(this, this.audioSystem, CHARACTER_CONFIG.enemy);

    const collisions = this.map.getCollisionBodies();
    this.physics.add.collider(this.player.getGameObject(), collisions);
    this.physics.add.collider(this.enemy.getGameObject(), collisions);
    this.physics.add.collider(this.player.getGameObject(), this.enemy.getGameObject());

    this.cursors = this.input.keyboard.createCursorKeys();
    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.KEY_F);
    this.menuKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.input.gamepad.once('connected', (pad) => {
      this.connectedPad = pad;
    });

    this.add
      .text(20, 20, 'Move: Left/Right or Gamepad LS\nJump: Space or Gamepad A\nAttack: F or Gamepad X\nEsc: Menu', {
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

    const pad = this.connectedPad ?? this.input.gamepad.getPad(0);
    if (pad) {
      this.connectedPad = pad;
    }

    const keyboardAxis = (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0);
    const padAxis = this.connectedPad ? this.connectedPad.leftStick.x : 0;
    const moveAxis = Math.abs(padAxis) > Math.abs(keyboardAxis) ? padAxis : keyboardAxis;

    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.jumpKey) ||
      Boolean(this.connectedPad && Phaser.Input.Gamepad.JustDown(this.connectedPad, 0));

    const attackPressed =
      Phaser.Input.Keyboard.JustDown(this.attackKey) ||
      Boolean(this.connectedPad && Phaser.Input.Gamepad.JustDown(this.connectedPad, 2));

    this.player.update({
      moveAxis,
      jumpPressed,
      attackPressed,
    });

    this.enemy.update({
      moveAxis: 0,
      jumpPressed: false,
      attackPressed: false,
    });

    const playerSprite = this.player.getGameObject();
    const enemySprite = this.enemy.getGameObject();
    this.player.faceTarget(enemySprite.x);
    this.enemy.faceTarget(playerSprite.x);
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

    this.player = null;
    this.enemy = null;
    this.connectedPad = null;
  }
}
