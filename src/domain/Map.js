import { MAP_CONFIG } from '../config/mapConfig.js';

export class Map {
  constructor(scene, audioSystem, config = MAP_CONFIG) {
    this.scene = scene;
    this.audioSystem = audioSystem;
    this.config = config;

    this.background = null;
    this.overlay = null;
    this.ground = null;
    this.boundaries = [];
    this.rainEmitter = null;
  }

  create() {
    this.#createBackground();
    this.#createCollision();
    this.#createRain();
    this.playAudio();

    return this;
  }

  getGroundBody() {
    return this.ground;
  }

  getCollisionBodies() {
    return [this.ground, ...this.boundaries].filter(Boolean);
  }

  playAudio() {
    if (!this.audioSystem) {
      return;
    }

    const musicKey = this.config.assets.music.key;
    const ambienceKey = this.config.assets.ambience.key;

    this.audioSystem.play(musicKey, {
      channel: this.config.audio.music.channel,
      loop: this.config.audio.music.loop,
    });

    this.audioSystem.play(ambienceKey, {
      channel: this.config.audio.ambience.channel,
      loop: this.config.audio.ambience.loop,
    });
  }

  stopAudio() {
    if (!this.audioSystem) {
      return;
    }

    this.audioSystem.stop(this.config.assets.music.key, this.config.audio.music.channel);
    this.audioSystem.stop(this.config.assets.ambience.key, this.config.audio.ambience.channel);
  }

  destroy() {
    this.stopAudio();

    if (this.rainEmitter) {
      this.rainEmitter.stop();
      this.rainEmitter.destroy();
      this.rainEmitter = null;
    }

    this.background?.destroy();
    this.overlay?.destroy();
    this.ground?.destroy();

    for (const boundary of this.boundaries) {
      boundary.destroy();
    }

    this.background = null;
    this.overlay = null;
    this.ground = null;
    this.boundaries = [];
  }

  #createBackground() {
    const { background, assets, world } = this.config;
    const bgKey = assets.background.key;

    if (this.scene.textures.exists(bgKey)) {
      this.background = this.scene.add
        .image(world.width / 2, world.height / 2, bgKey)
        .setDisplaySize(world.width, world.height)
        .setDepth(background.depth);
    } else {
      this.background = this.scene.add
        .rectangle(
          world.width / 2,
          world.height / 2,
          world.width,
          world.height,
          background.fallbackColor,
          1,
        )
        .setDepth(background.depth);
    }

    this.overlay = this.scene.add
      .rectangle(
        world.width / 2,
        world.height / 2,
        world.width,
        world.height,
        background.overlayColor,
        background.overlayAlpha,
      )
      .setDepth(background.depth + 1);
  }

  #createCollision() {
    const { ground, boundaries, debugColor, debugAlpha, debugVisible } = this.config.collision;

    this.ground = this.scene.add
      .rectangle(ground.x, ground.y, ground.width, ground.height, debugColor, debugAlpha)
      .setVisible(debugVisible);
    this.scene.physics.add.existing(this.ground, true);

    this.boundaries = Object.values(boundaries).map((shape) => {
      const boundary = this.scene.add
        .rectangle(shape.x, shape.y, shape.width, shape.height, debugColor, debugAlpha)
        .setVisible(debugVisible);
      this.scene.physics.add.existing(boundary, true);
      return boundary;
    });
  }

  #createRain() {
    if (!this.config.rain.enabled || this.rainEmitter) {
      return;
    }

    const textureKey = this.config.assets.rainParticleTextureKey;
    if (!this.scene.textures.exists(textureKey)) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xc7deff, 1);
      graphics.fillRect(0, 0, 2, 14);
      graphics.generateTexture(textureKey, 2, 14);
      graphics.destroy();
    }

    this.rainEmitter = this.scene.add.particles(0, 0, textureKey, {
      x: { min: -20, max: this.config.world.width + 20 },
      y: -20,
      quantity: this.config.rain.quantity,
      frequency: this.config.rain.frequency,
      speedY: this.config.rain.speedY,
      speedX: this.config.rain.speedX,
      angle: this.config.rain.angle,
      lifespan: this.config.rain.lifespan,
      alpha: this.config.rain.alpha,
      scale: this.config.rain.scale,
    });

    this.rainEmitter.setDepth(this.config.rain.depth);
  }
}
