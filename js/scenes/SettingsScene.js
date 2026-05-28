// ======== Settings（带音量控制） ========
class SettingsScene extends Phaser.Scene {
    constructor() {
        super('Settings');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        this.cameras.main.setBackgroundColor(COLORS.BG_HEX);

        // 背景装饰
        for (let i = 0; i < 40; i++) {
            this.add.image(Math.random() * W, Math.random() * H, 'dot')
                .setAlpha(0.2 + Math.random() * 0.2)
                .setScale(0.2 + Math.random() * 0.4);
        }

        // 标题
        this.add.text(W / 2, H * 0.06, '⚙️ 设置', {
            fontSize: '52px',
            color: COLORS.ACCENT_HEX,
            fontStyle: 'bold',
            fontFamily: UI_CONFIG.FONT_FAMILY,
        }).setOrigin(0.5);

        const settings = DataStore.getSettings();
        
        // 确保音量设置存在
        if (settings.volume === undefined) settings.volume = 0.7;
        if (settings.sfxVolume === undefined) settings.sfxVolume = 0.8;

        // ========== 音效开关 ==========
        const soundY = H * 0.16;
        this._createSettingItem(40, soundY, W - 80, '🔊 音效', settings.sound, (value) => {
            settings.sound = value;
            DataStore.saveSettings(settings);
        });

        // ========== 主音量滑块 ==========
        const volY = H * 0.24;
        this._createVolumeSlider(40, volY, W - 80, '🔈 主音量', settings.volume, (value) => {
            settings.volume = value;
            DataStore.saveSettings(settings);
        });

        // ========== 音效音量滑块 ==========
        const sfxVolY = H * 0.32;
        this._createVolumeSlider(40, sfxVolY, W - 80, '🔉 音效音量', settings.sfxVolume, (value) => {
            settings.sfxVolume = value;
            DataStore.saveSettings(settings);
        });

        // ========== 难度选择 ==========
        const diffY = H * 0.42;
        const diffBg = this.add.graphics();
        diffBg.fillStyle(0x1a237e, 0.4);
        diffBg.fillRoundedRect(40, diffY - 36, W - 80, 84, 20);
        diffBg.lineStyle(2, 0x536dfe, 0.3);
        diffBg.strokeRoundedRect(40, diffY - 36, W - 80, 84, 20);
        this.add.text(64, diffY, '🎮 难度', {
            fontSize: '30px',
            color: COLORS.TEXT_SECONDARY,
            fontFamily: UI_CONFIG.FONT_FAMILY,
        }).setOrigin(0, 0.5);

        const diffOptions = ['easy', 'normal', 'hard'];
        const diffLabels = { 'easy': '简单 🟢', 'normal': '普通 🟡', 'hard': '困难 🔴' };
        const diffColors = { 'easy': COLORS.SUCCESS_HEX, 'normal': COLORS.WARNING_HEX, 'hard': COLORS.DANGER_HEX };

        this.diffBtn = this.add.text(W - 64, diffY, diffLabels[settings.difficulty], {
            fontSize: '30px',
            color: diffColors[settings.difficulty],
            fontFamily: UI_CONFIG.FONT_FAMILY,
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        
        this.diffBtn.on('pointerover', () => this.diffBtn.setColor(COLORS.ACCENT_HEX));
        this.diffBtn.on('pointerout', () => this.diffBtn.setColor(diffColors[settings.difficulty]));
        this.diffBtn.on('pointerdown', () => {
            const idx = diffOptions.indexOf(settings.difficulty);
            settings.difficulty = diffOptions[(idx + 1) % diffOptions.length];
            DataStore.saveSettings(settings);
            this.diffBtn.setText(diffLabels[settings.difficulty]);
            this.diffBtn.setColor(diffColors[settings.difficulty]);
        });

        // ========== 难度说明 ==========
        const descY = H * 0.52;
        this.add.text(W / 2, descY, '简单：敌人慢、血量低、道具多\n普通：标准难度\n困难：敌人快、血量高、道具少', {
            fontSize: '22px',
            color: COLORS.TEXT_MUTED,
            fontFamily: UI_CONFIG.FONT_FAMILY,
            align: 'center',
            lineSpacing: 12,
        }).setOrigin(0.5);

        // ========== 自动射击 ==========
        const autoY = H * 0.63;
        this._createSettingItem(40, autoY, W - 80, '🔫 自动射击', settings.autoFire, (value) => {
            settings.autoFire = value;
            DataStore.saveSettings(settings);
        });

        // ========== 震动效果 ==========
        const shakeY = H * 0.71;
        this._createSettingItem(40, shakeY, W - 80, '📳 屏幕震动', settings.screenShake, (value) => {
            settings.screenShake = value;
            DataStore.saveSettings(settings);
        });

        // ========== 重置数据 ==========
        const resetY = H * 0.82;
        const resetBg = this.add.graphics();
        resetBg.fillStyle(0x3e2723, 0.5);
        resetBg.fillRoundedRect(40, resetY - 36, W - 80, 84, 20);
        resetBg.lineStyle(3, 0xff5252, 0.5);
        resetBg.strokeRoundedRect(40, resetY - 36, W - 80, 84, 20);
        this.add.text(64, resetY, '🗑️ 重置所有数据', {
            fontSize: '30px',
            color: '#ff8a80',
            fontFamily: UI_CONFIG.FONT_FAMILY,
        }).setOrigin(0, 0.5);

        const resetBtn = this.add.text(W - 64, resetY, '重置', {
            fontSize: '28px',
            color: COLORS.DANGER_HEX,
            fontFamily: UI_CONFIG.FONT_FAMILY,
            fontStyle: 'bold',
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        
        resetBtn.on('pointerover', () => resetBtn.setColor('#ff8a80'));
        resetBtn.on('pointerout', () => resetBtn.setColor(COLORS.DANGER_HEX));
        resetBtn.on('pointerdown', () => {
            if (confirm('确定要重置所有游戏数据吗？\n包括排行榜、统计和成就！')) {
                DataStore.resetAll();
                this.add.text(W / 2, H * 0.89, '✅ 已重置', {
                    fontSize: '32px',
                    color: COLORS.SUCCESS_HEX,
                    fontStyle: 'bold',
                }).setOrigin(0.5);
            }
        });

        // ========== 返回按钮 ==========
        const back = this.add.text(W / 2, H * 0.94, '🏠 返回菜单', {
            fontSize: '30px',
            color: '#80cbc4',
            fontFamily: UI_CONFIG.FONT_FAMILY,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        back.on('pointerover', () => back.setColor(COLORS.ACCENT_HEX));
        back.on('pointerout', () => back.setColor('#80cbc4'));
        back.on('pointerdown', () => this.scene.start('Menu'));
        this.input.keyboard.once('keydown-ESC', () => this.scene.start('Menu'));
    }

    /**
     * 创建开关类型设置项
     */
    _createSettingItem(x, y, width, label, value, onChange) {
        const bg = this.add.graphics();
        bg.fillStyle(0x1a237e, 0.4);
        bg.fillRoundedRect(x, y - 36, width, 84, 20);
        bg.lineStyle(2, 0x536dfe, 0.3);
        bg.strokeRoundedRect(x, y - 36, width, 84, 20);

        this.add.text(x + 24, y, label, {
            fontSize: '30px',
            color: COLORS.TEXT_SECONDARY,
            fontFamily: UI_CONFIG.FONT_FAMILY,
        }).setOrigin(0, 0.5);

        const btn = this.add.text(x + width - 24, y, value ? '✅ 开启' : '❌ 关闭', {
            fontSize: '30px',
            color: value ? COLORS.SUCCESS_HEX : COLORS.DANGER_HEX,
            fontFamily: UI_CONFIG.FONT_FAMILY,
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setColor(COLORS.ACCENT_HEX));
        btn.on('pointerout', () => btn.setColor(btn.getData('value') ? COLORS.SUCCESS_HEX : COLORS.DANGER_HEX));
        
        btn.setData('value', value);
        btn.on('pointerdown', () => {
            const newValue = !btn.getData('value');
            btn.setData('value', newValue);
            btn.setText(newValue ? '✅ 开启' : '❌ 关闭');
            btn.setColor(newValue ? COLORS.SUCCESS_HEX : COLORS.DANGER_HEX);
            onChange(newValue);
        });

        return btn;
    }

    /**
     * 创建滑块类型设置项
     */
    _createVolumeSlider(x, y, width, label, value, onChange) {
        const bg = this.add.graphics();
        bg.fillStyle(0x1a237e, 0.4);
        bg.fillRoundedRect(x, y - 36, width, 104, 20);
        bg.lineStyle(2, 0x536dfe, 0.3);
        bg.strokeRoundedRect(x, y - 36, width, 104, 20);

        this.add.text(x + 24, y - 8, label, {
            fontSize: '30px',
            color: COLORS.TEXT_SECONDARY,
            fontFamily: UI_CONFIG.FONT_FAMILY,
        }).setOrigin(0, 0.5);

        // 滑块配置
        const sliderX = x + 200;
        const sliderWidth = width - 320;
        const sliderY = y + 24;

        // 滑块轨道背景
        const trackBg = this.add.graphics();
        trackBg.fillStyle(0x333355, 0.8);
        trackBg.fillRoundedRect(sliderX, sliderY - 6, sliderWidth, 12, 6);

        // 滑块轨道填充
        const trackFill = this.add.graphics();
        const updateTrackFill = (v) => {
            trackFill.clear();
            trackFill.fillStyle(COLORS.PRIMARY_LIGHT, 0.9);
            trackFill.fillRoundedRect(sliderX, sliderY - 6, sliderWidth * v, 12, 6);
        };
        updateTrackFill(value);

        // 滑块手柄
        const handleX = sliderX + sliderWidth * value;
        const handle = this.add.graphics();
        handle.fillStyle(0xffffff, 1);
        handle.fillCircle(handleX, sliderY, 16);
        handle.lineStyle(4, COLORS.PRIMARY_LIGHT, 0.8);
        handle.strokeCircle(handleX, sliderY, 16);

        // 音量百分比文本
        const percentText = this.add.text(x + width - 24, y - 8, Math.round(value * 100) + '%', {
            fontSize: '26px',
            color: COLORS.TEXT_MUTED,
            fontFamily: UI_CONFIG.FONT_FAMILY,
        }).setOrigin(1, 0.5);

        // 交互区域
        const hitZone = this.add.zone(sliderX + sliderWidth / 2, sliderY, sliderWidth, 40)
            .setInteractive({ useHandCursor: true });

        let isDragging = false;

        const updateValue = (pointerX) => {
            const localX = pointerX - sliderX;
            const newValue = Phaser.Math.Clamp(localX / sliderWidth, 0, 1);
            
            // 更新视觉
            updateTrackFill(newValue);
            handle.clear();
            handle.fillStyle(0xffffff, 1);
            handle.fillCircle(sliderX + sliderWidth * newValue, sliderY, 16);
            handle.lineStyle(4, COLORS.PRIMARY_LIGHT, 0.8);
            handle.strokeCircle(sliderX + sliderWidth * newValue, sliderY, 16);
            
            percentText.setText(Math.round(newValue * 100) + '%');
            
            onChange(newValue);
        };

        hitZone.on('pointerdown', (pointer) => {
            isDragging = true;
            updateValue(pointer.x);
        });

        this.input.on('pointermove', (pointer) => {
            if (isDragging) {
                updateValue(pointer.x);
            }
        });

        this.input.on('pointerup', () => {
            isDragging = false;
        });

        return { trackBg, trackFill, handle, percentText };
    }
}