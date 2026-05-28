// ======== Login ========
class LoginScene extends Phaser.Scene {
    constructor(){ super('Login'); }
    create(){
        const W=this.scale.width,H=this.scale.height;
        this.cameras.main.setBackgroundColor('#070720');

        // 背景星星
        for(let i=0;i<80;i++){
            const s=this.add.image(Math.random()*W,Math.random()*H,'dot')
                .setAlpha(0.2+Math.random()*0.35).setScale(0.3+Math.random()*0.6).setDepth(0);
        }

        this.add.text(W/2,H*0.12,'✈️',{fontSize:'96px'}).setOrigin(0.5);
        this.add.text(W/2,H*0.24,'编程纸飞机作战',{
            fontSize:'56px',fontFamily:'Arial,sans-serif',color:'#a7ffeb',fontStyle:'bold'
        }).setOrigin(0.5);
        this.add.text(W/2,H*0.32,'登录后开始冒险之旅',{
            fontSize:'28px',color:'#80cbc4'
        }).setOrigin(0.5);

        const inputW=560,inputH=96,inputX=W/2,inputY=H*0.46;
        const inputBg=this.add.graphics().setDepth(10);
        inputBg.fillStyle(0x1a237e,0.6); inputBg.fillRoundedRect(inputX-inputW/2,inputY-inputH/2,inputW,inputH,24);
        inputBg.lineStyle(4,0x536dfe,0.8); inputBg.strokeRoundedRect(inputX-inputW/2,inputY-inputH/2,inputW,inputH,24);

        this.add.text(inputX-inputW/2+32,inputY,'👤',{fontSize:'36px'}).setOrigin(0,0.5).setDepth(11);

        const placeholder=this.add.text(inputX-inputW/2+92,inputY,'输入你的昵称',{
            fontSize:'30px',color:'#5c6bc0',fontFamily:'Arial,sans-serif'
        }).setOrigin(0,0.5).setDepth(11);

        const inputText=this.add.text(inputX-inputW/2+92,inputY,'',{
            fontSize:'30px',color:'#ffffff',fontFamily:'Arial,sans-serif'
        }).setOrigin(0,0.5).setDepth(11);

        const cursor=this.add.text(inputX-inputW/2+92,inputY-28,'|',{
            fontSize:'30px',color:'#536dfe',fontFamily:'Arial,sans-serif'
        }).setOrigin(0,0.5).setDepth(11).setAlpha(0);
        this.tweens.add({targets:cursor,alpha:1,duration:400,yoyo:true,repeat:-1});

        const htmlInput=document.createElement('input');
        htmlInput.type='text'; htmlInput.maxLength=12;
        htmlInput.style.cssText='position:fixed;left:-9999px;top:-9999px;opacity:0;';
        document.body.appendChild(htmlInput);

        let isFocused=false, inputValue=PlayerInfo.name||'';
        if(inputValue){htmlInput.value=inputValue;inputText.setText(inputValue);placeholder.setAlpha(0);cursor.setX(inputText.x+inputText.width+4);}

        const inputZone=this.add.zone(inputX,inputY,inputW,inputH).setInteractive({useHandCursor:true}).setDepth(12);
        inputZone.on('pointerdown',()=>{
            htmlInput.focus(); isFocused=true;
            inputBg.clear();
            inputBg.fillStyle(0x1a237e,0.8); inputBg.fillRoundedRect(inputX-inputW/2,inputY-inputH/2,inputW,inputH,24);
            inputBg.lineStyle(5,0x7c4dff,1); inputBg.strokeRoundedRect(inputX-inputW/2,inputY-inputH/2,inputW,inputH,24);
        });

        htmlInput.addEventListener('input',()=>{
            inputValue=htmlInput.value.replace(/[\u0000-\u001F]/g,'').slice(0,12);
            htmlInput.value=inputValue;
            inputText.setText(inputValue);
            placeholder.setAlpha(inputValue.length>0?0:1);
            cursor.setX(inputText.x+inputText.width+4);
        });

        htmlInput.addEventListener('focus',()=>{
            isFocused=true; cursor.setAlpha(1);
            this.tweens.add({targets:cursor,alpha:1,duration:400,yoyo:true,repeat:-1,id:'cursorBlink'});
        });

        htmlInput.addEventListener('blur',()=>{
            isFocused=false; cursor.setAlpha(0); this.tweens.killTweensOf(cursor);
            inputBg.clear();
            inputBg.fillStyle(0x1a237e,0.6); inputBg.fillRoundedRect(inputX-inputW/2,inputY-inputH/2,inputW,inputH,24);
            inputBg.lineStyle(4,0x536dfe,0.8); inputBg.strokeRoundedRect(inputX-inputW/2,inputY-inputH/2,inputW,inputH,24);
        });

        const errorText=this.add.text(W/2,H*0.56,'',{
            fontSize:'26px',color:'#ff5252',fontFamily:'Arial,sans-serif'
        }).setOrigin(0.5).setDepth(11).setAlpha(0);

        const loginBtnY=H*0.66;
        const loginBtn=this.add.graphics().setDepth(10);
        loginBtn.fillStyle(0x00bfa5,0.95); loginBtn.fillRoundedRect(W/2-220,loginBtnY-52,440,104,28);
        loginBtn.lineStyle(4,0x64ffda,0.7); loginBtn.strokeRoundedRect(W/2-220,loginBtnY-52,440,104,28);
        this.add.text(W/2,loginBtnY,'🚀  进入游戏',{
            fontSize:'36px',fontFamily:'Arial,sans-serif',color:'#004d40',fontStyle:'bold'
        }).setOrigin(0.5).setDepth(11);

        const loginZone=this.add.zone(W/2,loginBtnY,440,104).setInteractive({useHandCursor:true}).setDepth(12);
        loginZone.on('pointerover',()=>{
            loginBtn.clear();
            loginBtn.fillStyle(0x1de9b6,1); loginBtn.fillRoundedRect(W/2-220,loginBtnY-52,440,104,28);
            loginBtn.lineStyle(5,0xa7ffeb,0.9); loginBtn.strokeRoundedRect(W/2-220,loginBtnY-52,440,104,28);
        });
        loginZone.on('pointerout',()=>{
            loginBtn.clear();
            loginBtn.fillStyle(0x00bfa5,0.95); loginBtn.fillRoundedRect(W/2-220,loginBtnY-52,440,104,28);
            loginBtn.lineStyle(4,0x64ffda,0.7); loginBtn.strokeRoundedRect(W/2-220,loginBtnY-52,440,104,28);
        });
        loginZone.on('pointerdown',()=>{
            const name=inputValue.trim();
            if(!name){
                errorText.setText('⚠️ 请输入昵称'); errorText.setAlpha(1);
                this.tweens.add({targets:errorText,alpha:0,duration:1500,delay:1200});
                this.tweens.add({targets:[inputBg,placeholder,inputText,cursor],x:'-=12',duration:40,yoyo:true,repeat:3});
                return;
            }
            PlayerInfo.name=name;
            try{localStorage.setItem('paperPlaneUser',JSON.stringify({name:name}));}catch(e){}
            if(htmlInput.parentNode)htmlInput.parentNode.removeChild(htmlInput);
            this.cameras.main.fadeOut(300,0,0,0);
            this.time.delayedCall(350,()=>{ this.scene.start('Menu'); });
        });

        this.input.keyboard.on('keydown-ENTER',()=>{ loginZone.emit('pointerdown'); });

        this.add.text(W/2,H*0.82,'—  答题闯关 · 九十个八股文  —',{ fontSize:'24px',color:'#5c6bc0' }).setOrigin(0.5);
        this.add.text(W/2,H*0.88,'💡 编程 | Java | Spring | 网络 | MySQL | Redis | Docker',{ fontSize:'22px',color:'#3949ab' }).setOrigin(0.5);

        // 飞船动画
        const flyPlane=this.add.image(W*0.78,H*0.12,'player').setDepth(5).setScale(1.6).setAlpha(0.7);
        this.tweens.add({targets:flyPlane,y:flyPlane.y-28,duration:1200,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
        this.tweens.add({targets:flyPlane,angle:-6,duration:1500,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
        // 尾焰
        this.time.addEvent({delay:60,loop:true,callback:()=>{
            const p=this.add.image(flyPlane.x+Phaser.Math.Between(-6,6),flyPlane.y+48,'dot')
                .setDepth(4).setScale(0.5).setAlpha(0.7)
                .setTint(Phaser.Utils.Array.GetRandom([0xffab40,0xff6d00,0xffd740]));
            this.tweens.add({targets:p,y:p.y+40,alpha:0,scale:0,duration:300,onComplete:()=>p.destroy()});
        }});

        const flyPlane2=this.add.image(W*0.22,H*0.85,'player').setDepth(5).setScale(1.0).setAlpha(0.3).setAngle(30);
        this.tweens.add({targets:flyPlane2,y:flyPlane2.y+16,duration:1000,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});

        this.cameras.main.fadeIn(400,0,0,0);
    }
}