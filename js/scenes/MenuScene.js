// ======== Menu ========
class MenuScene extends Phaser.Scene {
    constructor(){ super('Menu'); }
    create(){
        const W=this.scale.width,H=this.scale.height;
        this.cameras.main.setBackgroundColor('#070720');

        for(let i=0;i<80;i++){
            const s=this.add.image(Math.random()*W,Math.random()*H,'dot')
                .setAlpha(0.25+Math.random()*0.35).setScale(0.3+Math.random()*0.6).setDepth(0);
        }

        this.add.text(W/2,H*0.06,'✈️',{fontSize:'96px'}).setOrigin(0.5);
        this.add.text(W/2,H*0.16,'编程纸飞机作战',{
            fontSize:'56px',fontFamily:'Arial,sans-serif',color:'#a7ffeb',fontStyle:'bold'
        }).setOrigin(0.5);

        if(PlayerInfo.name){
            this.add.text(W/2,H*0.23,'👤  '+PlayerInfo.name,{
                fontSize:'28px',fontFamily:'Arial,sans-serif',color:'#b2dfdb'
            }).setOrigin(0.5);
        }

        this.add.text(W/2,H*0.30,'🕹️ WASD/方向键 移动  🔫 空格/点击 射击\n🛡️ E 护盾  💣 Q 炸弹  ⏱️ R 减速\n❓ 答题卡片 60+题 赢取弹药',{
            fontSize:'24px',color:'#80cbc4',align:'center',lineSpacing:8
        }).setOrigin(0.5);

        // ---- 按钮区 ----
        const btnStyle = { fontSize:'36px', fontFamily:'Arial,sans-serif', fontStyle:'bold', padding:{x:56,y:20} };
        const startY = H*0.46, gap = 112;

        const startBtn=this.add.text(W/2,startY,'🎮  开 始',{
            ...btnStyle, color:'#004d40', backgroundColor:'#18ffff'
        }).setOrigin(0.5).setInteractive({useHandCursor:true});
        this.tweens.add({targets:startBtn,scaleX:1.05,scaleY:1.05,duration:600,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
        startBtn.on('pointerdown',()=>this.scene.start('Game'));
        startBtn.on('pointerover',()=>startBtn.setStyle({backgroundColor:'#64ffda'}));
        startBtn.on('pointerout',()=>startBtn.setStyle({backgroundColor:'#18ffff'}));

        const rankBtn=this.add.text(W/2,startY+gap,'🏆  排行榜',{
            ...btnStyle, color:'#1a237e', backgroundColor:'#ffd740'
        }).setOrigin(0.5).setInteractive({useHandCursor:true});
        rankBtn.on('pointerdown',()=>this.scene.start('Rank'));
        rankBtn.on('pointerover',()=>rankBtn.setStyle({backgroundColor:'#ffe082'}));
        rankBtn.on('pointerout',()=>rankBtn.setStyle({backgroundColor:'#ffd740'}));

        const statsBtn=this.add.text(W/2,startY+gap*2,'📊  统  计',{
            ...btnStyle, color:'#1a237e', backgroundColor:'#82b1ff'
        }).setOrigin(0.5).setInteractive({useHandCursor:true});
        statsBtn.on('pointerdown',()=>this.scene.start('Stats'));
        statsBtn.on('pointerover',()=>statsBtn.setStyle({backgroundColor:'#90caf9'}));
        statsBtn.on('pointerout',()=>statsBtn.setStyle({backgroundColor:'#82b1ff'}));

        const achBtn=this.add.text(W/2,startY+gap*3,'🎖️  成  就',{
            ...btnStyle, color:'#1a237e', backgroundColor:'#ea80fc'
        }).setOrigin(0.5).setInteractive({useHandCursor:true});
        achBtn.on('pointerdown',()=>this.scene.start('Ach'));
        achBtn.on('pointerover',()=>achBtn.setStyle({backgroundColor:'#f48fb1'}));
        achBtn.on('pointerout',()=>achBtn.setStyle({backgroundColor:'#ea80fc'}));

        const settingsBtn=this.add.text(W/2,startY+gap*4,'⚙️  设  置',{
            ...btnStyle, color:'#1a237e', backgroundColor:'#78909c'
        }).setOrigin(0.5).setInteractive({useHandCursor:true});
        settingsBtn.on('pointerdown',()=>this.scene.start('Settings'));
        settingsBtn.on('pointerover',()=>settingsBtn.setStyle({backgroundColor:'#90a4ae'}));
        settingsBtn.on('pointerout',()=>settingsBtn.setStyle({backgroundColor:'#78909c'}));

        this.input.keyboard.once('keydown-SPACE',()=>this.scene.start('Game'));

        // 底部
        const st = DataStore.getStats();
        const bestScoreText = st.maxScore > 0 ? `  |  🏆 最高分: ${st.maxScore}` : '';
        this.add.text(W/2,H*0.88,`💡 编程 | Java | Spring | 并发 | JVM | 微服务 | MQ | Docker`,{
            fontSize:'20px',color:'#3949ab'
        }).setOrigin(0.5);
        this.add.text(W/2,H*0.92,`已玩 ${st.games} 局${bestScoreText}`,{
            fontSize:'22px',color:'#5c6bc0'
        }).setOrigin(0.5);
    }
}