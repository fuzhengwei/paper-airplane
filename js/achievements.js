// ==================== 成就检测（在 Game 结束时调用） ====================
function checkAchievements(score, kills, maxCombo, bossKills, surviveTime, wave) {
    const newlyUnlocked = [];
    const checks = [
        ['first_game',  true],
        ['score_100',   score >= 100],
        ['score_500',   score >= 500],
        ['score_1000',  score >= 1000],
        ['score_2000',  score >= 2000],
        ['kill_10',     kills >= 10],
        ['kill_50',     kills >= 50],
        ['kill_100',    kills >= 100],
        ['combo_5',     maxCombo >= 5],
        ['combo_10',    maxCombo >= 10],
        ['combo_20',    maxCombo >= 20],
        ['boss_kill',   bossKills >= 1],
        ['survive_60',  surviveTime >= 60],
        ['survive_120', surviveTime >= 120],
        ['wave_5',      wave >= 5],
    ];
    // 统计类成就
    const stats = DataStore.getStats();
    if (stats.quizCorrect >= 5)  checks.push(['quiz_5', true]);
    if (stats.quizCorrect >= 20) checks.push(['quiz_20', true]);
    if (stats.quizCorrect >= 50) checks.push(['quiz_50', true]);
    if (stats.games >= 5)  checks.push(['games_5', true]);
    if (stats.games >= 20) checks.push(['games_20', true]);
    if (stats.games >= 50) checks.push(['games_50', true]);
    if (stats.bossKills >= 5) checks.push(['boss_5', true]);

    for (const [id, cond] of checks) {
        if (cond && DataStore.unlockAchievement(id)) {
            newlyUnlocked.push(id);
        }
    }
    return newlyUnlocked;
}
