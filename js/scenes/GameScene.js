/**
 * 游戏主场景
 * 使用管理器模式重构，提升可维护性
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        this.cameras.main.setBackgroundColor(COLORS.BG_HEX);

        // 读取设置
        this.gameSettings = DataStore.getSettings();
        this.diffMult = DIFFICULTY_CONFIG[this.gameSettings.difficulty] || DIFFICULTY_CONFIG.normal;

        // 初始化游戏状态
        this._initGameState();

        // 初始化管理器
        this._initManagers();

        // 初始化游戏对象
        this._initGameObjects();

        // 初始化暂停菜单
        this._initPauseMenu();

        // 显示新手教程
        this._showTutorial();
    }

    /**
     * 初始化游戏状态
     */
    _initGameState() {
        // 基础状态
        this.score = 0;
        this.kills = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.ammo = PLAYER_CONFIG.INITIAL_AMMO;
        this.hp = PLAYER_CONFIG.MAX_HP;
        this.dead = false;
        this.shootReady = true;
        this.lastEnemySpawn = 0;
        this.lastItemSpawn = 0;

        // 统计追踪
        this.maxCombo = 0;
        this.bossKills = 0;
        this.quizCorrect = 0;
        this.quizTotal = 0;
        this.gameStartTime = Date.now();
        this.lastHitTime = Date.now();

        // 道具效果
        this.spreadShots = 0;
        this.doubleScore = 0;
        this.doubleScoreTimer = 0;

        // 波次系统
        this.wave = 0;
        this.waveEnemyCount = 0;
        this.waveEnemyTotal = WAVE_CONFIG.INITIAL_ENEMIES;
        this.waveCooldown = false;

        // 成就追踪
        this.achChecked = new Set(DataStore.getAchievements());
        
        // 预计算敌机权重（性能优化）
        this._enemyWeightSum = [];
        let cumWeight = 0;
        for (const [key, config] of Object.entries(ENEMY_CONFIG.TYPES)) {
            cumWeight += config.weight;
            this._enemyWeightSum.push({ key, threshold: cumWeight });
        }
        
        // 预计算道具权重
        this._itemWeightSum = [];
        let cumItemWeight = 0;
        for (const [key, config] of Object.entries(ITEM_CONFIG.TYPES)) {
            cumItemWeight += config.weight;
            this._itemWeightSum.push({ key, threshold: cumItemWeight });
        }
        
        // 暂停的 tween 列表（用于答题暂停）
        this._pausedTweens = [];
    }

    /**
     * 初始化管理器
     */
    _initManagers() {
        // 音效管理器（传入完整音量设置）
        this.soundManager = new SoundManager({
            sound: this.gameSettings.sound,
            volume: this.gameSettings.volume || 0.7,
            sfxVolume: this.gameSettings.sfxVolume || 0.8,
        });

        // 视觉效果管理器
        this.vfxManager = new VFXManager(this);
        this.vfxManager.initStarfield();

        // 技能系统
        this.skillSystem = new SkillSystem(this);
        this.skillSystem.init();

        // 答题系统
        this.quizSystem = new QuizSystem(this);
        this.quizSystem.init((correct, delta) => this._onQuizAnswer(correct, delta));

        // UI 管理器
        this.uiManager = new UIManager(this);
        this.uiManager.init(this.gameSettings);

        // 输入管理器
        this.inputManager = new InputManager(this);
        this.inputManager.init({
            onShoot: () => this._shoot(),
            onSkillUse: (id) => this.skillSystem.useSkill(id, this._getSkillContext()),
            onPause: () => this._togglePause(),
        });
    }

    /**
     * 初始化游戏对象
     */
    _initGameObjects() {
        const W = this.scale.width;
        const H = this.scale.height;

        // 玩家
        this.player = this.physics.add.sprite(W / 2, H * 0.75, 'player');
        this.player.setCollideWorldBounds(true)
            .setDepth(UI_CONFIG.DEPTH.PLAYER)
            .setScale(PLAYER_CONFIG.SCALE);
        this.player.body.setSize(
            PLAYER_CONFIG.HITBOX.width,
            PLAYER_CONFIG.HITBOX.height
        ).setOffset(PLAYER_CONFIG.HITBOX.offsetX, PLAYER_CONFIG.HITBOX.offsetY);

        // 尾焰定时器
        this.trailTimer = this.time.addEvent({
            delay: VFX_CONFIG.TRAIL_INTERVAL,
            loop: true,
            callback: () => {
                if (!this.dead && this.player.active && !this.quizSystem.isActive()) {
                    this.vfxManager.createTrail(this.player.x, this.player.y);
                }
            },
        });

        // 物理组（使用对象池）
        this.bulletGroup = this.physics.add.group({ defaultKey: 'bullet', maxSize: BULLET_CONFIG.MAX_COUNT });
        this.enemyGroup = this.physics.add.group({ defaultKey: 'e0', maxSize: 30 });
        this.itemGroup = this.physics.add.group();
        this.bossBulletGroup = this.physics.add.group({ defaultKey: 'bossBullet', maxSize: 40 });

        // 碰撞检测
        this.physics.add.overlap(this.bulletGroup, this.enemyGroup, this._onBulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyGroup, this._onPlayerHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.itemGroup, this._onPlayerPickItem, null, this);
        this.physics.add.overlap(this.player, this.bossBulletGroup, this._onPlayerHitBossBullet, null, this);

        // 初始化 UI
        this.uiManager.updateHealth(this.hp);
        this.uiManager.updateAmmo(this.ammo);
    }

    /**
     * 初始化暂停菜单
     */
    _initPauseMenu() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.paused = false;
        this.pauseOverlay = this.add.container(0, 0)
            .setDepth(UI_CONFIG.DEPTH.PAUSE)
            .setVisible(false);

        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.72);
        bg.fillRect(0, 0, W, H);

        // 标题
        const title = this.add.text(W / 2, H * 0.28, '⏸️ 暂停', {
            fontSize: '32px',
            color: COLORS.ACCENT_HEX,
            fontStyle: 'bold',
            fontFamily: UI_CONFIG.FONT_FAMILY,
        }).setOrigin(0.5);

        // 按钮
        const buttons = [
            { text: '▶️ 继续游戏', y: H * 0.44, color: '#69f0ae', action: () => this._togglePause() },
            { text: '🔄 重新开始', y: H * 0.54, color: '#82b1ff', action: () => this._restartGame() },
            { text: '🏠 返回菜单', y: H * 0.64, color: '#ff8a80', action: () => this._returnToMenu() },
        ];

        buttons.forEach(btn => {
            const text = this.add.text(W / 2, btn.y, btn.text, {
                fontSize: '18px',
                color: btn.color,
                fontFamily: UI_CONFIG.FONT_FAMILY,
                fontStyle: 'bold',
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            text.on('pointerover', () => text.setColor(COLORS.ACCENT_HEX));
            text.on('pointerout', () => text.setColor(btn.color));
            text.on('pointerdown', btn.action);

            this.pauseOverlay.add(text);
        });

        this.pauseOverlay.add([bg, title]);
    }

    /**
     * 显示新手教程
     */
    _showTutorial() {
        const stats = DataStore.getStats();
        if (stats.games > 0) return;

        const W = this.scale.width;
        const H = this.scale.height;
        this.physics.pause();

        // 遮罩
        const mask = this.add.graphics()
            .setDepth(UI_CONFIG.DEPTH.TUTORIAL)
            .setAlpha(0);
        mask.fillStyle(0x000000, 0.85);
        mask.fillRect(0, 0, W, H);
        this.tweens.add({ targets: mask, alpha: 1, duration: 300 });

        // 标题
        const title = this.add.text(W / 2, H * 0.15, '📖 新手教程', {
            fontSize: '24px',
            color: COLORS.ACCENT_HEX,
            fontStyle: 'bold',
            fontFamily: UI_CONFIG.FONT_FAMILY,
        })
            .setOrigin(0.5)
            .setDepth(UI_CONFIG.DEPTH.TUTORIAL + 1)
            .setAlpha(0);
        this.tweens.add({ targets: title, alpha: 1, duration: 300, delay: 200 });

        // 教程内容
        const tutorials = [
            { icon: '🕹️', text: 'WASD / 方向键 移动' },
            { icon: '🔫', text: '空格 / 点击 射击' },
            { icon: '🛡️', text: 'E 键 激活护盾' },
            { icon: '💣', text: 'Q 键 释放炸弹' },
            { icon: '⏱️', text: 'R 键 时间减缓' },
            { icon: '❓', text: '答对问题获得子弹' },
            { icon: '💡', text: '靠近道具自动吸附' },
        ];

        tutorials.forEach((item, index) => {
            const y = H * 0.28 + index * 42;
            
            const icon = this.add.text(W * 0.25, y, item.icon, { fontSize: '20px' })
                .setOrigin(0.5)
                .setDepth(UI_CONFIG.DEPTH.TUTORIAL + 1)
                .setAlpha(0);
            
            const text = this.add.text(W * 0.55, y, item.text, {
                fontSize: '14px',
                color: '#e8eaf6',
                fontFamily: UI_CONFIG.FONT_FAMILY,
            })
                .setOrigin(0, 0.5)
                .setDepth(UI_CONFIG.DEPTH.TUTORIAL + 1)
                .setAlpha(0);

            this.tweens.add({
                targets: [icon, text],
                alpha: 1,
                duration: 200,
                delay: 400 + index * 100,
            });
        });

        // 开始按钮
        const startBtn = this.add.text(W / 2, H * 0.82, '🚀 开始游戏', {
            fontSize: '20px',
            fontFamily: UI_CONFIG.FONT_FAMILY,
            color: '#004d40',
            backgroundColor: '#18ffff',
            padding: { x: 30, y: 12 },
            fontStyle: 'bold',
        })
            .setOrigin(0.5)
            .setDepth(UI_CONFIG.DEPTH.TUTORIAL + 1)
            .setAlpha(0)
            .setInteractive({ useHandCursor: true });

        this.tweens.add({ targets: startBtn, alpha: 1, duration: 300, delay: 1200 });

        startBtn.on('pointerover', () => startBtn.setStyle({ backgroundColor: '#64ffda' }));
        startBtn.on('pointerout', () => startBtn.setStyle({ backgroundColor: '#18ffff' }));
        startBtn.on('pointerdown', () => {
            this.tweens.add({
                targets: [mask, title, startBtn],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    mask.destroy();
                    title.destroy();
                    startBtn.destroy();
                    this.physics.resume();
                },
            });
        });

        this.input.keyboard.once('keydown-SPACE', () => startBtn.emit('pointerdown'));
    }

    /**
     * 获取技能上下文
     */
    _getSkillContext() {
        return {
            dead: this.dead,
            quizOn: this.quizSystem.isActive(),
            paused: this.paused,
            sfx: this.soundManager,
            onFlyText: (text, color) => this.uiManager.showFloatingText(this.player.x, this.player.y - 30, text, color),
            onBoom: (x, y, count) => this.vfxManager.createExplosion(x, y, count),
            onEnemyKill: (enemy) => this._killEnemy(enemy),
            enemyGroup: this.enemyGroup,
            bossBulletGroup: this.bossBulletGroup,
        };
    }

    /**
     * 射击
     */
    _shoot() {
        if (this.dead || !this.shootReady || this.ammo <= 0 || this.quizSystem.isActive() || this.paused) {
            return;
        }

        this.shootReady = false;
        this.ammo--;
        this.uiManager.updateAmmo(this.ammo);

        if (this.spreadShots > 0) {
            // 散射模式
            this.spreadShots--;
            this.uiManager.updateSpread(this.spreadShots);

            BULLET_CONFIG.SPREAD_ANGLES.forEach(angle => {
                this._createBullet(this.player.x, this.player.y - 22, angle, true);
            });
        } else {
            // 普通射击
            this._createBullet(this.player.x, this.player.y - 22, 0, false);
        }

        this.soundManager.shoot();
        this.time.delayedCall(BULLET_CONFIG.FIRE_INTERVAL, () => { this.shootReady = true; });
    }

    /**
     * 创建子弹
     */
    _createBullet(x, y, angle, isSpread) {
        const bullet = this.bulletGroup.get(x, y, 'bullet');
        if (!bullet) return;

        bullet.setActive(true)
            .setVisible(true)
            .setScale(1)
            .setDepth(UI_CONFIG.DEPTH.ITEMS)
            .setAlpha(1);

        if (isSpread) {
            bullet.setTint(0xffab40);
        } else {
            bullet.clearTint();
        }

        bullet.body.setSize(BULLET_CONFIG.SIZE.width, BULLET_CONFIG.SIZE.height)
            .setOffset(BULLET_CONFIG.OFFSET.x, BULLET_CONFIG.OFFSET.y);

        bullet.setVelocity(
            Math.sin(angle) * BULLET_CONFIG.SPEED,
            -Math.cos(angle) * BULLET_CONFIG.SPEED
        );
    }

    /**
     * 子弹命中敌人
     */
    _onBulletHitEnemy(bullet, enemy) {
        if (!bullet.active || !enemy.active) return;

        this.soundManager.hit();
        this.vfxManager.createExplosion(enemy.x, enemy.y, enemy.getData('boss') ? 20 : 13);

        // 子弹回收到对象池
        bullet.setActive(false).setVisible(false);
        bullet.body.stop();

        if (enemy.getData('boss')) {
            const hp = enemy.getData('hp') - 1;
            if (hp > 0) {
                enemy.setData('hp', hp);
                enemy.setAlpha(0.4 + hp * 0.12);
                this._updateBossHpBar(enemy);
                return;
            }
            this._destroyBoss(enemy);
        }

        this._killEnemy(enemy);
    }

    /**
     * 击杀敌人（回收到对象池）
     */
    _killEnemy(enemy) {
        // 清理 Boss 资源
        if (enemy.getData('boss')) {
            const hpBg = enemy.getData('hpBg');
            const hpFg = enemy.getData('hpFg');
            if (hpBg) hpBg.destroy();
            if (hpFg) hpFg.destroy();
            enemy.setData('hpBg', null);
            enemy.setData('hpFg', null);
        }

        // 停止关联的 tween
        this.tweens.killTweensOf(enemy);

        // 回收到对象池而非销毁
        enemy.setActive(false)
            .setVisible(false)
            .setVelocity(0, 0);
        enemy.body.stop();
        enemy.body.setEnable(false);

        this.kills++;
        this.combo++;
        this.comboTimer = VFX_CONFIG.COMBO_DECAY_FRAMES;

        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        const multiplier = this.doubleScore > 0 ? 2 : 1;
        const bonus = 10 * (1 + Math.floor(this.combo / VFX_CONFIG.COMBO_BONUS_DIVISOR)) * multiplier;
        this.score += bonus;

        this.uiManager.updateScore(this.score);
        this.uiManager.updateKills(this.kills);

        // 连击显示
        if (this.combo >= VFX_CONFIG.COMBO_THRESHOLD) {
            this.uiManager.showCombo(this.combo);
            
            if (this.combo >= VFX_CONFIG.COMBO_RING_THRESHOLD && this.combo % VFX_CONFIG.COMBO_RING_INTERVAL === 0) {
                this.vfxManager.createComboRing(this.player.x, this.player.y);
            }
        }

        // 加分飘字
        this.uiManager.showBonusText(enemy.x, enemy.y, bonus, multiplier);

        // 实时成就检测
        this._checkQuickAchievements();
    }

    /**
     * 销毁 Boss
     */
    _destroyBoss(enemy) {
        const hpBg = enemy.getData('hpBg');
        const hpFg = enemy.getData('hpFg');
        if (hpBg) hpBg.destroy();
        if (hpFg) hpFg.destroy();

        this.bossKills++;
        this.vfxManager.createBossKillEffect(enemy.x, enemy.y);
        this.uiManager.showFloatingText(enemy.x, enemy.y, '👾 Boss 击败!', COLORS.WARNING);
    }

    /**
     * 更新 Boss 血条
     */
    _updateBossHpBar(enemy) {
        const hpFg = enemy.getData('hpFg');
        const hpMax = enemy.getData('hpMax');
        const hp = enemy.getData('hp');

        if (hpFg && hpFg.active) {
            // 使用 scaleX 控制血量显示，避免每帧重绘
            hpFg.scaleX = hp / hpMax;
        }
    }

    /**
     * 玩家被敌人命中
     */
    _onPlayerHitEnemy(player, enemy) {
        if (!enemy.active || this.dead) return;

        // 护盾格挡：只挡伤害，不销毁敌机
        if (this.skillSystem.handleShieldBlock({
            sfx: this.soundManager,
            onFlyText: (text, color) => this.uiManager.showFloatingText(enemy.x, enemy.y, text, color),
        })) {
            return;
        }

        this._takeDamage(ENEMY_CONFIG.DAMAGE * this.diffMult.damage, enemy);
    }

    /**
     * 玩家被 Boss 子弹命中
     */
    _onPlayerHitBossBullet(player, bullet) {
        if (!bullet.active || this.dead) return;

        // Boss 子弹回收到对象池
        bullet.setActive(false).setVisible(false);
        bullet.body.stop();

        // 护盾格挡
        if (this.skillSystem.handleShieldBlock({
            sfx: this.soundManager,
            onFlyText: (text, color) => this.uiManager.showFloatingText(this.player.x, this.player.y - 30, text, color),
        })) {
            return;
        }

        this._takeDamage(12 * this.diffMult.damage, null);
    }

    /**
     * 受到伤害
     */
    _takeDamage(damage, source) {
        this.lastHitTime = Date.now();
        
        if (source) {
            this.soundManager.boom();
            this.vfxManager.createExplosion(source.x, source.y, 10);
            source.destroy();
        }

        this.hp -= Math.round(damage);
        this.combo = 0;
        this.uiManager.hideCombo();
        this.uiManager.updateHealth(this.hp);

        if (this.gameSettings.screenShake) {
            this.cameras.main.shake(100, 0.007);
        }

        this.uiManager.showDamageFlash();
        this.player.setTint(0xff0000);
        this.time.delayedCall(PLAYER_CONFIG.DAMAGE_TINT_DURATION, () => {
            if (this.player.active) this.player.clearTint();
        });

        if (this.hp <= 0) {
            this.hp = 0;
            this.uiManager.updateHealth(this.hp);
            this._die();
        }
    }

    /**
     * 拾取道具
     */
    _onPlayerPickItem(player, item) {
        if (!item.active || this.dead) return;

        const type = item.getData('type');
        const config = ITEM_CONFIG.TYPES[type];

        switch (type) {
            case 'ammo':
                this.ammo += Phaser.Math.Between(ITEM_CONFIG.AMMO_RANGE[0], ITEM_CONFIG.AMMO_RANGE[1]);
                this.uiManager.showFloatingText(item.x, item.y, '+弹药', COLORS.SUCCESS);
                break;
            case 'hp':
                this.hp = Math.min(PLAYER_CONFIG.MAX_HP, this.hp + Phaser.Math.Between(ITEM_CONFIG.HP_RESTORE_RANGE[0], ITEM_CONFIG.HP_RESTORE_RANGE[1]));
                this.uiManager.showFloatingText(item.x, item.y, '+生命', COLORS.DANGER);
                break;
            case 'quiz':
                this.ammo += Phaser.Math.Between(ITEM_CONFIG.QUIZ_AMMO_RANGE[0], ITEM_CONFIG.QUIZ_AMMO_RANGE[1]);
                this._pauseGameTweens();  // 暂停游戏 tween
                this.quizSystem.show();
                this.physics.pause();
                break;
            case 'shield':
                this.skillSystem.activateItemShield();
                this.soundManager.shield();
                this.uiManager.showFloatingText(item.x, item.y, '🛡️ 护盾!', SKILL_CONFIG.shield.color);
                break;
            case 'spread':
                this.spreadShots += BULLET_CONFIG.SPREAD_COUNT;
                this.uiManager.updateSpread(this.spreadShots);
                this.uiManager.showFloatingText(item.x, item.y, '散射模式!', 0xffab40);
                break;
            case 'double':
                this.doubleScore = ITEM_CONFIG.DOUBLE_DURATION;
                this.uiManager.updateDouble(this.doubleScore);
                this.uiManager.showFloatingText(item.x, item.y, '双倍得分!', 0xe040fb);
                break;
        }

        this.uiManager.updateAmmo(this.ammo);
        this.uiManager.updateHealth(this.hp);

        if (type !== 'quiz' && type !== 'shield') {
            this.soundManager.pickup();
        }

        // 清理道具关联资源后销毁
        this._cleanupItemResources(item);
        item.destroy();
    }

    /**
     * 答题回调
     * @param {boolean} correct - 是否答对
     * @param {number} delta - QuizSystem 计算的弹药变化量
     */
    _onQuizAnswer(correct, delta) {
        this.quizTotal++;
        if (correct) this.quizCorrect++;

        this.ammo = Math.max(0, this.ammo + delta);
        this.uiManager.updateAmmo(this.ammo);

        if (correct) {
            this.soundManager.quizCorrect();
        } else {
            this.soundManager.quizWrong();
        }

        this.time.delayedCall(QUIZ_CONFIG.SHOW_DURATION, () => {
            if (!this.dead) {
                this._resumeGameTweens();  // 恢复游戏 tween
                this.physics.resume();
            }
        });
    }

    /**
     * 暂停游戏相关的 tween（道具、特效等，不包括 UI）
     */
    _pauseGameTweens() {
        // 保存当前活跃的 tween 以便恢复
        this._pausedTweens = [];
        
        // 暂停道具组的 tween
        this.itemGroup.getChildren().forEach(item => {
            if (!item.active) return;
            const relatedTweens = item.getData('relatedTweens') || [];
            relatedTweens.forEach(tween => {
                if (tween && tween.isPlaying()) {
                    tween.pause();
                    this._pausedTweens.push(tween);
                }
            });
        });
        
        // 暂停敌人组的 tween
        this.enemyGroup.getChildren().forEach(enemy => {
            if (!enemy.active) return;
            const tweens = this.tweens.getTweensOf(enemy);
            tweens.forEach(tween => {
                if (tween.isPlaying()) {
                    tween.pause();
                    this._pausedTweens.push(tween);
                }
            });
        });
    }

    /**
     * 恢复游戏相关的 tween
     */
    _resumeGameTweens() {
        if (this._pausedTweens) {
            this._pausedTweens.forEach(tween => {
                if (tween) tween.resume();
            });
            this._pausedTweens = [];
        }
    }

    /**
     * 快速成就检测
     */
    _checkQuickAchievements() {
        const checks = [
            ['score_100', this.score >= 100],
            ['score_500', this.score >= 500],
            ['score_1000', this.score >= 1000],
            ['score_2000', this.score >= 2000],
            ['kill_10', this.kills >= 10],
            ['kill_50', this.kills >= 50],
            ['kill_100', this.kills >= 100],
            ['combo_5', this.combo >= 5],
            ['combo_10', this.combo >= 10],
            ['combo_20', this.combo >= 20],
            ['boss_kill', this.bossKills >= 1],
        ];

        checks.forEach(([id, condition]) => {
            if (condition && !this.achChecked.has(id) && DataStore.unlockAchievement(id)) {
                this.achChecked.add(id);
                const achievement = ACHIEVEMENTS.find(a => a.id === id);
                if (achievement) this.uiManager.showAchievementToast(achievement);
            }
        });
    }

    /**
     * 暂停切换
     */
    _togglePause() {
        if (this.dead) return;

        this.paused = !this.paused;
        
        if (this.paused) {
            this.physics.pause();
            this.pauseOverlay.setVisible(true);
            this.soundManager.pause();  // 暂停音效
        } else {
            this.physics.resume();
            this.pauseOverlay.setVisible(false);
            this.soundManager.resume();  // 恢复音效
        }
    }

    /**
     * 重新开始游戏
     */
    _restartGame() {
        this.paused = false;
        this.physics.resume();
        this.scene.restart();
    }

    /**
     * 返回菜单
     */
    _returnToMenu() {
        this.paused = false;
        this.physics.resume();
        this.scene.start('Menu');
    }

    /**
     * 玩家死亡
     */
    _die() {
        this.dead = true;
        this.player.setVisible(false);
        this.trailTimer.remove();

        this.vfxManager.createPlayerDeathEffect(this.player.x, this.player.y);
        this.physics.pause();

        // 强制关闭答题
        this.quizSystem.forceClose();

        // 清理 Boss 资源
        this.enemyGroup.getChildren().forEach(enemy => {
            if (enemy.getData('boss')) {
                const hpBg = enemy.getData('hpBg');
                const hpFg = enemy.getData('hpFg');
                if (hpBg) hpBg.destroy();
                if (hpFg) hpFg.destroy();
            }
        });

        // 清理 Boss 子弹
        this.bossBulletGroup.getChildren().forEach(bullet => {
            if (bullet.active) {
                bullet.setActive(false).setVisible(false);
                bullet.body.stop();
            }
        });

        // 计算统计
        const surviveTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const prevMaxScore = DataStore.getStats().maxScore;

        // 保存数据
        DataStore.addScore(PlayerInfo.name || '匿名', this.score, this.kills);
        DataStore.updateStats(this.score, this.kills, this.quizCorrect, this.quizTotal, this.maxCombo, this.bossKills, surviveTime);

        // 检测成就
        const newAch = checkAchievements(this.score, this.kills, this.maxCombo, this.bossKills, surviveTime, this.wave);
        
        // 完美闪避成就
        const noHitTime = Math.floor((Date.now() - this.lastHitTime) / 1000);
        if (noHitTime >= 30 && DataStore.unlockAchievement('no_hit_30')) {
            newAch.push('no_hit_30');
        }

        // 跳转到结算界面
        this.time.delayedCall(600, () => {
            this.scene.launch('Over', {
                score: this.score,
                kills: this.kills,
                maxCombo: this.maxCombo,
                quizCorrect: this.quizCorrect,
                quizTotal: this.quizTotal,
                surviveTime: surviveTime,
                wave: this.wave,
                prevMaxScore: prevMaxScore,
                newAch: newAch,
                difficulty: this.gameSettings.difficulty,
            });
            this.scene.pause();
        });
    }

    /**
     * 生成敌人（使用对象池 + 预计算权重）
     */
    _spawnEnemy() {
        const W = this.scale.width;
        const r = Math.random();
        
        // 使用预计算权重查找（性能优化）
        let type = 'e0';
        for (const weight of this._enemyWeightSum) {
            if (r < weight.threshold) {
                type = weight.key;
                break;
            }
        }

        const config = ENEMY_CONFIG.TYPES[type];
        const speed = Phaser.Math.Between(config.speedRange[0], config.speedRange[1]) * this.diffMult.enemySpeed;
        const x = Phaser.Math.Between(26, W - 26);

        // 从对象池获取或创建敌人
        const enemy = this.enemyGroup.get(x, -30, type);
        if (!enemy) return;

        // 重置敌人状态
        enemy.setActive(true)
            .setVisible(true)
            .setDepth(UI_CONFIG.DEPTH.ENEMIES)
            .setScale(1)
            .setAlpha(1)
            .clearTint()
            .setVelocityY(speed * this.skillSystem.getGameSpeed());

        enemy.body.setSize(enemy.width * ENEMY_CONFIG.HITBOX_SCALE.width, enemy.height * ENEMY_CONFIG.HITBOX_SCALE.height);
        enemy.body.setEnable(true);
        
        enemy.setData('behavior', config.behavior);
        enemy.setData('baseSpeed', speed);
        enemy.setData('bornTime', this.time.now);
        enemy.setData('boss', false);
        enemy.setData('hp', 0);
        enemy.setData('hpMax', 0);

        // 停止之前的 tween
        this.tweens.killTweensOf(enemy);

        // 根据行为类型初始化
        switch (config.behavior) {
            case 'boss':
                this._initBoss(enemy, x);
                break;
            case 'tracker':
                enemy.setTint(0xffa726);
                break;
            case 'zigzag':
                enemy.setData('originX', x);
                enemy.setData('zigAmp', Phaser.Math.Between(ENEMY_CONFIG.ZIGZAG.AMP_RANGE[0], ENEMY_CONFIG.ZIGZAG.AMP_RANGE[1]));
                enemy.setData('zigFreq', Phaser.Math.Between(ENEMY_CONFIG.ZIGZAG.FREQ_RANGE[0], ENEMY_CONFIG.ZIGZAG.FREQ_RANGE[1]) * ENEMY_CONFIG.ZIGZAG.FREQ_MULT);
                break;
            case 'straight':
                this.tweens.add({
                    targets: enemy,
                    x: x + Phaser.Math.Between(ENEMY_CONFIG.STRAIGHT.DRIFT_RANGE[0], ENEMY_CONFIG.STRAIGHT.DRIFT_RANGE[1]),
                    duration: Phaser.Math.Between(ENEMY_CONFIG.STRAIGHT.TWEEN_DURATION[0], ENEMY_CONFIG.STRAIGHT.TWEEN_DURATION[1]),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                });
                break;
        }
    }

    /**
     * 初始化 Boss
     */
    _initBoss(enemy, x) {
        const bossHp = Math.round(
            (ENEMY_CONFIG.BOSS.HP_BASE + Math.floor(this.wave * ENEMY_CONFIG.BOSS.HP_WAVE_MULT)) * this.diffMult.enemyHp
        );

        enemy.setScale(ENEMY_CONFIG.BOSS.SCALE)
            .setData('boss', true)
            .setData('hp', bossHp)
            .setData('hpMax', bossHp)
            .setData('shootTimer', 0);

        // Boss 血条背景（使用 Graphics，只绘制一次）
        const hpBg = this.add.graphics().setDepth(UI_CONFIG.DEPTH.BOSS_HP);
        hpBg.fillStyle(0x333333, 0.7);
        hpBg.fillRoundedRect(-30, -22, 60, 6, 3);

        // Boss 血条前景（使用 Graphics，通过 scale 控制长度）
        const hpFg = this.add.graphics().setDepth(UI_CONFIG.DEPTH.BOSS_HP);
        hpFg.fillStyle(0xff1744, 0.9);
        hpFg.fillRoundedRect(-30, -22, 60, 6, 3);

        enemy.setData('hpBg', hpBg);
        enemy.setData('hpFg', hpFg);
    }

    /**
     * Boss 射击（使用对象池）
     */
    _bossShoot(boss) {
        if (!boss.active || this.dead) return;

        ENEMY_CONFIG.BOSS.BULLET_ANGLES.forEach(angle => {
            const bullet = this.bossBulletGroup.get(boss.x, boss.y + 16, 'bossBullet');
            if (!bullet) return;

            bullet.setActive(true)
                .setVisible(true)
                .setScale(0.8)
                .setDepth(UI_CONFIG.DEPTH.ITEMS)
                .setAlpha(1);

            bullet.body.setSize(10, 10).setOffset(1, 1);
            bullet.body.setEnable(true);

            const speed = ENEMY_CONFIG.BOSS.BULLET_SPEED * this.skillSystem.getGameSpeed();
            bullet.setVelocity(
                Math.sin(angle) * speed,
                Math.cos(angle) * speed
            );
        });
    }

    /**
     * 生成道具（优化版本：减少定时器使用）
     */
    _spawnItem() {
        const W = this.scale.width;
        const r = Math.random() / this.diffMult.itemRate;

        // 根据权重选择道具类型
        let type = 'ammo';
        let cumWeight = 0;
        for (const [key, config] of Object.entries(ITEM_CONFIG.TYPES)) {
            cumWeight += config.weight;
            if (r < cumWeight) {
                type = key;
                break;
            }
        }

        const config = ITEM_CONFIG.TYPES[type];
        const x = Phaser.Math.Between(28, W - 28);

        const item = this.itemGroup.create(x, -20, config.key)
            .setDepth(UI_CONFIG.DEPTH.ITEMS)
            .setVelocityY(ITEM_CONFIG.BASE_SPEED * this.skillSystem.getGameSpeed())
            .setData('type', type)
            .setData('hasGlow', false);

        // 存储关联的 tween，用于销毁时清理
        const relatedTweens = [];

        // 特殊道具光效
        if (config.scale) {
            item.setScale(config.scale);
            
            const glow = this.add.image(x, -20, 'glow')
                .setDepth(UI_CONFIG.DEPTH.ITEMS - 1)
                .setAlpha(ITEM_CONFIG.GLOW_PULSE.minAlpha)
                .setTint(config.tint)
                .setScale(0.8);

            // 存储 glow 引用到 item 上
            item.setData('glow', glow);
            item.setData('hasGlow', true);

            const glowTween = this.tweens.add({
                targets: glow,
                alpha: 0.15,
                scale: ITEM_CONFIG.GLOW_PULSE.maxScale,
                duration: ITEM_CONFIG.GLOW_PULSE.duration,
                yoyo: true,
                repeat: -1,
            });
            relatedTweens.push(glowTween);

            const pulseTween = this.tweens.add({
                targets: item,
                scaleX: 1.4,
                scaleY: 1.4,
                duration: 350,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
            relatedTweens.push(pulseTween);
        }

        // 道具漂移动画
        const driftTween = this.tweens.add({
            targets: item,
            x: x + Phaser.Math.Between(ITEM_CONFIG.DRIFT_RANGE[0], ITEM_CONFIG.DRIFT_RANGE[1]),
            duration: ITEM_CONFIG.DRIFT_DURATION,
            yoyo: true,
            repeat: -1,
        });
        relatedTweens.push(driftTween);

        // 存储关联资源到 item 上
        item.setData('relatedTweens', relatedTweens);
    }

    /**
     * 更新道具光效位置（在主循环中调用，替代定时器）
     */
    _updateItemGlows() {
        this.itemGroup.getChildren().forEach(item => {
            if (!item.active || !item.getData('hasGlow')) return;
            
            const glow = item.getData('glow');
            if (glow && glow.active) {
                glow.x = item.x;
                glow.y = item.y;
            }
        });
    }

    /**
     * 清理道具关联的动画和资源
     */
    _cleanupItemResources(item) {
        // 清理关联的 tween（无论是否在播放都要清理）
        const tweens = item.getData('relatedTweens');
        if (tweens && tweens.length > 0) {
            tweens.forEach(tween => {
                if (tween) {
                    tween.stop();
                    tween.remove();
                }
            });
            item.setData('relatedTweens', []);
        }

        // 清理光效
        const glow = item.getData('glow');
        if (glow && glow.active) {
            glow.destroy();
            item.setData('glow', null);
        }
        item.setData('hasGlow', false);
    }

    /**
     * 主循环更新
     */
    update(time, delta) {
        if (this.dead || this.paused) return;

        const W = this.scale.width;
        const H = this.scale.height;
        const gameSpeed = this.skillSystem.getGameSpeed();

        // 更新双倍分计时器
        if (this.doubleScore > 0) {
            this.doubleScore -= delta;
            if (this.doubleScore <= 0) {
                this.doubleScore = 0;
                this.uiManager.updateDouble(0);
            }
        }

        // 更新星空背景
        this.vfxManager.updateStarfield(time, gameSpeed);

        // 更新护盾视觉
        if (this.skillSystem.getSkills().shield.active) {
            this.skillSystem.drawShield(this.player);
        }

        // 更新技能冷却 UI
        this.uiManager.updateSkillCooldowns(this.skillSystem.getSkills());

        // 自动射击
        if (this.gameSettings.autoFire && !this.quizSystem.isActive()) {
            this.autoFireTimer = (this.autoFireTimer || 0) + delta;
            if (this.autoFireTimer >= BULLET_CONFIG.AUTO_FIRE_INTERVAL) {
                this.autoFireTimer = 0;
                this._shoot();
            }
        }

        // 答题时暂停游戏逻辑
        if (this.quizSystem.isActive()) return;

        // 玩家移动
        this._updatePlayerMovement(delta);

        // 连击计时器
        if (this.comboTimer > 0) {
            this.comboTimer -= delta / 16.67;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.uiManager.hideCombo();
            }
        }

        // 更新敌人 AI
        this._updateEnemyAI(time, delta, gameSpeed);

        // 波次系统
        this._updateWaveSystem(time, gameSpeed);

        // 生成敌人和道具
        this._updateSpawning(time, gameSpeed);

        // 道具磁铁效果
        this._updateItemMagnet();
        
        // 更新道具光效位置（替代定时器）
        this._updateItemGlows();

        // 清理越界对象
        this._cleanupOutOfBounds(W, H);
    }

    /**
     * 更新玩家移动
     */
    _updatePlayerMovement(delta) {
        const movement = this.inputManager.getMovement();
        this.player.setVelocity(
            movement.x * PLAYER_CONFIG.SPEED,
            movement.y * PLAYER_CONFIG.SPEED
        );

        // 飞船倾斜效果
        const targetAngle = movement.x * PLAYER_CONFIG.TILT_FACTOR;
        this.player.angle += (targetAngle - this.player.angle) * PLAYER_CONFIG.TILT_LERP;
    }

    /**
     * 更新敌人 AI
     */
    _updateEnemyAI(time, delta, gameSpeed) {
        this.enemyGroup.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            const behavior = enemy.getData('behavior');
            const baseSpeed = enemy.getData('baseSpeed');

            switch (behavior) {
                case 'zigzag':
                    const originX = enemy.getData('originX');
                    const amp = enemy.getData('zigAmp');
                    const freq = enemy.getData('zigFreq');
                    enemy.x = originX + Math.sin(time * freq) * amp;
                    break;

                case 'tracker':
                    const trackSpeed = baseSpeed * ENEMY_CONFIG.TRACKER.SPEED_MULT * gameSpeed;
                    const dx = this.player.x - enemy.x;
                    const dy = this.player.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > ENEMY_CONFIG.TRACKER.ATTRACT_RANGE) {
                        enemy.x += dx / dist * trackSpeed * delta * 0.06;
                        enemy.y += dy / dist * trackSpeed * 0.3;
                    }
                    break;

                case 'boss':
                    this._updateBoss(enemy, time, gameSpeed);
                    break;
            }
        });
    }

    /**
     * 更新 Boss
     */
    _updateBoss(boss, time, gameSpeed) {
        // 更新血条位置（跟随 Boss）
        const hpBg = boss.getData('hpBg');
        const hpFg = boss.getData('hpFg');

        if (hpBg && hpBg.active) {
            hpBg.x = boss.x;
            hpBg.y = boss.y;
        }

        if (hpFg && hpFg.active) {
            hpFg.x = boss.x;
            hpFg.y = boss.y;
            
            // 使用 scaleX 控制血量显示
            const hp = boss.getData('hp');
            const hpMax = boss.getData('hpMax');
            hpFg.scaleX = hp / hpMax;
        }

        // Boss 射击
        if (boss.y > 30) {
            const lastShot = boss.getData('shootTimer') || 0;
            if (time - lastShot > ENEMY_CONFIG.BOSS.SHOOT_INTERVAL / gameSpeed) {
                boss.setData('shootTimer', time);
                this._bossShoot(boss);
            }
        }
    }

    /**
     * 更新波次系统
     */
    _updateWaveSystem(time, gameSpeed) {
        if (this.waveCooldown) return;

        if (this.waveEnemyCount >= this.waveEnemyTotal) {
            this.waveCooldown = true;
            this.wave++;
            this.waveEnemyTotal = WAVE_CONFIG.INITIAL_ENEMIES + this.wave * WAVE_CONFIG.ENEMIES_PER_WAVE;
            this.waveEnemyCount = 0;

            // 波次奖励
            const bonus = this.wave * WAVE_CONFIG.BONUS_PER_WAVE;
            this.score += bonus * (this.doubleScore > 0 ? 2 : 1);
            this.ammo += Phaser.Math.Between(WAVE_CONFIG.AMMO_REWARD_RANGE[0], WAVE_CONFIG.AMMO_REWARD_RANGE[1]);

            this.uiManager.updateScore(this.score);
            this.uiManager.updateAmmo(this.ammo);
            this.uiManager.showFloatingText(this.player.x, this.player.y - 30, '🌊 +' + bonus + ' 奖励!', 0xffab40);
            this.uiManager.showWave(this.wave);

            this.time.delayedCall(WAVE_CONFIG.COOLDOWN_DURATION, () => { this.waveCooldown = false; });
        }
    }

    /**
     * 更新生成逻辑
     */
    _updateSpawning(time, gameSpeed) {
        // 敌人生成（难度曲线）
        const waveMod = Math.max(WAVE_CONFIG.SPEED_MODIFIER_MIN, 1 - this.wave * WAVE_CONFIG.SPEED_MODIFIER_DECAY);
        const spawnInterval = Math.max(WAVE_CONFIG.SPAWN_INTERVAL_MIN, WAVE_CONFIG.SPAWN_INTERVAL_BASE * Math.pow(WAVE_CONFIG.SPAWN_DECAY, this.kills)) * waveMod;

        if (!this.waveCooldown && time - this.lastEnemySpawn > spawnInterval / gameSpeed) {
            this._spawnEnemy();
            this.lastEnemySpawn = time;
            this.waveEnemyCount++;
        }

        // 道具生成
        if (time - this.lastItemSpawn > Phaser.Math.Between(WAVE_CONFIG.ITEM_INTERVAL_RANGE[0], WAVE_CONFIG.ITEM_INTERVAL_RANGE[1])) {
            this._spawnItem();
            this.lastItemSpawn = time;
        }
    }

    /**
     * 更新道具磁铁效果
     */
    _updateItemMagnet() {
        if (this.dead) return;

        this.itemGroup.getChildren().forEach(item => {
            if (!item.active) return;

            const dx = this.player.x - item.x;
            const dy = this.player.y - item.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < ITEM_CONFIG.MAGNET_RANGE && dist > 5) {
                const pull = ITEM_CONFIG.MAGNET_STRENGTH * (ITEM_CONFIG.MAGNET_RANGE - dist) / ITEM_CONFIG.MAGNET_RANGE;
                item.x += dx / dist * pull;
                item.y += dy / dist * pull;
            }
        });
    }

    /**
     * 清理越界对象
     */
    _cleanupOutOfBounds(W, H) {
        // 子弹
        this.bulletGroup.getChildren().forEach(bullet => {
            if (bullet.active && (bullet.y < -20 || bullet.y > H + 20)) {
                bullet.setActive(false).setVisible(false);
                bullet.body.stop();
            }
        });

        // Boss 子弹
        this.bossBulletGroup.getChildren().forEach(bullet => {
            if (bullet.active && (bullet.y < -20 || bullet.y > H + 20 || bullet.x < -20 || bullet.x > W + 20)) {
                bullet.setActive(false).setVisible(false);
                bullet.body.stop();
            }
        });

        // 敌人（回收到对象池）
        this.enemyGroup.getChildren().forEach(enemy => {
            if (enemy.active && enemy.y > H + ENEMY_CONFIG.CLEANUP_Y) {
                this.combo = 0;
                
                // 清理 Boss 资源
                if (enemy.getData('boss')) {
                    const hpBg = enemy.getData('hpBg');
                    const hpFg = enemy.getData('hpFg');
                    if (hpBg) hpBg.destroy();
                    if (hpFg) hpFg.destroy();
                    enemy.setData('hpBg', null);
                    enemy.setData('hpFg', null);
                }

                // 停止 tween
                this.tweens.killTweensOf(enemy);
                
                // 回收到对象池
                enemy.setActive(false)
                    .setVisible(false)
                    .setVelocity(0, 0);
                enemy.body.stop();
                enemy.body.setEnable(false);
            }
        });

        // 道具（清理关联资源后销毁）
        this.itemGroup.getChildren().forEach(item => {
            if (item.active && item.y > H + ITEM_CONFIG.CLEANUP_Y) {
                this._cleanupItemResources(item);
                item.destroy();
            }
        });
    }
}
