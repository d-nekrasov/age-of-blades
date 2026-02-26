import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.player = null;
    this.cursors = null;
    this.jumpKey = null;
    this.menuKey = null;
  }

  create() {
    this.add.rectangle(640, 360, 1280, 720, 0x1e293b).setOrigin(0.5);
    this.add.rectangle(640, 680, 1280, 80, 0x475569).setOrigin(0.5);

    this.player = this.add.rectangle(200, 560, 70, 120, 0xf97316);
    this.physics.add.existing(this.player);

    const body = this.player.body;
    body.setCollideWorldBounds(true);
    body.setSize(70, 120);

    const ground = this.add.rectangle(640, 690, 1280, 60, 0x334155).setOrigin(0.5);
    this.physics.add.existing(ground, true);

    this.physics.add.collider(this.player, ground);

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
}
