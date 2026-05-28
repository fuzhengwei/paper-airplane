/**
 * UI 管理器
 * 管理所有游戏界面元素
 * 优化：飘字对象池、血条 scale 控制
 */
class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.W = scene.scale.width;
        this.H = scene.scale.height;
        
        // UI 元素引用
        this.elements = {};
        
        // 样式常量（高分辨率下字体放大 2 倍）
        this.textStyle = {
            fontSize: '30px',
            fontFamily: UI_CONFIG.FONT_FAMILY,
            color: COLORS.ACCENT_HEX,
        };
        
        // 飘字对象池（性能优化）
        this._floatingTextPool = [];
        this._floatingPoolMax = 25;
        this._bonusTextPool = [];
        this._bonusPoolMax = 15;
        
        // 血条相关
        this.hpForeground = null;
        this.hpLastColor = null;
    }

    /**
     * 初始化所有 UI 元素
     */
    init(gameSettings) {
        this._createScoreUI();
        this._createHealthBar();
        this._createSkillUI(gameSettings.difficulty);
        this._createComboUI();
        this._createWaveUI();
        this._createItemEffectUI();
        this._createDamageOverlay();
    }

    /**
     * 创建分数显示
     */
    _createScoreUI() {
        this.elements.score = this.scene.add.text(24, 16, '⭐ 0', this.textStyle)
            .setDepth(UI_CONFIG.DEPTH.HUD)
            .setScrollFactor(0);

        this.elements.kills = this.scene.add.text(24, 56, '🎯 0', {
            ...this.textStyle,
            fontSize: '26px',
            color: '#ffcc80',
        })
            .setDepth(UI_CONFIG.DEPTH.HUD)
            .setScrollFactor(0);

        this.elements.ammo = this.scene.add.text(24, 96, '🔫 15', {
            ...this.textStyle,
            fontSize: '26px',
            color: '#fff176',
        })
            .setDepth(UI_CONFIG.DEPTH.HUD)
            .setScrollFactor(0);
    }

    /**
     * 创建血条（优化：只绘制一次，后续用 scale 控制）
     */
    _createHealthBar() {
        const bw = 230;  // 高分辨率下血条放大 2 倍
        const bh = 26;
        const bx = this.W - bw - 28;
        const by = 20;

        // 血条背景（只绘制一次）
        this.elements.hpBg = this.scene.add.graphics()
            .setDepth(UI_CONFIG.DEPTH.HUD)
            .setScrollFactor(0);
        this.elements.hpBg.fillStyle(0x222222, 0.65);
        this.elements.hpBg.fillRoundedRect(bx, by, bw, bh, 14);

        // 血条前景（只绘制一次，后续用 scaleX 控制）
        this.hpForeground = this.scene.add.graphics()
            .setDepth(UI_CONFIG.DEPTH.HUD)
            .setScrollFactor(0);
        this.hpForeground.fillStyle(COLORS.SUCCESS);
        this.hpForeground.fillRoundedRect(bx + 2, by + 2, bw - 4, bh - 4, 10);
        // Graphics 对象没有 setOrigin，位置由 fillRoundedRect 的坐标参数控制
        this.hpForeground.x = 0;
        this.hpForeground.y = 0;

        this.hpConfig = { x: bx, y: by, width: bw, height: bh };
        this.hpLastColor = 'success';
    }

    /**
     * 创建技能 UI
     */
    _createSkillUI(difficulty) {
        this.elements.skills = {};
        
        Object.entries(SKILL_CONFIG).forEach(([id, config]) => {
            const txt = this.scene.add.text(24, config.uiY * 2, config.label, {
                fontSize: '22px',
                color: '#b0bec5',
                fontFamily: UI_CONFIG.FONT_FAMILY,
            })
                .setDepth(UI_CONFIG.DEPTH.HUD)
                .setScrollFactor(0);

            const cdGfx = this.scene.add.graphics()
                .setDepth(UI_CONFIG.DEPTH.HUD)
                .setScrollFactor(0);

            this.elements.skills[id] = { txt, cdGfx, config };
        });

        // 难度标签
        const diffConfig = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.normal;
        this.elements.difficulty = this.scene.add.text(this.W - 24, 56, diffConfig.label, {
            fontSize: '20px',
            color: '#b0bec5',
        })
            .setOrigin(1, 0)
            .setDepth(UI_CONFIG.DEPTH.HUD)
            .setScrollFactor(0);
    }

    /**
     * 创建连击显示
     */
    _createComboUI() {
        this.elements.combo = this.scene.add.text(this.W / 2, 128, '', {
            fontSize: '48px',
            fontFamily: UI_CONFIG.FONT_FAMILY,
            color: COLORS.WARNING_HEX,
            fontStyle: 'bold',
        })
            .setOrigin(0.5)
            .setDepth(UI_CONFIG.DEPTH.HUD)
            .setScrollFactor(0)
            .setAlpha(0);
    }

    /**
     * 创建波次显示
     */
    _createWaveUI() {
        this.elements.wave = this.scene.add.text(this.W / 2, 56, '', {
            fontSize: '36px',
            fontFamily: UI_CONFIG.FONT_FAMILY,
            color: '#ffab40',
            fontStyle: 'bold',
        })
            .setOrigin(0.5)
            .setDepth(UI_CONFIG.DEPTH.HUD)
            .setScrollFactor(0)
            .setAlpha(0);
    }

    /**
     * 创建道具效果显示
     */
    _createItemEffectUI() {
        this.elements.spread = this.scene.add.text(this.W - 24, 100, '', {
            fontSize: '22px',
            color: '#ffab40',
            fontFamily: UI_CONFIG.FONT_FAMILY,
        })
            .setOrigin(1, 0)
            .setDepth(UI_CONFIG.DEPTH.HUD)
            .setScrollFactor(0);

        this.elements.double = this.scene.add.text(this.W - 24, 128, '', {
            fontSize: '22px',
            color: '#e040fb',
            fontFamily: UI_CONFIG.FONT_FAMILY,
        })
            .setOrigin(1, 0)
            .setDepth(UI_CONFIG.DEPTH.HUD)
            .setScrollFactor(0);
    }

    /**
     * 创建伤害闪红遮罩
     */
    _createDamageOverlay() {
        this.elements.damageOverlay = this.scene.add.graphics()
            .setDepth(200)
            .setVisible(false);
        this.elements.damageOverlay.fillStyle(0xff0000, 0.15);
        this.elements.damageOverlay.fillRect(0, 0, this.W, this.H);
    }

    /**
     * 更新分数显示
     */
    updateScore(score) {
        this.elements.score.setText('⭐ ' + score);
    }

    /**
     * 更新击杀数
     */
    updateKills(kills) {
        this.elements.kills.setText('🎯 ' + kills);
    }

    /**
     * 更新弹药数
     */
    updateAmmo(ammo) {
        this.elements.ammo.setText('🔫 ' + ammo);
    }

    /**
     * 更新血条（优化：只在颜色变化时重绘，减少 clear/重绘频率）
     */
    updateHealth(hp) {
        const { x, y, width, height } = this.hpConfig;
        const pct = Math.max(0, hp / PLAYER_CONFIG.MAX_HP);
        
        // 确定当前血条颜色
        const colorKey = pct > 0.5 ? 'success' : pct > 0.25 ? 'warning' : 'danger';
        const color = pct > 0.5 ? COLORS.SUCCESS : pct > 0.25 ? COLORS.WARNING : COLORS.DANGER;
        
        // 只在颜色变化或血量归零时重绘
        if (colorKey !== this.hpLastColor || pct === 0) {
            this.hpForeground.clear();
            if (pct > 0) {
                this.hpForeground.fillStyle(color);
                this.hpForeground.fillRoundedRect(x + 1, y + 1, (width - 2) * pct, height - 2, 5);
            }
            this.hpLastColor = colorKey;
        } else {
            // 颜色相同时，只更新宽度（清除后重绘同色）
            this.hpForeground.clear();
            this.hpForeground.fillStyle(color);
            this.hpForeground.fillRoundedRect(x + 1, y + 1, (width - 2) * pct, height - 2, 5);
        }
    }

    /**
     * 更新技能冷却
     */
    updateSkillCooldowns(skills) {
        const now = Date.now();

        Object.entries(this.elements.skills).forEach(([id, ui]) => {
            const skill = skills[id];
            const elapsed = now - skill.lastUsed;
            const remaining = Math.max(0, skill.cd - elapsed);

            ui.cdGfx.clear();

            if (remaining > 0) {
                const pct = remaining / skill.cd;
                ui.cdGfx.fillStyle(0x333333, 0.6);
                ui.cdGfx.fillRoundedRect(108, ui.config.uiY * 2 - 4, 100, 24, 8);
                ui.cdGfx.fillStyle(ui.config.color, 0.6);
                ui.cdGfx.fillRoundedRect(108, ui.config.uiY * 2 - 4, 100 * (1 - pct), 24, 8);
                ui.txt.setColor('#666666');
            } else {
                ui.txt.setColor('#b0bec5');
            }
        });
    }

    /**
     * 显示连击
     */
    showCombo(combo) {
        const comboEl = this.elements.combo;
        comboEl.setText('🔥 ' + combo + ' 连击!');
        comboEl.setAlpha(1).setScale(0.5);
        
        this.scene.tweens.add({
            targets: comboEl,
            alpha: 0,
            scale: 1.4,
            duration: 800,
            ease: 'Cubic.easeOut',
        });
    }

    /**
     * 隐藏连击
     */
    hideCombo() {
        this.elements.combo.setAlpha(0);
    }

    /**
     * 显示波次
     */
    showWave(wave) {
        const waveEl = this.elements.wave;
        waveEl.setText('🌊 第 ' + wave + ' 波');
        waveEl.setAlpha(1).setScale(0.5);
        
        this.scene.tweens.add({
            targets: waveEl,
            alpha: 0,
            scale: 1.3,
            duration: 1800,
            ease: 'Cubic.easeOut',
        });
    }

    /**
     * 更新散射显示
     */
    updateSpread(count) {
        this.elements.spread.setText(count > 0 ? '散射 x' + count : '');
    }

    /**
     * 更新双倍分显示
     */
    updateDouble(timeLeft) {
        this.elements.double.setText(timeLeft > 0 ? 'x2 双倍分!' : '');
    }

    /**
     * 显示伤害闪红
     */
    showDamageFlash() {
        const overlay = this.elements.damageOverlay;
        overlay.setVisible(true).setAlpha(0.6);
        
        this.scene.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 250,
            onComplete: () => overlay.setVisible(false),
        });
    }

    /**
     * 从对象池获取飘字
     * @param {Array} pool - 对象池
     * @param {number} maxSize - 最大数量
     * @returns {Phaser.GameObjects.Text|null}
     */
    _getFromPool(pool, maxSize) {
        // 尝试获取非活跃对象
        for (let i = 0; i < pool.length; i++) {
            if (!pool[i].active) {
                pool[i].setActive(true).setVisible(true).setAlpha(1);
                return pool[i];
            }
        }
        // 池未满时创建新对象
        if (pool.length < maxSize) {
            const obj = this.scene.add.text(0, 0, '', {
                fontSize: '28px',
                fontStyle: 'bold',
            })
                .setOrigin(0.5)
                .setDepth(150)
                .setActive(true)
                .setVisible(true);
            pool.push(obj);
            return obj;
        }
        return null;
    }

    /**
     * 回收飘字到对象池
     * @param {Phaser.GameObjects.Text} obj
     * @param {Array} pool
     */
    _recycleToPool(obj, pool) {
        obj.setActive(false)
            .setVisible(false)
            .setAlpha(0)
            .setText('');
        if (obj._tween) {
            obj._tween.stop();
            obj._tween = null;
        }
    }

    /**
     * 显示飘字（使用对象池）
     */
    showFloatingText(x, y, text, color) {
        const ft = this._getFromPool(this._floatingTextPool, this._floatingPoolMax);
        if (!ft) return;

        ft.setPosition(x, y)
            .setText(text)
            .setFontSize('28px')
            .setColor('#' + color.toString(16).padStart(6, '0'))
            .setAlpha(1);

        ft._tween = this.scene.tweens.add({
            targets: ft,
            y: y - 64,
            alpha: 0,
            duration: 550,
            onComplete: () => {
                this._recycleToPool(ft, this._floatingTextPool);
            },
        });
    }

    /**
     * 显示加分飘字（使用对象池）
     */
    showBonusText(x, y, bonus, multiplier) {
        const ft = this._getFromPool(this._bonusTextPool, this._bonusPoolMax);
        if (!ft) return;

        const text = multiplier > 1 ? '+' + bonus + ' (x2)' : '+' + bonus;
        ft.setPosition(x, y - 24)
            .setText(text)
            .setFontSize('32px')
            .setColor(COLORS.WARNING_HEX)
            .setAlpha(1);

        ft._tween = this.scene.tweens.add({
            targets: ft,
            y: y - 100,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this._recycleToPool(ft, this._bonusTextPool);
            },
        });
    }

    /**
     * 显示成就提示
     */
    showAchievementToast(achievement) {
        const toast = this.scene.add.container(this.W / 2, 200).setDepth(UI_CONFIG.DEPTH.TOAST);
        
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x4a148c, 0.85);
        bg.fillRoundedRect(-280, -36, 560, 72, 24);
        bg.lineStyle(3, 0xea80fc, 0.7);
        bg.strokeRoundedRect(-280, -36, 560, 72, 24);

        const txt = this.scene.add.text(0, 0, achievement.icon + ' 解锁：' + achievement.name, {
            fontSize: '26px',
            color: '#ea80fc',
            fontStyle: 'bold',
            fontFamily: UI_CONFIG.FONT_FAMILY,
        }).setOrigin(0.5);

        toast.add([bg, txt]);

        this.scene.tweens.add({
            targets: toast,
            alpha: 0,
            y: 140,
            duration: VFX_CONFIG.ACH_TOAST_DURATION,
            delay: VFX_CONFIG.ACH_TOAST_DELAY,
            ease: 'Cubic.easeIn',
            onComplete: () => toast.destroy(),
        });
    }

    /**
     * 获取对象池状态（调试用）
     */
    getPoolStats() {
        return {
            floating: {
                total: this._floatingTextPool.length,
                active: this._floatingTextPool.filter(t => t.active).length,
            },
            bonus: {
                total: this._bonusTextPool.length,
                active: this._bonusTextPool.filter(t => t.active).length,
            },
        };
    }

    /**
     * 销毁所有 UI
     */
    destroy() {
        // 清理飘字对象池
        [...this._floatingTextPool, ...this._bonusTextPool].forEach(obj => {
            if (obj._tween) obj._tween.stop();
            obj.destroy();
        });
        this._floatingTextPool = [];
        this._bonusTextPool = [];
    }
}
