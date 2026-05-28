// ======== Rank ========
class RankScene extends Phaser.Scene {
    constructor(){ super('Rank'); }
    create(){
        const W=this.scale.width,H=this.scale.height;
        this.cameras.main.setBackgroundColor('#070720');

        for(let i=0;i<40;i++){
            this.add.image(Math.random()*W,Math.random()*H,'dot')
                .setAlpha(0.2+Math.random()*0.2).setScale(0.2+Math.random()*0.4);
        }

        this.add.text(W/2,H*0.06,'🏆 排行榜',{fontSize:'52px',color:'#ffd740',fontStyle:'bold',fontFamily:'Arial,sans-serif'}).setOrigin(0.5);

        const lb = DataStore.getLeaderboard();
        if(lb.length===0){
            this.add.text(W/2,H/2,'暂无记录\n快去玩一局吧！',{fontSize:'32px',color:'#80cbc4',align:'center',lineSpacing:16}).setOrigin(0.5);
        } else {
            // 表头
            const hy = H*0.14;
            this.add.text(32,hy,'排名',{fontSize:'24px',color:'#5c6bc0',fontStyle:'bold'}).setOrigin(0,0.5);
            this.add.text(120,hy,'玩家',{fontSize:'24px',color:'#5c6bc0',fontStyle:'bold'}).setOrigin(0,0.5);
            this.add.text(W-220,hy,'得分',{fontSize:'24px',color:'#5c6bc0',fontStyle:'bold'}).setOrigin(0,0.5);
            this.add.text(W-84,hy,'击杀',{fontSize:'24px',color:'#5c6bc0',fontStyle:'bold'}).setOrigin(0,0.5);

            // 分割线
            const line = this.add.graphics();
            line.lineStyle(2,0x5c6bc0,0.4);
            line.moveTo(24,hy+20); line.lineTo(W-24,hy+20); line.strokePath();

            lb.forEach((item,i)=>{
                const y = H*0.14 + 72 + i*84;
                const medals = ['🥇','🥈','🥉'];
                const rankText = i<3 ? medals[i] : `${i+1}`;
                const clr = i<3 ? '#ffd740' : '#a7ffeb';
                const bg = this.add.graphics();
                bg.fillStyle(0x1a237e, i%2===0?0.3:0.15);
                bg.fillRoundedRect(20,y-32,W-40,72,16);

                this.add.text(32,y,rankText,{fontSize:'32px',color:clr}).setOrigin(0,0.5);
                this.add.text(120,y,item.name||'匿名',{fontSize:'28px',color:'#e8eaf6'}).setOrigin(0,0.5);
                this.add.text(W-220,y,''+item.score,{fontSize:'28px',color:'#fff176',fontStyle:'bold'}).setOrigin(0,0.5);
                this.add.text(W-84,y,''+item.kills,{fontSize:'28px',color:'#ffcc80'}).setOrigin(0,0.5);
            });
        }

        const back=this.add.text(W/2,H*0.92,'🏠 返回菜单',{fontSize:'30px',color:'#80cbc4'}).setOrigin(0.5).setInteractive({useHandCursor:true});
        back.on('pointerdown',()=>this.scene.start('Menu'));
        this.input.keyboard.once('keydown-ESC',()=>this.scene.start('Menu'));
    }
}