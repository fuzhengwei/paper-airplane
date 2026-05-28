// ======== Boot（带加载进度条） ========
class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const m = this.make;

        // ========== 加载界面 ==========
        this.cameras.main.setBackgroundColor(COLORS.BG_HEX);

        // 标题
        const title = this.add.text(W / 2, H * 0.3, '✈️ 编程纸飞机作战', {
            fontSize: '28px',
            color: COLORS.ACCENT_HEX,
            fontStyle: 'bold',
            fontFamily: UI_CONFIG.FONT_FAMILY,
        }).setOrigin(0.5);

        // 加载提示
        const loadText = this.add.text(W / 2, H * 0.5, '正在加载资源...', {
            fontSize: '14px',
            color: COLORS.TEXT_SECONDARY,
            fontFamily: UI_CONFIG.FONT_FAMILY,
        }).setOrigin(0.5);

        // 进度条
        const barWidth = W * 0.6;
        const barHeight = LOADING_CONFIG.PROGRESS_BAR_HEIGHT;
        const barX = (W - barWidth) / 2;
        const barY = H * 0.58;

        const progressBg = this.add.graphics();
        progressBg.fillStyle(0x222244, 0.8);
        progressBg.fillRoundedRect(barX, barY, barWidth, barHeight, 6);

        const progressBar = this.add.graphics();

        const percentText = this.add.text(W / 2, barY + barHeight + 20, '0%', {
            fontSize: '13px',
            color: COLORS.TEXT_MUTED,
            fontFamily: UI_CONFIG.FONT_FAMILY,
        }).setOrigin(0.5);

        // ========== 纹理生成任务列表 ==========
        // 高分辨率下纹理尺寸放大 2 倍
        const S = 2; // 缩放系数
        const tasks = [
            { label: '加载子弹纹理...', fn: () => {
                let g = m.graphics({ add: false });
                g.fillStyle(0xfff176); g.fillCircle(4*S, 10*S, 3*S);
                g.fillStyle(0xffffff); g.fillCircle(4*S, 6*S, 4*S);
                g.generateTexture('bullet', 8*S, 16*S); g.destroy();
            }},
            { label: '加载粒子纹理...', fn: () => {
                let g = m.graphics({ add: false });
                g.fillStyle(0xffffff); g.fillCircle(4*S, 4*S, 4*S);
                g.generateTexture('dot', 8*S, 8*S); g.destroy();
                g = m.graphics({ add: false });
                g.fillStyle(0xffffff); g.fillCircle(8*S, 8*S, 8*S);
                g.generateTexture('glow', 16*S, 16*S); g.destroy();
            }},
            { label: '加载弹药道具...', fn: () => {
                let g = m.graphics({ add: false });
                g.fillStyle(0x69f0ae); g.fillRoundedRect(0, 0, 22*S, 18*S, 5*S);
                g.lineStyle(1.5*S, 0xffffff, 0.5); g.strokeRoundedRect(0, 0, 22*S, 18*S, 5*S);
                g.generateTexture('itemAmmo', 22*S, 18*S); g.destroy();
            }},
            { label: '加载血量道具...', fn: () => {
                let g = m.graphics({ add: false });
                g.fillStyle(0xff5252); g.fillRoundedRect(0, 0, 22*S, 18*S, 5*S);
                g.lineStyle(1.5*S, 0xffffff, 0.5); g.strokeRoundedRect(0, 0, 22*S, 18*S, 5*S);
                g.generateTexture('itemHp', 22*S, 18*S); g.destroy();
            }},
            { label: '加载答题道具...', fn: () => {
                let g = m.graphics({ add: false });
                g.fillStyle(0xffd740); g.fillRoundedRect(0, 0, 26*S, 22*S, 6*S);
                g.lineStyle(2*S, 0xffffff, 0.7); g.strokeRoundedRect(0, 0, 26*S, 22*S, 6*S);
                g.generateTexture('itemQuiz', 26*S, 22*S); g.destroy();
            }},
            { label: '加载护盾道具...', fn: () => {
                let g = m.graphics({ add: false });
                g.fillStyle(0x42a5f5, 0.9); g.fillCircle(12*S, 12*S, 11*S);
                g.lineStyle(2*S, 0x90caf9, 1); g.strokeCircle(12*S, 12*S, 11*S);
                g.fillStyle(0xffffff, 0.7); g.fillCircle(12*S, 12*S, 5*S);
                g.generateTexture('itemShield', 24*S, 24*S); g.destroy();
            }},
            { label: '加载散射道具...', fn: () => {
                let g = m.graphics({ add: false });
                g.fillStyle(0xffab40, 0.9); g.fillRoundedRect(0, 0, 24*S, 20*S, 6*S);
                g.lineStyle(1.5*S, 0xffffff, 0.6); g.strokeRoundedRect(0, 0, 24*S, 20*S, 6*S);
                g.lineStyle(2*S, 0xffffff, 0.8);
                g.beginPath(); g.moveTo(6*S, 16*S); g.lineTo(12*S, 4*S); g.strokePath();
                g.beginPath(); g.moveTo(12*S, 16*S); g.lineTo(12*S, 4*S); g.strokePath();
                g.beginPath(); g.moveTo(18*S, 16*S); g.lineTo(12*S, 4*S); g.strokePath();
                g.generateTexture('itemSpread', 24*S, 20*S); g.destroy();
            }},
            { label: '加载双倍分道具...', fn: () => {
                let g = m.graphics({ add: false });
                g.fillStyle(0xe040fb, 0.9); g.fillRoundedRect(0, 0, 24*S, 20*S, 6*S);
                g.lineStyle(1.5*S, 0xffffff, 0.6); g.strokeRoundedRect(0, 0, 24*S, 20*S, 6*S);
                g.generateTexture('itemDouble', 24*S, 20*S); g.destroy();
            }},
            { label: '加载敌机纹理...', fn: () => {
                [['e0', 0xef5350, 0xff8a80, 28], ['e1', 0xff7043, 0xffab91, 28],
                 ['e2', 0xab47bc, 0xce93d8, 28], ['e3', 0xe53935, 0xff5252, 38],
                 ['e4', 0x26c6da, 0x80deea, 26], ['e5', 0xffa726, 0xffcc80, 30]].forEach(([k, c1, c2, s]) => {
                    const ss = s * S;
                    const eg = m.graphics({ add: false }), h = ss / 2;
                    eg.fillStyle(c2, 0.85); eg.fillTriangle(h, ss - 2*S, 1*S, 2*S, ss - 1*S, 2*S);
                    eg.fillStyle(c1, 0.9); eg.fillTriangle(h, ss - 4*S, 3*S, 4*S, ss - 3*S, 4*S);
                    eg.lineStyle(1*S, 0xffffff, 0.3); eg.strokeTriangle(h, ss - 2*S, 1*S, 2*S, ss - 1*S, 2*S);
                    eg.generateTexture(k, ss, ss); eg.destroy();
                });
            }},
            { label: '加载 Boss 纹理...', fn: () => {
                let g = m.graphics({ add: false });
                g.fillStyle(0xff1744); g.fillCircle(6*S, 6*S, 6*S);
                g.fillStyle(0xff8a80, 0.6); g.fillCircle(6*S, 6*S, 3*S);
                g.generateTexture('bossBullet', 12*S, 12*S); g.destroy();
            }},
            { label: '加载玩家纹理...', fn: () => {
                const pg = m.graphics({ add: false }), c = 26*S;
                pg.fillStyle(0x000000, 0.15); pg.fillTriangle(c - 17*S, c + 19*S, c, c - 26*S, c + 17*S, c + 19*S);
                pg.fillStyle(0xfff9c4); pg.fillTriangle(c - 19*S, c + 17*S, c, c - 28*S, c + 19*S, c + 17*S);
                pg.fillStyle(0xffe082); pg.fillTriangle(c - 11*S, c + 11*S, c, c - 25*S, c + 11*S, c + 11*S);
                pg.fillStyle(0x4dd0e1, 0.95); pg.fillCircle(c - 3*S, c - 5*S, 4*S); pg.fillCircle(c + 3*S, c - 5*S, 4*S);
                pg.lineStyle(2*S, 0xff8f00, 0.55); pg.beginPath(); pg.moveTo(c, c - 26*S); pg.lineTo(c, c + 14*S); pg.strokePath();
                pg.fillStyle(0xff6d00, 0.65); pg.fillCircle(c, c + 15*S, 3.5*S);
                pg.fillStyle(0xffe082); pg.fillTriangle(c - 17*S, c + 17*S, c - 5*S, c + 11*S, c - 17*S, c + 9*S);
                pg.fillTriangle(c + 17*S, c + 17*S, c + 5*S, c + 11*S, c + 17*S, c + 9*S);
                pg.generateTexture('player', 52*S, 52*S); pg.destroy();
            }},
            { label: '加载完成！', fn: () => {} },
        ];

        const total = tasks.length;
        let index = 0;

        // 逐步执行任务
        const runNext = () => {
            if (index >= total) return;

            const task = tasks[index];
            task.fn();
            index++;

            // 更新进度条
            const progress = index / total;
            progressBar.clear();
            progressBar.fillStyle(COLORS.PRIMARY_LIGHT, 1);
            progressBar.fillRoundedRect(barX + 2, barY + 2, (barWidth - 4) * progress, barHeight - 4, 4);
            percentText.setText(Math.round(progress * 100) + '%');
            loadText.setText(task.label);

            if (index < total) {
                this.time.delayedCall(LOADING_CONFIG.STEP_DELAY, runNext);
            } else {
                // 全部完成后跳转
                this.time.delayedCall(LOADING_CONFIG.COMPLETE_DELAY, () => {
                    this.scene.start('Login');
                });
            }
        };

        // 启动加载
        this.time.delayedCall(100, runNext);
    }
}
