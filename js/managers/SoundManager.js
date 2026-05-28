/**
 * 音效管理器
 * 使用 Web Audio API 生成游戏音效
 * 支持音量控制和音效分类
 */
class SoundManager {
    constructor(settings = {}) {
        this.enabled = settings.sound !== false;
        this.volume = settings.volume || 0.7;  // 主音量 (0-1)
        this.sfxVolume = settings.sfxVolume || 0.8;  // 音效音量 (0-1)
        this.ctx = null;
        
        // 音量节点
        this.masterGain = null;
        this.sfxGain = null;
        
        if (this.enabled) {
            this._initContext();
        }
    }

    /**
     * 初始化音频上下文
     */
    _initContext() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建主音量节点
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
            
            // 创建音效音量节点
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);
        } catch (e) {
            console.warn('Web Audio API 不可用:', e);
            this.enabled = false;
        }
    }

    /**
     * 恢复音频上下文（处理浏览器自动播放策略）
     */
    _resumeContext() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * 播放基础音效
     * @param {number} frequency - 频率
     * @param {number} duration - 持续时间
     * @param {string} type - 波形类型
     * @param {number} volume - 音量（相对音效音量的比例）
     * @param {string} category - 音效类别 ('sfx' | 'ui')
     */
    playTone(frequency, duration, type = 'square', volume = 0.5, category = 'sfx') {
        if (!this.enabled || !this.ctx) return;

        this._resumeContext();

        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        oscillator.connect(gainNode);
        
        // 根据类别连接到不同的音量节点
        if (category === 'ui') {
            gainNode.connect(this.masterGain);
        } else {
            gainNode.connect(this.sfxGain);
        }
        
        oscillator.start();
        oscillator.stop(this.ctx.currentTime + duration);
    }

    /**
     * 射击音效
     */
    shoot() {
        this.playTone(1000, 0.04, 'square', 0.4);
    }

    /**
     * 命中敌人音效
     */
    hit() {
        this.playTone(160, 0.1, 'sawtooth', 0.5);
    }

    /**
     * 爆炸音效
     */
    boom() {
        this.playTone(50, 0.2, 'sawtooth', 0.7);
    }

    /**
     * 答题正确音效
     */
    quizCorrect() {
        this.playTone(600, 0.06, 'square', 0.5);
        setTimeout(() => this.playTone(900, 0.06, 'square', 0.5), 60);
        setTimeout(() => this.playTone(1200, 0.08, 'square', 0.6), 130);
    }

    /**
     * 答题错误音效
     */
    quizWrong() {
        this.playTone(130, 0.22, 'sawtooth', 0.6);
    }

    /**
     * 护盾激活音效
     */
    shield() {
        this.playTone(400, 0.12, 'sine', 0.5);
        setTimeout(() => this.playTone(600, 0.1, 'sine', 0.5), 80);
    }

    /**
     * 炸弹爆炸音效
     */
    bomb() {
        this.playTone(80, 0.35, 'sawtooth', 0.8);
        setTimeout(() => this.playTone(60, 0.25, 'sawtooth', 0.6), 150);
    }

    /**
     * 时间减缓音效
     */
    slowTime() {
        this.playTone(300, 0.15, 'sine', 0.5);
        setTimeout(() => this.playTone(500, 0.1, 'sine', 0.4), 100);
    }

    /**
     * 拾取道具音效
     */
    pickup() {
        this.playTone(1100, 0.05, 'square', 0.4);
    }

    /**
     * UI 点击音效
     */
    click() {
        this.playTone(800, 0.03, 'square', 0.3, 'ui');
    }

    /**
     * UI 悬停音效
     */
    hover() {
        this.playTone(600, 0.02, 'sine', 0.2, 'ui');
    }

    /**
     * 成就解锁音效
     */
    achievement() {
        this.playTone(523, 0.1, 'sine', 0.5, 'ui');
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.5, 'ui'), 100);
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.6, 'ui'), 200);
    }

    /**
     * 设置主音量
     * @param {number} volume - 音量 (0-1)
     */
    setVolume(volume) {
        this.volume = Phaser.Math.Clamp(volume, 0, 1);
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    /**
     * 设置音效音量
     * @param {number} volume - 音量 (0-1)
     */
    setSfxVolume(volume) {
        this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
        if (this.sfxGain) {
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        }
    }

    /**
     * 获取音量设置
     * @returns {object} 音量设置
     */
    getVolumeSettings() {
        return {
            volume: this.volume,
            sfxVolume: this.sfxVolume,
        };
    }

    /**
     * 开关音效
     * @returns {boolean} 当前状态
     */
    toggle() {
        this.enabled = !this.enabled;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
        }
        return this.enabled;
    }

    /**
     * 设置启用状态
     * @param {boolean} enabled - 是否启用
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
        }
    }

    /**
     * 暂停音效（游戏暂停时调用）
     */
    pause() {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        }
    }

    /**
     * 恢复音效（游戏恢复时调用）
     */
    resume() {
        if (this.masterGain && this.enabled) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    /**
     * 销毁管理器
     */
    destroy() {
        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
        }
    }
}
