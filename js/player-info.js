// ==================== 全局玩家信息 ====================
const PlayerInfo = { name: loadLoginPlayerName() };

function loadLoginPlayerName(){
    const key='paperPlaneUser';
    try{
        const saved=localStorage.getItem(key)||sessionStorage.getItem(key);
        if(!saved)return '';
        const user=JSON.parse(saved);
        return user&&user.name?String(user.name).trim().slice(0,12):'';
    }catch(e){ return ''; }
}
