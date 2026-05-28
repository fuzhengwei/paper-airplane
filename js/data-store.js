// ==================== 数据持久化 ====================
const DataStore = {
    KEY: 'paperPlaneData',

    _default() {
        return {
            leaderboard: [],   // [{name,score,kills,date}]
            stats: { games:0, totalKills:0, totalScore:0, quizCorrect:0, quizTotal:0, maxCombo:0, maxScore:0, bossKills:0 },
            achievements: [],   // [id,...]
            settings: { 
                sound: true, 
                difficulty: 'normal', 
                autoFire: false, 
                screenShake: true,
                volume: 0.7,      // 主音量 (0-1)
                sfxVolume: 0.8,   // 音效音量 (0-1)
            },
        };
    },

    load() {
        try {
            const raw = localStorage.getItem(this.KEY);
            if (!raw) return this._default();
            const d = JSON.parse(raw);
            // 兼容旧数据
            if (!d.stats) d.stats = this._default().stats;
            if (!d.leaderboard) d.leaderboard = [];
            if (!d.achievements) d.achievements = [];
            if (!d.settings) d.settings = this._default().settings;
            return d;
        } catch(e) { return this._default(); }
    },

    save(data) {
        try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch(e) {}
    },

    addScore(name, score, kills) {
        const d = this.load();
        d.leaderboard.push({ name, score, kills, date: Date.now() });
        d.leaderboard.sort((a,b) => b.score - a.score);
        d.leaderboard = d.leaderboard.slice(0, 10);
        this.save(d);
        return d;
    },

    updateStats(score, kills, quizCorrect, quizTotal, maxCombo, bossKills, surviveTime) {
        const d = this.load();
        const s = d.stats;
        s.games++;
        s.totalKills += kills;
        s.totalScore += score;
        s.quizCorrect += quizCorrect;
        s.quizTotal += quizTotal;
        s.maxCombo = Math.max(s.maxCombo, maxCombo);
        s.maxScore = Math.max(s.maxScore, score);
        s.bossKills += bossKills;
        this.save(d);
        return d;
    },

    unlockAchievement(id) {
        const d = this.load();
        if (!d.achievements.includes(id)) {
            d.achievements.push(id);
            this.save(d);
            return true; // 新解锁
        }
        return false;
    },

    getLeaderboard() { return this.load().leaderboard; },
    getStats() { return this.load().stats; },
    getAchievements() { return this.load().achievements; },
    
    getSettings() { return this.load().settings; },
    
    saveSettings(settings) {
        const d = this.load();
        d.settings = settings;
        this.save(d);
    },
    
    resetAll() {
        localStorage.removeItem(this.KEY);
    },
};
