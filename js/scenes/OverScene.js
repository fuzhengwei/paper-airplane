// ======== Over ========
class OverScene extends Phaser.Scene {
    constructor(){ super('Over'); }
    init(d){
        this.fs=d.score||0; this.fk=d.kills||0;
        this.maxCombo=d.maxCombo||0;
        this.quizCorrect=d.quizCorrect||0; this.quizTotal=d.quizTotal||0;
        this.surviveTime=d.surviveTime||0;
        this.wave=d.wave||0;
        this.prevMaxScore=d.prevMaxScore||0;
        this.newAch=d.newAch||[];
        this.difficulty=d.difficulty||'normal';
    }
    create(){
        const W=this.scale.width,H=this.scale.height;
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0.85)');

        // 星星
        for(let i=0;i<30;i++){
            this.add.image(Math.random()*W,Math.random()*H,'dot')
                .setAlpha(0.15+Math.random()*0.2).setScale(0.2+Math.random()*0.3);
        }

        this.add.text(W/2,H*0.04,'💥 游戏结束',{fontSize:'56px',color:'#ff5252',fontStyle:'bold',fontFamily:'Arial,sans-serif'}).setOrigin(0.5);

        // 难度标签
        const diffLabels = {'easy':'🟢 简单','normal':'🟡 普通','hard':'🔴 困难'};
        this.add.text(W/2,H*0.09,diffLabels[this.difficulty]||'🟡 普通',{
            fontSize:'24px',color:'#b0bec5',fontFamily:'Arial,sans-serif'
        }).setOrigin(0.5);

        // 成绩卡片
        const cardY=H*0.13;
        const cardH = 560;
        const cardBg=this.add.graphics();
        cardBg.fillStyle(0x1a237e,0.5); cardBg.fillRoundedRect(40,cardY,W-80,cardH,32);
        cardBg.lineStyle(3,0x536dfe,0.4); cardBg.strokeRoundedRect(40,cardY,W-80,cardH,32);

        const statItems = [
            ['⭐ 得分', this.fs],
            ['🎯 击杀', this.fk],
            ['🔥 最高连击', this.maxCombo],
            ['🌊 到达波次', '第 '+this.wave+' 波'],
            ['📚 答题', this.quizCorrect+'/'+this.quizTotal+(this.quizTotal>0?' ('+Math.round(this.quizCorrect/this.quizTotal*100)+'%)':'')],
            ['⏱️ 存活', this.surviveTime+'秒'],
            ['💀 每秒击杀', this.surviveTime>0?(this.fk/this.surviveTime).toFixed(1):'0'],
        ];
        statItems.forEach(([label,val],i)=>{
            const y=cardY+40+i*72;
            this.add.text(72,y,label,{fontSize:'28px',color:'#90caf9',fontFamily:'Arial,sans-serif'}).setOrigin(0,0.5);
            this.add.text(W-72,y,''+val,{fontSize:'32px',color:'#e8eaf6',fontStyle:'bold',fontFamily:'Arial,sans-serif'}).setOrigin(1,0.5);
        });

        // 新纪录提示
        if(this.fs>0 && this.fs>this.prevMaxScore){
            const newY=cardY+cardH-16;
            this.add.text(W/2,newY,'🎉 新纪录！',{fontSize:'32px',color:'#ffd740',fontStyle:'bold',fontFamily:'Arial,sans-serif'}).setOrigin(0.5);
            // 烟花效果
            for(let i=0;i<20;i++){
                const p=this.add.image(W/2,newY,'dot').setDepth(100).setScale(Phaser.Math.FloatBetween(0.3,0.8))
                    .setTint(Phaser.Utils.Array.GetRandom([0xffd740,0xffab40,0xff6d00,0xffe082]));
                const a=Math.random()*Math.PI*2,d=Phaser.Math.Between(60,200);
                this.tweens.add({targets:p,x:W/2+Math.cos(a)*d,y:newY+Math.sin(a)*d,
                    alpha:0,scale:0,duration:Phaser.Math.Between(400,800),delay:i*30,onComplete:()=>p.destroy()});
            }
        }

        // 新成就通知
        let achEndY = cardY+cardH+20;
        if(this.newAch.length>0){
            this.add.text(W/2,achEndY,'🎖️ 新成就解锁！',{fontSize:'30px',color:'#ffd740',fontStyle:'bold',fontFamily:'Arial,sans-serif'}).setOrigin(0.5);
            achEndY += 10;

            this.newAch.slice(0,3).forEach((id,i)=>{
                const a = ACHIEVEMENTS.find(x=>x.id===id);
                if(!a) return;
                const y=achEndY+44+i*56;
                const bg=this.add.graphics();
                bg.fillStyle(0x4a148c,0.4); bg.fillRoundedRect(48,y-24,W-96,52,16);
                this.add.text(W/2,y,a.icon+' '+a.name,{
                    fontSize:'24px',color:'#ea80fc',fontFamily:'Arial,sans-serif'
                }).setOrigin(0.5);
            });
            achEndY += this.newAch.length > 3 ? 200 : this.newAch.length * 56 + 20;
        }

        // 按钮
        const btnY = Math.min(achEndY + 40, H*0.78);
        const btn=this.add.text(W/2,btnY,'🔄 再来一局',{
            fontSize:'40px',fontFamily:'Arial,sans-serif',color:'#004d40',
            backgroundColor:'#18ffff',padding:{x:52,y:22},fontStyle:'bold'
        }).setOrigin(0.5).setInteractive({useHandCursor:true});
        btn.on('pointerover',()=>btn.setStyle({backgroundColor:'#64ffda'}));
        btn.on('pointerout',()=>btn.setStyle({backgroundColor:'#18ffff'}));

        const menu=this.add.text(W/2,btnY+92,'🏠 返回菜单',{
            fontSize:'30px',color:'#80cbc4'
        }).setOrigin(0.5).setInteractive({useHandCursor:true});

        // 分享按钮
        const shareBtn=this.add.text(W/2,btnY+164,'📋 复制成绩',{
            fontSize:'26px',color:'#90caf9'
        }).setOrigin(0.5).setInteractive({useHandCursor:true});
        shareBtn.on('pointerdown',()=>{
            const text=`✈️ 编程纸飞机作战\n⭐ 得分: ${this.fs}\n🎯 击杀: ${this.fk}\n🌊 波次: ${this.wave}\n⏱️ 存活: ${this.surviveTime}秒`;
            navigator.clipboard.writeText(text).then(()=>{
                shareBtn.setText('✅ 已复制');
                this.time.delayedCall(1500,()=>shareBtn.setText('📋 复制成绩'));
            }).catch(()=>{
                shareBtn.setText('❌ 复制失败');
                this.time.delayedCall(1500,()=>shareBtn.setText('📋 复制成绩'));
            });
        });

        btn.on('pointerdown',()=>{this.scene.stop('Over');this.scene.stop('Game');this.scene.start('Game');});
        menu.on('pointerdown',()=>{this.scene.stop('Over');this.scene.stop('Game');this.scene.start('Menu');});
        this.input.keyboard.once('keydown-SPACE',()=>{this.scene.stop('Over');this.scene.stop('Game');this.scene.start('Game');});
        this.input.keyboard.once('keydown-ESC',()=>{this.scene.stop('Over');this.scene.stop('Game');this.scene.start('Menu');});
    }
}