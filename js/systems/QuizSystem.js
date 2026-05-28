/**
 * 答题系统
 * 管理答题卡片的显示和交互
 */
class QuizSystem {
    constructor(scene) {
        this.scene = scene;
        this.W = scene.scale.width;
        this.H = scene.scale.height;
        
        // 状态
        this.active = false;
        this.currentQuiz = null;
        
        // UI 元素
        this.elements = [];
        this.mask = null;
        this.card = null;
        
        // 键盘监听引用
        this.keyA = null;
        this.keyB = null;
        
        // 回调
        this.onAnswer = null;
        
        // 已答题目索引（防重复）
        this.askedIndices = new Set();
    }

    /**
     * 初始化答题系统
     * @param {Function} onAnswer - 答题回调 (correct: boolean) => void
     */
    init(onAnswer) {
        this.onAnswer = onAnswer;
    }

    /**
     * 显示答题卡片
     */
    show() {
        if (this.active) return;
        
        this.active = true;
        this.currentQuiz = this._getRandomQuiz();
        
        const quiz = this.currentQuiz;
        const cx = this.W / 2;
        const cy = this.H / 2 - 20;
        const cw = Math.min(this.W - 72, QUIZ_CONFIG.CARD_WIDTH * 2);
        const ch = QUIZ_CONFIG.CARD_HEIGHT * 2;

        // 遮罩
        this.mask = this.scene.add.graphics()
            .setDepth(UI_CONFIG.DEPTH.QUIZ)
            .setAlpha(0);
        this.mask.fillStyle(0x000000, 0.72);
        this.mask.fillRect(0, 0, this.W, this.H);
        this.scene.tweens.add({ targets: this.mask, alpha: 1, duration: 200 });

        // 卡片背景
        this.card = this.scene.add.graphics()
            .setDepth(UI_CONFIG.DEPTH.QUIZ + 1)
            .setAlpha(0);
        this.card.fillStyle(0x121858, 0.97);
        this.card.fillRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 40);
        this.card.lineStyle(5, 0x536dfe, 0.85);
        this.card.strokeRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 40);
        this.card.fillStyle(0x536dfe, 0.5);
        this.card.fillRoundedRect(cx - cw / 2 + 32, cy - ch / 2 + 28, cw - 64, 6, 4);
        
        this.card.setScale(0.7);
        this.scene.tweens.add({
            targets: this.card,
            alpha: 1,
            scale: 1,
            duration: 280,
            ease: 'Back.easeOut',
        });

        // 题目类型标签
        const tag = this.scene.add.text(cx, cy - ch / 2 + 76, '📝 ' + quiz.t + '题', {
            fontSize: '26px',
            color: '#90caf9',
            fontFamily: UI_CONFIG.FONT_FAMILY,
        })
            .setOrigin(0.5)
            .setDepth(UI_CONFIG.DEPTH.QUIZ + 2)
            .setAlpha(0);
        this.scene.tweens.add({ targets: tag, alpha: 1, duration: 200, delay: 100 });
        this.elements.push(tag);

        // 问题文本
        const qTxt = this.scene.add.text(cx, cy - 36, quiz.q, {
            fontSize: '42px',
            color: '#ffffff',
            fontStyle: 'bold',
            fontFamily: UI_CONFIG.FONT_FAMILY,
            wordWrap: { width: cw - 80 },
            align: 'center',
        })
            .setOrigin(0.5)
            .setDepth(UI_CONFIG.DEPTH.QUIZ + 2)
            .setAlpha(0);
        this.scene.tweens.add({ targets: qTxt, alpha: 1, duration: 200, delay: 150 });
        this.elements.push(qTxt);

        // 选项按钮
        const btnW = cw - 80;
        const btnH = QUIZ_CONFIG.BUTTON_HEIGHT * 2;
        
        quiz.o.forEach((option, index) => {
            const by = cy + 100 + index * QUIZ_CONFIG.BUTTON_GAP * 2;
            this._createOptionButton(cx, by, btnW, btnH, index, option, quiz.a);
        });

        // 键盘快捷键
        this.keyA = this.scene.input.keyboard.once('keydown-A', () => this._answer(true));
        this.keyB = this.scene.input.keyboard.once('keydown-B', () => this._answer(false));
    }

    /**
     * 创建选项按钮
     */
    _createOptionButton(x, y, width, height, index, text, correctIndex) {
        const isOptionA = index === 0;
        const baseColor = isOptionA ? 0x0d47a1 : 0x1b5e20;
        const hoverColor = isOptionA ? 0x1565c0 : 0x2e7d32;
        const borderColor = isOptionA ? 0x42a5f5 : 0x66bb6a;
        const hoverBorder = isOptionA ? 0x64b5f6 : 0x81c784;

        // 按钮背景
        const bg = this.scene.add.graphics()
            .setDepth(UI_CONFIG.DEPTH.QUIZ + 2)
            .setAlpha(0);
        
        const drawNormal = () => {
            bg.clear();
            bg.fillStyle(baseColor, 0.85);
            bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 28);
            bg.lineStyle(4, borderColor, 0.75);
            bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 28);
        };
        
        const drawHover = () => {
            bg.clear();
            bg.fillStyle(hoverColor, 0.92);
            bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 28);
            bg.lineStyle(5, hoverBorder, 0.9);
            bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 28);
        };
        
        drawNormal();
        this.scene.tweens.add({ targets: bg, alpha: 1, duration: 200, delay: 200 + index * 80 });
        this.elements.push(bg);

        // 选项文本
        const label = this.scene.add.text(x, y, (isOptionA ? '🅰  ' : '🅱  ') + text, {
            fontSize: '32px',
            color: '#e8eaf6',
            fontFamily: UI_CONFIG.FONT_FAMILY,
        })
            .setOrigin(0.5)
            .setDepth(UI_CONFIG.DEPTH.QUIZ + 3)
            .setAlpha(0);
        this.scene.tweens.add({ targets: label, alpha: 1, duration: 200, delay: 200 + index * 80 });
        this.elements.push(label);

        // 交互区域
        const zone = this.scene.add.zone(x, y, width, height)
            .setInteractive({ useHandCursor: true })
            .setDepth(UI_CONFIG.DEPTH.QUIZ + 4);
        
        zone.on('pointerover', drawHover);
        zone.on('pointerout', drawNormal);
        zone.on('pointerdown', () => this._answer(index === correctIndex));
        this.elements.push(zone);
    }

    /**
     * 回答问题
     */
    _answer(correct) {
        if (!this.active) return;
        
        this.active = false;
        
        // 移除键盘监听
        if (this.keyA) this.scene.input.keyboard.off('keydown-A', this.keyA);
        if (this.keyB) this.scene.input.keyboard.off('keydown-B', this.keyB);

        // 清除答题 UI
        this.elements.forEach(el => { if (el) el.destroy(); });
        this.elements = [];

        // 显示结果并获取弹药变化量
        const ammoDelta = this._showResult(correct);

        // 触发回调，传递弹药变化量
        if (this.onAnswer) {
            this.onAnswer(correct, ammoDelta);
        }
    }

    /**
     * 显示答题结果
     */
    _showResult(correct) {
        const cx = this.W / 2;
        const cy = this.H / 2 - 20;

        // 结果文本
        const result = this.scene.add.text(cx, cy - 20, correct ? '✅ 回答正确！' : '❌ 回答错误！', {
            fontSize: '52px',
            color: correct ? COLORS.SUCCESS_HEX : COLORS.DANGER_HEX,
            fontStyle: 'bold',
            fontFamily: UI_CONFIG.FONT_FAMILY,
            shadow: { offsetX: 0, offsetY: 4, color: '#000', blur: 16, fill: true },
        })
            .setOrigin(0.5)
            .setDepth(UI_CONFIG.DEPTH.QUIZ + 5)
            .setScale(0);

        this.scene.tweens.add({
            targets: result,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut',
        });

        // 弹药变化
        const ammoDelta = correct
            ? Phaser.Math.Between(QUIZ_CONFIG.CORRECT_AMMO_RANGE[0], QUIZ_CONFIG.CORRECT_AMMO_RANGE[1])
            : Phaser.Math.Between(QUIZ_CONFIG.WRONG_AMMO_RANGE[0], QUIZ_CONFIG.WRONG_AMMO_RANGE[1]);

        const ammoText = this.scene.add.text(cx, cy + 76, (ammoDelta > 0 ? '🔫 +' : '🔫 ') + ammoDelta + ' 子弹', {
            fontSize: '36px',
            color: correct ? '#fff176' : '#ff8a80',
            fontFamily: UI_CONFIG.FONT_FAMILY,
        })
            .setOrigin(0.5)
            .setDepth(UI_CONFIG.DEPTH.QUIZ + 5)
            .setAlpha(0);

        this.scene.tweens.add({
            targets: ammoText,
            alpha: 1,
            y: cy + 70,
            duration: 250,
            delay: 150,
        });

        // 正确答题主特效
        if (correct) {
            this._createSuccessParticles(cx, cy);
        } else {
            this.scene.cameras.main.shake(120, 0.005);
        }

        // 延迟关闭
        this.scene.time.delayedCall(QUIZ_CONFIG.SHOW_DURATION, () => {
            this._close(result, ammoText);
        });

        return ammoDelta;
    }

    /**
     * 创建成功粒子效果
     */
    _createSuccessParticles(x, y) {
        for (let i = 0; i < QUIZ_CONFIG.PARTICLE_COUNT; i++) {
            const particle = this.scene.add.image(x, y, 'dot')
                .setDepth(UI_CONFIG.DEPTH.QUIZ + 6)
                .setScale(Phaser.Math.FloatBetween(0.3, 0.9))
                .setTint(Phaser.Utils.Array.GetRandom(COLORS.QUIZ_SUCCESS));

            const angle = Math.random() * Math.PI * 2;
            const distance = Phaser.Math.Between(QUIZ_CONFIG.PARTICLE_DISTANCE[0], QUIZ_CONFIG.PARTICLE_DISTANCE[1]);

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0,
                duration: 550,
                onComplete: () => particle.destroy(),
            });
        }
    }

    /**
     * 关闭答题界面
     */
    _close(resultEl, ammoEl) {
        if (this.mask) {
            this.scene.tweens.add({
                targets: this.mask,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    if (this.mask) this.mask.destroy();
                    this.mask = null;
                },
            });
        }

        if (this.card) {
            this.scene.tweens.add({
                targets: this.card,
                alpha: 0,
                scale: 0.8,
                duration: 200,
                onComplete: () => {
                    if (this.card) this.card.destroy();
                    this.card = null;
                },
            });
        }

        if (resultEl) resultEl.destroy();
        if (ammoEl) ammoEl.destroy();
    }

    /**
     * 获取随机题目（防重复）
     */
    _getRandomQuiz() {
        // 简单实现：随机选择
        // 更好的实现：记录已答题目，优先选择新题
        return Phaser.Utils.Array.GetRandom(QUIZ);
    }

    /**
     * 强制关闭答题（用于玩家死亡等场景）
     */
    forceClose() {
        if (!this.active) return;
        
        this.active = false;
        
        if (this.keyA) this.scene.input.keyboard.off('keydown-A', this.keyA);
        if (this.keyB) this.scene.input.keyboard.off('keydown-B', this.keyB);
        
        this.elements.forEach(el => { if (el) el.destroy(); });
        this.elements = [];
        
        if (this.mask) { this.mask.destroy(); this.mask = null; }
        if (this.card) { this.card.destroy(); this.card = null; }
    }

    /**
     * 是否正在答题
     */
    isActive() {
        return this.active;
    }

    /**
     * 销毁系统
     */
    destroy() {
        this.forceClose();
    }
}
