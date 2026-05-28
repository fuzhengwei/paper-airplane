// ======== Ach ========
class AchScene extends Phaser.Scene {
    constructor(){ super('Ach'); }
    create(){
        const W=this.scale.width,H=this.scale.height;
        this.cameras.main.setBackgroundColor('#070720');

        for(let i=0;i<40;i++){
            this.add.image(Math.random()*W,Math.random()*H,'dot')
                .setAlpha(0.2+Math.random()*0.2).setScale(0.2+Math.random()*0.4);
        }

        this.add.text(W/2,H*0.04,'🎖️ 成就',{fontSize:'52px',color:'#ea80fc',fontStyle:'bold',fontFamily:'Arial,sans-serif'}).setOrigin(0.5);

        const unlocked = DataStore.getAchievements();
        const total = ACHIEVEMENTS.length;
        this.add.text(W/2,H*0.09,`${unlocked.length} / ${total} 已解锁`,{fontSize:'26px',color:'#b0bec5'}).setOrigin(0.5);

        // 进度条
        const pbW=W-120,pbH=12,pbX=60,pbY=H*0.12;
        const pbBg=this.add.graphics();
        pbBg.fillStyle(0x222222,0.6); pbBg.fillRoundedRect(pbX,pbY,pbW,pbH,6);
        const pbFg=this.add.graphics();
        const pct=unlocked.length/total;
        pbFg.fillStyle(0xea80fc,0.9); pbFg.fillRoundedRect(pbX,pbY,pbW*pct,pbH,6);

        // 成就列表（可滚动区域用简单的分页展示）
        const perPage = 7;
        const pages = Math.ceil(total/perPage);
        let currentPage = 0;

        const listContainer = this.add.container(0,0);

        const drawPage = (page) => {
            listContainer.removeAll(true);
            const start = page*perPage;
            const end = Math.min(start+perPage, total);
            for(let i=start;i<end;i++){
                const a = ACHIEVEMENTS[i];
                const isUnlocked = unlocked.includes(a.id);
                const idx = i-start;
                const y = H*0.17 + idx*136;

                const bg = this.add.graphics();
                bg.fillStyle(isUnlocked?0x1a237e:0x111111, isUnlocked?0.5:0.3);
                bg.fillRoundedRect(32,y-44,W-64,116,24);
                bg.lineStyle(3, isUnlocked?0xea80fc:0x333333, isUnlocked?0.7:0.3);
                bg.strokeRoundedRect(32,y-44,W-64,116,24);

                const icon = this.add.text(64,y,a.icon,{fontSize:'48px'}).setOrigin(0,0.5).setAlpha(isUnlocked?1:0.3);
                const name = this.add.text(132,y-16,a.name,{fontSize:'28px',color:isUnlocked?'#e8eaf6':'#555555',fontStyle:'bold',fontFamily:'Arial,sans-serif'}).setOrigin(0,0.5);
                const desc = this.add.text(132,y+20,a.desc,{fontSize:'22px',color:isUnlocked?'#90caf9':'#444444',fontFamily:'Arial,sans-serif'}).setOrigin(0,0.5);

                if(isUnlocked){
                    const check = this.add.text(W-64,y,'✅',{fontSize:'28px'}).setOrigin(1,0.5);
                    listContainer.add([bg,icon,name,desc,check]);
                } else {
                    const lock = this.add.text(W-64,y,'🔒',{fontSize:'28px'}).setOrigin(1,0.5);
                    listContainer.add([bg,icon,name,desc,lock]);
                }
            }

            // 页码
            const pageText = this.add.text(W/2,H*0.88,`${page+1} / ${pages}`,{fontSize:'24px',color:'#5c6bc0'}).setOrigin(0.5);
            listContainer.add(pageText);
        };

        drawPage(0);

        if(pages>1){
            const prevBtn = this.add.text(W/2-100,H*0.92,'◀',{fontSize:'36px',color:'#82b1ff'}).setOrigin(0.5).setInteractive({useHandCursor:true});
            prevBtn.on('pointerdown',()=>{ currentPage=(currentPage-1+pages)%pages; drawPage(currentPage); });
            const nextBtn = this.add.text(W/2+100,H*0.92,'▶',{fontSize:'36px',color:'#82b1ff'}).setOrigin(0.5).setInteractive({useHandCursor:true});
            nextBtn.on('pointerdown',()=>{ currentPage=(currentPage+1)%pages; drawPage(currentPage); });
        }

        const back=this.add.text(W/2,H*0.96,'🏠 返回菜单',{fontSize:'28px',color:'#80cbc4'}).setOrigin(0.5).setInteractive({useHandCursor:true});
        back.on('pointerdown',()=>this.scene.start('Menu'));
        this.input.keyboard.once('keydown-ESC',()=>this.scene.start('Menu'));
    }
}