// ======== Stats ========
class StatsScene extends Phaser.Scene {
    constructor(){ super('Stats'); }
    create(){
        const W=this.scale.width,H=this.scale.height;
        this.cameras.main.setBackgroundColor('#070720');

        for(let i=0;i<40;i++){
            this.add.image(Math.random()*W,Math.random()*H,'dot')
                .setAlpha(0.2+Math.random()*0.2).setScale(0.2+Math.random()*0.4);
        }

        this.add.text(W/2,H*0.06,'📊 游戏统计',{fontSize:'52px',color:'#82b1ff',fontStyle:'bold',fontFamily:'Arial,sans-serif'}).setOrigin(0.5);

        const s = DataStore.getStats();
        const acc = s.quizTotal>0 ? Math.round(s.quizCorrect/s.quizTotal*100) : 0;

        const items = [
            ['🎮 总局数',   s.games],
            ['⭐ 最高得分',  s.maxScore],
            ['🎯 总击杀',   s.totalKills],
            ['🔥 最高连击',  s.maxCombo],
            ['👾 Boss击杀',  s.bossKills],
            ['📚 答题总数',  s.quizTotal],
            ['✅ 答对总数',  s.quizCorrect],
            ['📈 答题正确率', acc+'%'],
        ];

        items.forEach(([label,val],i)=>{
            const y = H*0.16 + i*104;
            // 卡片背景
            const bg = this.add.graphics();
            bg.fillStyle(0x1a237e,0.4); bg.fillRoundedRect(40,y-36,W-80,84,20);
            bg.lineStyle(2,0x536dfe,0.3); bg.strokeRoundedRect(40,y-36,W-80,84,20);
            this.add.text(64,y,label,{fontSize:'28px',color:'#90caf9',fontFamily:'Arial,sans-serif'}).setOrigin(0,0.5);
            this.add.text(W-64,y,''+val,{fontSize:'32px',color:'#e8eaf6',fontStyle:'bold',fontFamily:'Arial,sans-serif'}).setOrigin(1,0.5);
        });

        const back=this.add.text(W/2,H*0.92,'🏠 返回菜单',{fontSize:'30px',color:'#80cbc4'}).setOrigin(0.5).setInteractive({useHandCursor:true});
        back.on('pointerdown',()=>this.scene.start('Menu'));
        this.input.keyboard.once('keydown-ESC',()=>this.scene.start('Menu'));
    }
}