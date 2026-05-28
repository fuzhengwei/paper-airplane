/**
 * 输入管理器
 * 统一处理键盘、触屏输入
 * 支持虚拟摇杆、技能按钮、开火按钮
 */
class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.input = scene.input;
        this.scale = scene.scale;
        
        // 键盘状态
        this.cursors = null;
        this.wasd = null;
        
        // 触屏状态
        this.mobileVX = 0;
        this.mobileVY = 0;
        this.joyPointerId = -1;
        this.firePointerId = -1;
        this.joyBaseX = 0;
        this.joyBaseY = 0;
        
        // 图形对象
        this.joyBaseGfx = null;
        this.joyKnobGfx = null;
        this.fireBtnGfx = null;
        this.skillBtns = {};
        this.autoFireTimer = null;
        
        // 回调
        this.onShoot = null;
        this.onSkillUse = null;
        this.onPause = null;
        
        // 配置（使用常量）
        this.joystickRadius = INPUT_CONFIG.JOYSTICK_RADIUS;
        this.joystickDeadzone = INPUT_CONFIG.JOYSTICK_DEADZONE;
        this.fireZoneX = INPUT_CONFIG.FIRE_ZONE_X;
        this.fireZoneY = INPUT_CONFIG.FIRE_ZONE_Y;
        
        // 设备检测
        this.isMobile = this._detectMobile();
    }

    /**
     * 检测是否为移动设备
     */
    _detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
    }

    /**
     * 初始化输入系统
     */
    init(callbacks = {}) {
        this.onShoot = callbacks.onShoot || (() => {});
        this.onSkillUse = callbacks.onSkillUse || (() => {});
        this.onPause = callbacks.onPause || (() => {});

        this._initKeyboard();
        this._initTouch();
    }

    /**
     * 初始化键盘输入
     */
    _initKeyboard() {
        const { keyboard } = this.input;
        
        this.cursors = keyboard.createCursorKeys();
        this.wasd = {
            up: keyboard.addKey('W'),
            down: keyboard.addKey('S'),
            left: keyboard.addKey('A'),
            right: keyboard.addKey('D'),
        };

        // 射击
        keyboard.on('keydown-SPACE', (e) => {
            e.preventDefault();
            this.onShoot();
        });

        // 技能
        keyboard.on('keydown-E', () => this.onSkillUse('shield'));
        keyboard.on('keydown-Q', () => this.onSkillUse('bomb'));
        keyboard.on('keydown-R', () => this.onSkillUse('slowTime'));

        // 暂停
        keyboard.on('keydown-ESC', () => this.onPause());
    }

    /**
     * 初始化触屏输入
     */
    _initTouch() {
        const W = this.scale.width;
        const H = this.scale.height;

        // 虚拟摇杆图形（初始隐藏）
        this.joyBaseGfx = this.scene.add.graphics()
            .setDepth(UI_CONFIG.DEPTH.HUD - 1)
            .setAlpha(0)
            .setScrollFactor(0);
        this.joyKnobGfx = this.scene.add.graphics()
            .setDepth(UI_CONFIG.DEPTH.HUD - 1)
            .setAlpha(0)
            .setScrollFactor(0);

        // 开火按钮（右下角）
        const fbX = W - 110;
        const fbY = H - 130;
        this.fireBtnGfx = this.scene.add.graphics()
            .setDepth(UI_CONFIG.DEPTH.HUD - 1)
            .setScrollFactor(0);
        
        this.fireBtnGfx.fillStyle(COLORS.DANGER, 0.15);
        this.fireBtnGfx.fillCircle(fbX, fbY, 68);
        this.fireBtnGfx.lineStyle(4, COLORS.DANGER, 0.3);
        this.fireBtnGfx.strokeCircle(fbX, fbY, 68);
        
        const fireText = this.scene.add.text(fbX, fbY, 'FIRE', {
            fontSize: '22px',
            color: COLORS.DANGER_HEX,
            fontStyle: 'bold',
            fontFamily: UI_CONFIG.FONT_FAMILY,
        })
            .setOrigin(0.5)
            .setDepth(UI_CONFIG.DEPTH.HUD)
            .setScrollFactor(0)
            .setAlpha(0.4);

        // 技能按钮（右侧中间）
        const skillBtnSize = INPUT_CONFIG.SKILL_BTN_SIZE * 2;
        const skillBtnX = W - 80;
        const skillBtnStartY = H - 400;
        const skillBtnGap = INPUT_CONFIG.SKILL_BTN_GAP * 2;
        
        const skillConfigs = [
            { id: 'shield', key: 'E', label: '🛡️', color: SKILL_CONFIG.shield.color },
            { id: 'bomb', key: 'Q', label: '💣', color: SKILL_CONFIG.bomb.color },
            { id: 'slowTime', key: 'R', label: '⏱️', color: SKILL_CONFIG.slowTime.color },
        ];

        skillConfigs.forEach((config, index) => {
            const btnY = skillBtnStartY + index * skillBtnGap;
            
            const btnGfx = this.scene.add.graphics()
                .setDepth(UI_CONFIG.DEPTH.HUD - 1)
                .setScrollFactor(0);
            
            btnGfx.fillStyle(config.color, 0.15);
            btnGfx.fillCircle(skillBtnX, btnY, skillBtnSize);
            btnGfx.lineStyle(1.5, config.color, 0.4);
            btnGfx.strokeCircle(skillBtnX, btnY, skillBtnSize);
            
            const btnText = this.scene.add.text(skillBtnX, btnY, config.label, {
                fontSize: '32px',
                fontFamily: UI_CONFIG.FONT_FAMILY,
            })
                .setOrigin(0.5)
                .setDepth(UI_CONFIG.DEPTH.HUD)
                .setScrollFactor(0)
                .setAlpha(0.5);
            
            const keyText = this.scene.add.text(skillBtnX, btnY + skillBtnSize + 12, config.key, {
                fontSize: '20px',
                color: '#666',
                fontFamily: UI_CONFIG.FONT_FAMILY,
            })
                .setOrigin(0.5)
                .setDepth(UI_CONFIG.DEPTH.HUD)
                .setScrollFactor(0)
                .setAlpha(0.4);
            
            // 交互区域
            const hitZone = this.scene.add.zone(skillBtnX, btnY, skillBtnSize * 2, skillBtnSize * 2)
                .setInteractive({ useHandCursor: true })
                .setDepth(UI_CONFIG.DEPTH.HUD)
                .setScrollFactor(0);
            
            hitZone.on('pointerdown', () => {
                this.onSkillUse(config.id);
                // 视觉反馈
                btnGfx.clear();
                btnGfx.fillStyle(config.color, 0.35);
                btnGfx.fillCircle(skillBtnX, btnY, skillBtnSize);
                btnGfx.lineStyle(2, config.color, 0.7);
                btnGfx.strokeCircle(skillBtnX, btnY, skillBtnSize);
                this.scene.time.delayedCall(150, () => {
                    btnGfx.clear();
                    btnGfx.fillStyle(config.color, 0.15);
                    btnGfx.fillCircle(skillBtnX, btnY, skillBtnSize);
                    btnGfx.lineStyle(1.5, config.color, 0.4);
                    btnGfx.strokeCircle(skillBtnX, btnY, skillBtnSize);
                });
            });
            
            this.skillBtns[config.id] = { gfx: btnGfx, text: btnText, keyText, hitZone };
        });

        // 暂停按钮（右上角）
        const pauseX = W - 60;
        const pauseY = 60;
        const pauseGfx = this.scene.add.graphics()
            .setDepth(UI_CONFIG.DEPTH.HUD)
            .setScrollFactor(0);
        
        pauseGfx.fillStyle(0xffffff, 0.1);
        pauseGfx.fillCircle(pauseX, pauseY, INPUT_CONFIG.PAUSE_BTN_SIZE * 2);
        pauseGfx.lineStyle(3, 0xffffff, 0.3);
        pauseGfx.strokeCircle(pauseX, pauseY, INPUT_CONFIG.PAUSE_BTN_SIZE * 2);
        
        const pauseText = this.scene.add.text(pauseX, pauseY, '⏸', {
            fontSize: '28px',
            fontFamily: UI_CONFIG.FONT_FAMILY,
        })
            .setOrigin(0.5)
            .setDepth(UI_CONFIG.DEPTH.HUD)
            .setScrollFactor(0)
            .setAlpha(0.5);
        
        const pauseZone = this.scene.add.zone(pauseX, pauseY, 72, 72)
            .setInteractive({ useHandCursor: true })
            .setDepth(UI_CONFIG.DEPTH.HUD)
            .setScrollFactor(0);
        
        pauseZone.on('pointerdown', () => this.onPause());

        // 触摸事件
        this.input.on('pointerdown', this._onPointerDown, this);
        this.input.on('pointermove', this._onPointerMove, this);
        this.input.on('pointerup', this._onPointerUp, this);
    }

    /**
     * 触摸按下
     */
    _onPointerDown(pointer) {
        const W = this.scale.width;
        const H = this.scale.height;

        // 检查是否点击了技能按钮或暂停按钮区域
        const rightMargin = 160;
        const isRightButtonArea = pointer.x > W - rightMargin;
        
        if (isRightButtonArea) {
            // 右侧按钮区域，不触发摇杆和射击
            return;
        }

        // 开火区域（右下，排除按钮区域）
        if (pointer.x > W * this.fireZoneX && pointer.y > H * this.fireZoneY) {
            this.firePointerId = pointer.id;
            this.onShoot();
            this.autoFireTimer = this.scene.time.addEvent({
                delay: BULLET_CONFIG.AUTO_FIRE_INTERVAL,
                loop: true,
                callback: () => this.onShoot(),
            });
        }
        // 摇杆区域（左半）
        else if (pointer.x < W * 0.5) {
            this.joyPointerId = pointer.id;
            this.joyBaseX = pointer.x;
            this.joyBaseY = pointer.y;
            
            // 显示摇杆
            this._drawJoystick(pointer.x, pointer.y, 0, 0);
            this.joyBaseGfx.setAlpha(0.4);
            this.joyKnobGfx.setAlpha(0.6);
        }
        // 其他区域（直接射击）
        else {
            this.onShoot();
        }
    }

    /**
     * 绘制摇杆
     */
    _drawJoystick(baseX, baseY, knobOffsetX, knobOffsetY) {
        // 底盘
        this.joyBaseGfx.clear();
        this.joyBaseGfx.fillStyle(0xffffff, 0.08);
        this.joyBaseGfx.fillCircle(baseX, baseY, this.joystickRadius);
        this.joyBaseGfx.lineStyle(3, 0xffffff, 0.15);
        this.joyBaseGfx.strokeCircle(baseX, baseY, this.joystickRadius);
        
        // 内圈
        this.joyBaseGfx.fillStyle(0xffffff, 0.05);
        this.joyBaseGfx.fillCircle(baseX, baseY, this.joystickDeadzone * 2);
        
        // 摇杆头
        this.joyKnobGfx.clear();
        this.joyKnobGfx.fillStyle(0xffffff, 0.25);
        this.joyKnobGfx.fillCircle(baseX + knobOffsetX, baseY + knobOffsetY, 44);
        this.joyKnobGfx.lineStyle(4, 0xffffff, 0.3);
        this.joyKnobGfx.strokeCircle(baseX + knobOffsetX, baseY + knobOffsetY, 44);
    }

    /**
     * 触摸移动
     */
    _onPointerMove(pointer) {
        if (pointer.id !== this.joyPointerId || !pointer.isDown) return;

        const dx = pointer.x - this.joyBaseX;
        const dy = pointer.y - this.joyBaseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 应用死区
        if (dist < this.joystickDeadzone) {
            this.mobileVX = 0;
            this.mobileVY = 0;
            this._drawJoystick(this.joyBaseX, this.joyBaseY, 0, 0);
            return;
        }
        
        const clampedDist = Math.min(dist, this.joystickRadius);
        const angle = Math.atan2(dy, dx);
        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;

        // 更新摇杆位置
        this._drawJoystick(this.joyBaseX, this.joyBaseY, knobX, knobY);

        // 计算输入值 (-1 到 1)，应用平滑曲线
        const normalizedDist = (clampedDist - this.joystickDeadzone) / (this.joystickRadius - this.joystickDeadzone);
        const smoothFactor = normalizedDist * normalizedDist;  // 二次曲线，更平滑
        
        this.mobileVX = Math.cos(angle) * smoothFactor;
        this.mobileVY = Math.sin(angle) * smoothFactor;
    }

    /**
     * 触摸抬起
     */
    _onPointerUp(pointer) {
        if (pointer.id === this.joyPointerId) {
            this.joyPointerId = -1;
            this.joyBaseGfx.clear().setAlpha(0);
            this.joyKnobGfx.clear().setAlpha(0);
            this.mobileVX = 0;
            this.mobileVY = 0;
        }
        
        if (pointer.id === this.firePointerId) {
            this.firePointerId = -1;
            if (this.autoFireTimer) {
                this.autoFireTimer.remove();
                this.autoFireTimer = null;
            }
        }
    }

    /**
     * 获取移动向量
     * @returns {{ x: number, y: number }} 归一化的移动向量
     */
    getMovement() {
        let vx = 0;
        let vy = 0;

        // 键盘输入
        if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;
        if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
        if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;

        // 触屏输入
        if (this.joyPointerId >= 0) {
            vx += this.mobileVX;
            vy += this.mobileVY;
        }

        // 归一化
        const length = Math.sqrt(vx * vx + vy * vy);
        if (length > 1) {
            vx /= length;
            vy /= length;
        }

        return { x: vx, y: vy };
    }

    /**
     * 是否有摇杆输入
     */
    hasJoystickInput() {
        return this.joyPointerId >= 0;
    }

    /**
     * 是否为移动设备
     */
    isMobileDevice() {
        return this.isMobile;
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.input.off('pointerdown', this._onPointerDown, this);
        this.input.off('pointermove', this._onPointerMove, this);
        this.input.off('pointerup', this._onPointerUp, this);
        
        if (this.autoFireTimer) {
            this.autoFireTimer.remove();
        }
    }
}
