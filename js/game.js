// ======== 启动 ========
new Phaser.Game({
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        parent: document.body
    },
    backgroundColor: '#070720',
    physics: { default: 'arcade', arcade: { debug: false, gravity: { x: 0, y: 0 } } },
    scene: [BootScene, LoginScene, MenuScene, RankScene, StatsScene, SettingsScene, AchScene, GameScene, OverScene],
    input: { activePointers: 3 },
    render: {
        pixelArt: false,
        antialias: true,
        roundPixels: false,  // 高分辨率下不需要 roundPixels
        // 启用高清渲染
        resolution: window.devicePixelRatio || 1,
        autoMobilePipeline: true
    },
});
