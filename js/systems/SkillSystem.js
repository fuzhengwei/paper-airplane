/**
 * 技能系统
 * 管理护盾、炸弹、时间减缓等技能
 */
class SkillSystem {
    constructor(scene) {
        this.scene = scene;
        
        // 技能状态
        this.skills = {
            shield: {
                cd: SKILL_CONFIG.shield.cooldown,
                lastUsed: 0,
                active: false,
                duration: SKILL_CONFIG.shield.duration,
                timer: null,
            },
            bomb: {
                cd: SKILL_CONFIG.bomb.cooldown,
                lastUsed: 0,
                active: false,
            },
            slowTime: {
                cd: SKILL_CONFIG.slowTime.cooldown,
                lastUsed: 0,
                active: false,
                duration: SKILL_CONFIG.slowTime.duration,
                timer: null,
            },
        };
        
        // 护盾图形
        this.shieldGfx = null;
        
        // 游戏速度（用于时间减缓）
        this.gameSpeed = 1;
    }

    /**
     * 初始化技能系统
     */
    init() {
        this.shieldGfx = this.scene.add.graphics()
            .setDepth(UI_CONFIG.DEPTH.SHIELD)
            .setVisible(false);
    }

    /**
     * 使用技能
     * @param {string} id - 技能ID
     * @param {object} context - 游戏上下文
     * @returns {boolean} 是否成功使用
     */
    useSkill(id, context = {}) {
        if (context.dead || context.quizOn || context.paused) return false;
        
        const skill = this.skills[id];
        const now = Date.now();
        
        // 检查冷却
        if (now - skill.lastUsed < skill.cd) return false;

        switch (id) {
            case 'shield':
                return this._activateShield(skill, now, context);
            case 'bomb':
                return this._activateBomb(skill, now, context);
            case 'slowTime':
                return this._activateSlowTime(skill, now, context);
            default:
                return false;
        }
    }

    /**
     * 激活护盾
     */
    _activateShield(skill, now, context) {
        if (skill.active) return false;
        
        skill.active = true;
        skill.lastUsed = now;
        
        this.shieldGfx.setVisible(true);
        
        if (context.sfx) context.sfx.shield();
        if (context.onFlyText) context.onFlyText('🛡️ 护盾!', SKILL_CONFIG.shield.color);
        
        skill.timer = this.scene.time.delayedCall(skill.duration, () => {
            skill.active = false;
            this.shieldGfx.setVisible(false);
        });
        
        return true;
    }

    /**
     * 激活炸弹
     */
    _activateBomb(skill, now, context) {
        skill.lastUsed = now;
        
        if (context.sfx) context.sfx.bomb();
        
        // 销毁所有敌机
        if (context.enemyGrp) {
            context.enemyGrp.getChildren().forEach(enemy => {
                if (enemy.active) {
                    if (context.onBoom) context.onBoom(enemy.x, enemy.y, 8);
                    if (context.onEnemyKill) context.onEnemyKill(enemy);
                }
            });
        }
        
        // 清除 Boss 弹幕
        if (context.bossBulletGrp) {
            context.bossBulletGrp.getChildren().forEach(bullet => {
                if (bullet.active) {
                    bullet.setActive(false).setVisible(false);
                    bullet.body.stop();
                }
            });
        }
        
        // 全屏闪白
        const flash = this.scene.add.graphics()
            .setDepth(UI_CONFIG.DEPTH.PAUSE)
            .fillStyle(0xffffff, SKILL_CONFIG.bomb.flashAlpha)
            .fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 400,
            onComplete: () => flash.destroy(),
        });
        
        // 震屏
        this.scene.cameras.main.shake(
            SKILL_CONFIG.bomb.screenShake.duration,
            SKILL_CONFIG.bomb.screenShake.intensity
        );
        
        if (context.onFlyText) context.onFlyText('💣 全屏炸弹!', SKILL_CONFIG.bomb.color);
        
        return true;
    }

    /**
     * 激活时间减缓
     */
    _activateSlowTime(skill, now, context) {
        skill.active = true;
        skill.lastUsed = now;
        this.gameSpeed = SKILL_CONFIG.slowTime.slowFactor;
        
        if (context.sfx) context.sfx.slowTime();
        if (context.onFlyText) context.onFlyText('⏱️ 时间减缓!', SKILL_CONFIG.slowTime.color);
        
        skill.timer = this.scene.time.delayedCall(skill.duration, () => {
            skill.active = false;
            this.gameSpeed = 1;
        });
        
        return true;
    }

    /**
     * 处理护盾碰撞
     * @returns {boolean} 是否格挡了伤害
     */
    handleShieldBlock(context) {
        if (!this.skills.shield.active) return false;
        
        if (context.sfx) context.sfx.shield();
        if (context.onFlyText) context.onFlyText('🛡️ 格挡!', SKILL_CONFIG.shield.color);
        
        return true;
    }

    /**
     * 绘制护盾
     */
    drawShield(player) {
        this.shieldGfx.clear();
        
        if (!this.skills.shield.active || !player.active) return;
        
        const radius = SKILL_CONFIG.shield.radius;
        const color = SKILL_CONFIG.shield.color;
        
        this.shieldGfx.lineStyle(3, color, 0.6);
        this.shieldGfx.strokeCircle(player.x, player.y, radius);
        this.shieldGfx.fillStyle(color, 0.1);
        this.shieldGfx.fillCircle(player.x, player.y, radius);
    }

    /**
     * 激活道具护盾（无冷却）
     */
    activateItemShield() {
        this.skills.shield.active = true;
        this.skills.shield.lastUsed = 0;
        this.shieldGfx.setVisible(true);
        
        this.scene.time.delayedCall(ITEM_CONFIG.SHIELD_DURATION, () => {
            this.skills.shield.active = false;
            this.shieldGfx.setVisible(false);
        });
    }

    /**
     * 获取技能状态
     */
    getSkills() {
        return this.skills;
    }

    /**
     * 获取游戏速度
     */
    getGameSpeed() {
        return this.gameSpeed;
    }

    /**
     * 重置技能状态
     */
    reset() {
        Object.values(this.skills).forEach(skill => {
            if (skill.timer) skill.timer.remove();
            skill.active = false;
            skill.lastUsed = 0;
        });
        this.gameSpeed = 1;
        this.shieldGfx.setVisible(false);
        this.shieldGfx.clear();
    }

    /**
     * 销毁系统
     */
    destroy() {
        this.reset();
    }
}
