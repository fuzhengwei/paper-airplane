/**
 * 视觉效果管理器
 * 管理爆炸、粒子、星空等视觉效果
 */
class VFXManager {
    constructor(scene) {
        this.scene = scene;
        this.W = scene.scale.width;
        this.H = scene.scale.height;
        
        // 星空背景
        this.starLayers = [];
        this.nebulas = [];
        this.clouds = [];
        
        // 粒子对象池（性能优化）
        this._particlePool = [];
        this._poolMaxSize = 100;
        
        // 帧计数器（用于降低更新频率）
        this._frameCount = 0;
        this._starUpdateInterval = 3;  // 每3帧更新一次星星
        this._nebulaUpdateInterval = 5; // 每5帧更新一次星云
        this._cloudUpdateInterval = 4;  // 每4帧更新一次云层
    }

    /**
     * 初始化星空背景
     */
    initStarfield() {
        this._createStarLayers();
        this._createNebulas();
        this._createClouds();
    }

    /**
     * 创建星空层
     */
    _createStarLayers() {
        STAR_CONFIG.LAYERS.forEach(layerConfig => {
            const layer = {
                objects: [],
                speed: layerConfig.speed,
                alphaRange: layerConfig.alpha,
            };

            for (let i = 0; i < layerConfig.count; i++) {
                const star = this.scene.add.image(
                    Math.random() * this.W,
                    Math.random() * this.H,
                    'dot'
                )
                    .setAlpha(layerConfig.alpha[0] + Math.random() * (layerConfig.alpha[1] - layerConfig.alpha[0]))
                    .setScale(layerConfig.scale[0] + Math.random() * (layerConfig.scale[1] - layerConfig.scale[0]))
                    .setDepth(UI_CONFIG.DEPTH.BACKGROUND);

                layer.objects.push(star);
            }

            this.starLayers.push(layer);
        });
    }

    /**
     * 创建星云
     */
    _createNebulas() {
        for (let i = 0; i < STAR_CONFIG.NEBULA_COUNT; i++) {
            const nebula = this.scene.add.graphics()
                .setDepth(UI_CONFIG.DEPTH.BACKGROUND)
                .setAlpha(STAR_CONFIG.NEBULA_ALPHA[0] + Math.random() * (STAR_CONFIG.NEBULA_ALPHA[1] - STAR_CONFIG.NEBULA_ALPHA[0]));

            const color = STAR_CONFIG.NEBULA_COLORS[i % STAR_CONFIG.NEBULA_COLORS.length];
            nebula.fillStyle(color, 1);
            nebula.fillEllipse(
                Math.random() * this.W,
                Math.random() * this.H,
                STAR_CONFIG.NEBULA_SIZE.width[0] + Math.random() * (STAR_CONFIG.NEBULA_SIZE.width[1] - STAR_CONFIG.NEBULA_SIZE.width[0]),
                STAR_CONFIG.NEBULA_SIZE.height[0] + Math.random() * (STAR_CONFIG.NEBULA_SIZE.height[1] - STAR_CONFIG.NEBULA_SIZE.height[0])
            );

            nebula._speed = 0.02 + Math.random() * 0.04;
            this.nebulas.push(nebula);
        }
    }

    /**
     * 创建云层
     */
    _createClouds() {
        for (let i = 0; i < STAR_CONFIG.CLOUD_COUNT; i++) {
            const cloud = this.scene.add.graphics()
                .setDepth(UI_CONFIG.DEPTH.CLOUDS);

            cloud.fillStyle(0xffffff, STAR_CONFIG.CLOUD_ALPHA[0] + Math.random() * (STAR_CONFIG.CLOUD_ALPHA[1] - STAR_CONFIG.CLOUD_ALPHA[0]));
            cloud.fillEllipse(
                Math.random() * this.W,
                Math.random() * this.H,
                STAR_CONFIG.CLOUD_SIZE.width[0] + Math.random() * (STAR_CONFIG.CLOUD_SIZE.width[1] - STAR_CONFIG.CLOUD_SIZE.width[0]),
                STAR_CONFIG.CLOUD_SIZE.height[0] + Math.random() * (STAR_CONFIG.CLOUD_SIZE.height[1] - STAR_CONFIG.CLOUD_SIZE.height[0])
            );

            cloud._speed = 0.08 + Math.random() * 0.15;
            this.clouds.push(cloud);
        }
    }

    /**
     * 更新星空动画（优化版本：降低更新频率）
     * @param {number} time - 当前时间
     * @param {number} gameSpeed - 游戏速度
     */
    updateStarfield(time, gameSpeed) {
        this._frameCount++;
        
        // 更新星星（每3帧更新一次）
        if (this._frameCount % this._starUpdateInterval === 0) {
            this.starLayers.forEach(layer => {
                layer.objects.forEach(star => {
                    star.y += layer.speed * gameSpeed * this._starUpdateInterval;
                    
                    if (star.y > this.H + 5) {
                        star.y = -5;
                        star.x = Math.random() * this.W;
                    }
                    
                    // 闪烁效果
                    star.setAlpha(
                        (layer.alphaRange[0] + 0.15 * Math.sin(time * 0.002 + star.x * 0.015)) * 0.7 + 0.3
                    );
                });
            });
        }

        // 更新星云（每5帧更新一次）
        if (this._frameCount % this._nebulaUpdateInterval === 0) {
            this.nebulas.forEach(nebula => {
                nebula.y += nebula._speed * gameSpeed * this._nebulaUpdateInterval;
                if (nebula.y > this.H + 100) {
                    nebula.y = -80;
                    nebula.x = Math.random() * this.W;
                }
            });
        }

        // 更新云层（每4帧更新一次）
        if (this._frameCount % this._cloudUpdateInterval === 0) {
            this.clouds.forEach(cloud => {
                cloud.y += cloud._speed * gameSpeed * this._cloudUpdateInterval;
                if (cloud.y > this.H + 60) {
                    cloud.y = -40;
                    cloud.x = Math.random() * this.W;
                }
            });
        }
    }

    /**
     * 从对象池获取粒子
     * @returns {Phaser.GameObjects.Image|null} 粒子对象
     */
    _getParticleFromPool() {
        // 尝试从池中获取非活跃粒子
        for (let i = 0; i < this._particlePool.length; i++) {
            const particle = this._particlePool[i];
            if (!particle.active) {
                particle.setActive(true).setVisible(true).setAlpha(1);
                return particle;
            }
        }
        
        // 池未满时创建新粒子
        if (this._particlePool.length < this._poolMaxSize) {
            const particle = this.scene.add.image(0, 0, 'dot')
                .setDepth(UI_CONFIG.DEPTH.EFFECTS)
                .setActive(false)
                .setVisible(false);
            this._particlePool.push(particle);
            return particle;
        }
        
        return null;
    }

    /**
     * 回收粒子到对象池
     * @param {Phaser.GameObjects.Image} particle - 粒子对象
     */
    _recycleParticleToPool(particle) {
        particle.setActive(false)
            .setVisible(false)
            .setAlpha(0)
            .setScale(1)
            .clearTint();
        if (particle.tween) {
            particle.tween.stop();
            particle.tween = null;
        }
    }

    /**
     * 创建爆炸效果（使用对象池）
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} count - 粒子数量
     */
    createExplosion(x, y, count = 13) {
        for (let i = 0; i < count; i++) {
            const particle = this._getParticleFromPool();
            if (!particle) return; // 对象池已满
            
            particle.setPosition(x, y)
                .setScale(Phaser.Math.FloatBetween(VFX_CONFIG.EXPLOSION_SCALE[0], VFX_CONFIG.EXPLOSION_SCALE[1]))
                .setTint(Phaser.Utils.Array.GetRandom(COLORS.EXPLOSION))
                .setDepth(UI_CONFIG.DEPTH.EFFECTS)
                .setAlpha(1);

            const angle = Math.random() * Math.PI * 2;
            const distance = Phaser.Math.Between(VFX_CONFIG.EXPLOSION_DISTANCE[0], VFX_CONFIG.EXPLOSION_DISTANCE[1]);

            particle.tween = this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                scale: 0,
                alpha: 0,
                duration: Phaser.Math.Between(VFX_CONFIG.EXPLOSION_DURATION[0], VFX_CONFIG.EXPLOSION_DURATION[1]),
                onComplete: () => {
                    this._recycleParticleToPool(particle);
                },
            });
        }
    }

    /**
     * 创建尾焰效果（使用对象池）
     * @param {number} x - 玩家 X
     * @param {number} y - 玩家 Y
     */
    createTrail(x, y) {
        const particle = this._getParticleFromPool();
        if (!particle) return;
        
        particle.setPosition(
            x + Phaser.Math.Between(-4, 4),
            y + VFX_CONFIG.TRAIL_OFFSET_Y
        )
            .setDepth(UI_CONFIG.DEPTH.EFFECTS - 5)
            .setScale(Phaser.Math.FloatBetween(0.2, 0.55))
            .setAlpha(0.8)
            .setTint(Phaser.Utils.Array.GetRandom(COLORS.FIRE));

        particle.tween = this.scene.tweens.add({
            targets: particle,
            y: particle.y + Phaser.Math.Between(12, 38),
            alpha: 0,
            scale: 0,
            duration: Phaser.Math.Between(VFX_CONFIG.TRAIL_LIFETIME[0], VFX_CONFIG.TRAIL_LIFETIME[1]),
            onComplete: () => {
                this._recycleParticleToPool(particle);
            },
        });
    }

    /**
     * 创建连击光环
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     */
    createComboRing(x, y) {
        this.scene.cameras.main.shake(80, 0.003);
        
        const ring = this.scene.add.graphics().setDepth(UI_CONFIG.DEPTH.EFFECTS + 50);
        ring.lineStyle(2, COLORS.WARNING, 0.6);
        ring.strokeCircle(x, y, 20);
        
        this.scene.tweens.add({
            targets: ring,
            alpha: 0,
            scale: 4,
            duration: 600,
            onComplete: () => ring.destroy(),
        });
    }

    /**
     * 创建 Boss 击杀特效
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     */
    createBossKillEffect(x, y) {
        this.createExplosion(x, y, 30);
        
        this.scene.cameras.main.shake(250, 0.015);
        
        const flash = this.scene.add.graphics()
            .setDepth(UI_CONFIG.DEPTH.PAUSE)
            .fillStyle(0xffffff, 0.25)
            .fillRect(0, 0, this.W, this.H);
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            onComplete: () => flash.destroy(),
        });
    }

    /**
     * 创建玩家死亡特效
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     */
    createPlayerDeathEffect(x, y) {
        this.createExplosion(x, y, 28);
    }

    /**
     * 获取对象池状态（用于调试）
     */
    getPoolStats() {
        const activeCount = this._particlePool.filter(p => p.active).length;
        return {
            total: this._particlePool.length,
            active: activeCount,
            idle: this._particlePool.length - activeCount,
            maxSize: this._poolMaxSize,
        };
    }

    /**
     * 销毁管理器
     */
    destroy() {
        // 清理对象池
        this._particlePool.forEach(particle => {
            if (particle.tween) particle.tween.stop();
            particle.destroy();
        });
        this._particlePool = [];
        
        this.starLayers = [];
        this.nebulas = [];
        this.clouds = [];
    }
}
