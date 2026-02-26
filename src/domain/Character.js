import Phaser from 'phaser';

const LOCKED_STATES = new Set(['attack', 'hit', 'death']);

export class Character {
  constructor(scene, audioSystem, config) {
    this.scene = scene;
    this.audioSystem = audioSystem;
    this.config = config;

    this.state = 'idle';
    this.dead = false;

    this.sprite = null;
    this.attackCooldownUntil = 0;
    this.hitCooldownUntil = 0;
    this.wasGrounded = false;

    this.#createSprite();
    this.#ensureAnimations();
    this.#enterState('idle');
  }

  static preload(scene, config) {
    for (const [state, sheet] of Object.entries(config.assets.sprites)) {
      scene.load.spritesheet(sheet.key, sheet.url, {
        frameWidth: sheet.frame.width,
        frameHeight: sheet.frame.height,
      });
    }

    for (const [action, sfx] of Object.entries(config.assets.actionSfx)) {
      if (!sfx?.key || !sfx?.url) {
        continue;
      }

      if (!scene.cache.audio.exists(sfx.key)) {
        scene.load.audio(sfx.key, [sfx.url]);
      }
    }
  }

  getGameObject() {
    return this.sprite;
  }

  getState() {
    return this.state;
  }

  isDead() {
    return this.dead;
  }

  update(input) {
    if (!this.sprite || !this.sprite.body || this.dead) {
      return;
    }

    const now = this.scene.time.now;
    const body = this.sprite.body;
    const controls = this.config.controls;
    const physics = this.config.physics;

    if (input.attackPressed) {
      this.attack();
    }

    if (!this.#isLocked(now)) {
      if (input.moveAxis < -controls.moveDeadZone) {
        body.setVelocityX(-physics.moveSpeed);
      } else if (input.moveAxis > controls.moveDeadZone) {
        body.setVelocityX(physics.moveSpeed);
      } else {
        body.setVelocityX(0);
      }
    }

    if (input.jumpPressed && this.isGrounded() && !this.#isLocked(now)) {
      body.setVelocityY(-physics.jumpVelocity);
      this.playActionSfx('jump');
      this.#enterState('jump');
    }

    this.#resolveMovementState(now);
    this.#stabilizeLandingHeight();
  }

  attack() {
    if (this.dead || this.state === 'attack') {
      return false;
    }

    const now = this.scene.time.now;
    if (now < this.attackCooldownUntil || !this.isGrounded() || this.#isLocked(now)) {
      return false;
    }

    this.attackCooldownUntil = now + this.config.timing.attackCooldownMs;
    this.playActionSfx('attack');
    this.#enterState('attack');
    return true;
  }

  takeHit({ shouldDie = false } = {}) {
    if (this.dead) {
      return;
    }

    if (shouldDie) {
      this.die();
      return;
    }

    this.hitCooldownUntil = this.scene.time.now + this.config.timing.hitRecoverMs;
    this.playActionSfx('hit');
    this.#enterState('hit');
  }

  die() {
    if (this.dead) {
      return;
    }

    this.dead = true;
    this.playActionSfx('death');
    this.#enterState('death');
    this.sprite.body.setVelocity(0, 0);
  }

  faceTarget(targetX) {
    if (!this.sprite || this.dead) {
      return;
    }

    this.sprite.setFlipX(targetX < this.sprite.x);
  }

  playActionSfx(action) {
    const sfxConfig = this.config.assets.actionSfx[action];
    if (!sfxConfig?.key || !this.audioSystem) {
      return;
    }

    this.audioSystem.play(sfxConfig.key, {
      channel: sfxConfig.channel ?? 'sfx',
      allowMultiple: Boolean(sfxConfig.allowMultiple),
      restartIfPlaying: Boolean(sfxConfig.restartIfPlaying),
    });
  }

  #createSprite() {
    const { spawn, scale, assets, physics } = this.config;
    const idleTexture = assets.sprites.idle.key;

    this.sprite = this.scene.physics.add.sprite(spawn.x, spawn.y, idleTexture, 0);
    this.sprite.setScale(scale);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);

    this.sprite.body.setSize(physics.body.width, physics.body.height);
    this.sprite.body.setOffset(physics.body.offsetX, physics.body.offsetY);
    this.sprite.body.setMaxVelocity(physics.maxVelocityX, physics.maxVelocityY);
    this.sprite.body.setDragX(physics.dragX);
    this.wasGrounded = this.isGrounded();
  }

  #ensureAnimations() {
    const { animations } = this.config;

    for (const [state, animationConfig] of Object.entries(animations)) {
      if (this.scene.anims.exists(animationConfig.key)) {
        continue;
      }

      this.scene.anims.create({
        key: animationConfig.key,
        frames: this.scene.anims.generateFrameNumbers(animationConfig.texture, {
          start: animationConfig.startFrame,
          end: animationConfig.endFrame,
        }),
        frameRate: animationConfig.frameRate,
        repeat: animationConfig.repeat,
      });
    }
  }

  #resolveMovementState(now) {
    if (!this.sprite || !this.sprite.body) {
      return;
    }

    if (this.state === 'death') {
      return;
    }

    if (this.#isLocked(now)) {
      return;
    }

    const body = this.sprite.body;
    if (!this.isGrounded()) {
      if (body.velocity.y < 0) {
        this.#enterState('jump');
      } else {
        this.#enterState('fall');
      }
      return;
    }

    if (Math.abs(body.velocity.x) > this.config.controls.runThreshold) {
      this.#enterState('run');
    } else {
      this.#enterState('idle');
    }
  }

  #isLocked(now) {
    if (!LOCKED_STATES.has(this.state)) {
      return false;
    }

    if (this.state === 'attack') {
      return now < this.attackCooldownUntil;
    }

    if (this.state === 'hit') {
      return now < this.hitCooldownUntil;
    }

    return this.state === 'death';
  }

  #enterState(nextState) {
    if (this.state === nextState && this.sprite.anims.currentAnim) {
      return;
    }

    this.state = nextState;
    const animationConfig = this.config.animations[nextState];
    if (!animationConfig) {
      return;
    }

    this.sprite.play(animationConfig.key, true);
    if (nextState === 'death') {
      this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.sprite.body.enable = false;
      });
    }
  }

  isGrounded() {
    if (!this.sprite || !this.sprite.body) {
      return false;
    }

    const body = this.sprite.body;
    return body.blocked.down || body.touching.down;
  }

  #stabilizeLandingHeight() {
    const groundedNow = this.isGrounded();
    if (groundedNow && !this.wasGrounded) {
      this.sprite.y = this.config.spawn.y;
    }

    this.wasGrounded = groundedNow;
  }
}
