/**
 * 游戏常量配置
 * 集中管理所有魔法数字，方便调参和维护
 */

// ==================== 游戏尺寸 ====================
// 使用高分辨率，适配 Retina 等高清屏幕
const GAME_WIDTH = 840;
const GAME_HEIGHT = 1500;

// ==================== 颜色常量 ====================
const COLORS = {
    // 背景
    BG_DARK: '#070720',
    BG_HEX: 0x070720,
    
    // 主题色
    PRIMARY: 0x1a237e,
    PRIMARY_LIGHT: 0x536dfe,
    ACCENT: 0xa7ffeb,
    ACCENT_HEX: '#a7ffeb',
    
    // 功能色
    SUCCESS: 0x69f0ae,
    SUCCESS_HEX: '#69f0ae',
    WARNING: 0xffd740,
    WARNING_HEX: '#ffd740',
    DANGER: 0xff5252,
    DANGER_HEX: '#ff5252',
    INFO: 0x82b1ff,
    INFO_HEX: '#82b1ff',
    
    // 文本
    TEXT_PRIMARY: '#e8eaf6',
    TEXT_SECONDARY: '#90caf9',
    TEXT_MUTED: '#5c6bc0',
    
    // 特效
    FIRE: [0xffab40, 0xff6d00, 0xffd740],
    EXPLOSION: [0xff5252, 0xffab40, 0xffffff, 0xffd740],
    QUIZ_SUCCESS: [0x69f0ae, 0x00e676, 0xb9f6ca],
};

// ==================== 玩家配置 ====================
const PLAYER_CONFIG = {
    SPEED: 330,
    MAX_HP: 100,
    INITIAL_AMMO: 15,
    SCALE: 2.2,
    HITBOX: { width: 64, height: 80, offsetX: 20, offsetY: 12 },
    TILT_FACTOR: 18,           // 飞船倾斜角度系数
    TILT_LERP: 0.12,           // 倾斜插值速度
    DAMAGE_TINT_DURATION: 120, // 受伤变红持续时间(ms)
    INVINCIBLE_TIME: 0,        // 无敌时间（暂未使用）
};

// ==================== 子弹配置 ====================
const BULLET_CONFIG = {
    SPEED: 620,
    MAX_COUNT: 60,
    FIRE_INTERVAL: 140,        // 射击间隔(ms)
    AUTO_FIRE_INTERVAL: 180,   // 自动射击间隔(ms)
    SIZE: { width: 12, height: 28 },
    OFFSET: { x: 2, y: 2 },
    SPREAD_ANGLES: [-0.2, 0, 0.2],  // 散射角度
    SPREAD_COUNT: 8,           // 散射道具子弹数
};

// ==================== 技能配置 ====================
const SKILL_CONFIG = {
    shield: {
        key: 'E',
        cooldown: 30000,       // 30秒冷却
        duration: 3000,        // 3秒持续
        radius: 60,            // 护盾半径
        color: 0x42a5f5,
        label: '🛡️E',
        uiY: 68,
    },
    bomb: {
        key: 'Q',
        cooldown: 45000,       // 45秒冷却
        damage: 999,           // 即死伤害
        screenShake: { duration: 200, intensity: 0.01 },
        flashAlpha: 0.3,
        label: '💣Q',
        uiY: 90,
        color: 0xff7043,
    },
    slowTime: {
        key: 'R',
        cooldown: 35000,       // 35秒冷却
        duration: 4000,        // 4秒持续
        slowFactor: 0.35,      // 减速系数
        label: '⏱️R',
        uiY: 112,
        color: 0xce93d8,
    },
};

// ==================== 敌机配置 ====================
const ENEMY_CONFIG = {
    TYPES: {
        e0: { color: 0xef5350, highlight: 0xff8a80, size: 56, speedRange: [70, 110], behavior: 'straight', weight: 0.35 },
        e1: { color: 0xff7043, highlight: 0xffab91, size: 56, speedRange: [100, 140], behavior: 'straight', weight: 0.20 },
        e2: { color: 0xab47bc, highlight: 0xce93d8, size: 56, speedRange: [125, 170], behavior: 'straight', weight: 0.15 },
        e3: { color: 0xe53935, highlight: 0xff5252, size: 76, speedRange: [42, 60], behavior: 'boss', weight: 0.08 },
        e4: { color: 0x26c6da, highlight: 0x80deea, size: 52, speedRange: [90, 130], behavior: 'zigzag', weight: 0.12 },
        e5: { color: 0xffa726, highlight: 0xffcc80, size: 60, speedRange: [80, 120], behavior: 'tracker', weight: 0.10 },
    },
    DAMAGE: 20,
    HITBOX_SCALE: { width: 0.6, height: 0.7 },
    BOSS: {
        SCALE: 3.1,
        HP_BASE: 5,
        HP_WAVE_MULT: 0.5,
        SHOOT_INTERVAL: 1800,
        BULLET_SPEED: 200,
        BULLET_ANGLES: [-0.35, 0, 0.35],
    },
    ZIGZAG: {
        AMP_RANGE: [40, 80],
        FREQ_RANGE: [2, 4],
        FREQ_MULT: 0.003,
    },
    TRACKER: {
        SPEED_MULT: 0.4,
        ATTRACT_RANGE: 10,
    },
    STRAIGHT: {
        DRIFT_RANGE: [-38, 38],
        TWEEN_DURATION: [600, 1200],
    },
    CLEANUP_Y: 50,  // 超出屏幕多少像素后销毁
};

// ==================== 道具配置 ====================
const ITEM_CONFIG = {
    BASE_SPEED: 55,
    DRIFT_RANGE: [-36, 36],
    DRIFT_DURATION: 400,
    MAGNET_RANGE: 240,         // 磁铁吸引范围
    MAGNET_STRENGTH: 12,       // 磁铁吸引力
    CLEANUP_Y: 80,
    
    TYPES: {
        ammo:    { key: 'itemAmmo', weight: 0.20, tint: null },
        hp:      { key: 'itemHp', weight: 0.14, tint: null },
        quiz:    { key: 'itemQuiz', weight: 0.20, tint: 0xffd740, scale: 2.4 },
        shield:  { key: 'itemShield', weight: 0.12, tint: 0x42a5f5, scale: 2.4 },
        spread:  { key: 'itemSpread', weight: 0.12, tint: 0xffab40, scale: 2.4 },
        double:  { key: 'itemDouble', weight: 0.12, tint: 0xe040fb, scale: 2.4 },
    },
    
    // 道具效果
    AMMO_RANGE: [3, 6],
    QUIZ_AMMO_RANGE: [1, 2],
    HP_RESTORE_RANGE: [15, 25],
    SHIELD_DURATION: 3000,
    DOUBLE_DURATION: 10000,
    GLOW_PULSE: { minAlpha: 0.15, maxScale: 1.6, duration: 400 },
};

// ==================== 波次配置 ====================
const WAVE_CONFIG = {
    INITIAL_ENEMIES: 8,
    ENEMIES_PER_WAVE: 3,
    BONUS_PER_WAVE: 15,
    AMMO_REWARD_RANGE: [3, 6],
    COOLDOWN_DURATION: 2500,
    SPEED_MODIFIER_MIN: 0.5,
    SPEED_MODIFIER_DECAY: 0.03,
    SPAWN_INTERVAL_BASE: 900,
    SPAWN_INTERVAL_MIN: 350,
    SPAWN_DECAY: 0.993,
    ITEM_INTERVAL_RANGE: [1800, 3200],
};

// ==================== 技能配置 ====================
const QUIZ_CONFIG = {
    CARD_WIDTH: 760,
    CARD_HEIGHT: 550,
    BUTTON_HEIGHT: 96,
    BUTTON_GAP: 128,
    CORRECT_AMMO_RANGE: [3, 5],
    WRONG_AMMO_RANGE: [-2, -3],
    SHOW_DURATION: 1300,
    PARTICLE_COUNT: 18,
    PARTICLE_DISTANCE: [80, 260],
};

// ==================== 视觉效果配置 ====================
const VFX_CONFIG = {
    // 尾焰
    TRAIL_INTERVAL: 35,
    TRAIL_LIFETIME: [180, 400],
    TRAIL_OFFSET_Y: 44,
    
    // 爆炸
    EXPLOSION_DISTANCE: [40, 200],
    EXPLOSION_DURATION: [220, 480],
    EXPLOSION_SCALE: [0.5, 1.8],
    
    // 连击
    COMBO_THRESHOLD: 3,
    COMBO_RING_THRESHOLD: 10,
    COMBO_RING_INTERVAL: 5,
    COMBO_DECAY_FRAMES: 80,     // 连击衰减帧数
    COMBO_BONUS_DIVISOR: 6,     // 连击加成分母
    
    // 成就提示
    ACH_TOAST_DURATION: 2500,
    ACH_TOAST_DELAY: 1500,
};

// ==================== 输入配置 ====================
const INPUT_CONFIG = {
    JOYSTICK_RADIUS: 110,
    JOYSTICK_DEADZONE: 16,
    FIRE_ZONE_X: 0.55,
    FIRE_ZONE_Y: 0.55,
    SKILL_BTN_SIZE: 60,
    SKILL_BTN_GAP: 110,
    PAUSE_BTN_SIZE: 36,
};

// ==================== 加载配置 ====================
const LOADING_CONFIG = {
    STEP_DELAY: 5,           // 大幅减少延迟，快速加载
    COMPLETE_DELAY: 200,
    PROGRESS_BAR_HEIGHT: 12,
};

// ==================== 星空背景配置 ====================
const STAR_CONFIG = {
    LAYERS: [
        { count: 50, speed: 0.03, scale: [0.3, 0.6], alpha: [0.15, 0.3] },
        { count: 30, speed: 0.10, scale: [0.5, 1.0], alpha: [0.25, 0.5] },
        { count: 15, speed: 0.22, scale: [0.8, 1.4], alpha: [0.4, 0.6] },
    ],
    NEBULA_COUNT: 3,
    NEBULA_COLORS: [0x1a237e, 0x4a148c, 0x0d47a1, 0x1b5e20, 0x880e4f],
    NEBULA_ALPHA: [0.08, 0.14],
    NEBULA_SIZE: { width: [240, 560], height: [120, 280] },
    CLOUD_COUNT: 5,
    CLOUD_ALPHA: [0.03, 0.06],
    CLOUD_SIZE: { width: [120, 320], height: [36, 68] },
};

// ==================== 难度配置 ====================
const DIFFICULTY_CONFIG = {
    easy: {
        enemyHp: 0.7,
        enemySpeed: 0.8,
        itemRate: 1.3,
        damage: 0.7,
        label: '🟢',
        labelFull: '🟢 简单',
    },
    normal: {
        enemyHp: 1.0,
        enemySpeed: 1.0,
        itemRate: 1.0,
        damage: 1.0,
        label: '🟡',
        labelFull: '🟡 普通',
    },
    hard: {
        enemyHp: 1.4,
        enemySpeed: 1.2,
        itemRate: 0.7,
        damage: 1.3,
        label: '🔴',
        labelFull: '🔴 困难',
    },
};

// ==================== UI 配置 ====================
const UI_CONFIG = {
    FONT_FAMILY: 'Arial,sans-serif',
    DEPTH: {
        BACKGROUND: 0,
        CLOUDS: 1,
        ITEMS: 8,
        ENEMIES: 9,
        PLAYER: 10,
        SHIELD: 11,
        BOSS_HP: 12,
        EFFECTS: 50,
        HUD: 300,
        PAUSE: 500,
        QUIZ: 400,
        TUTORIAL: 800,
        TOAST: 600,
    },
};

// ==================== 公共文本样式 ====================
const TEXT_STYLES = {
    // 标题样式
    TITLE: {
        fontSize: '56px',
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontStyle: 'bold',
        color: COLORS.ACCENT_HEX,
    },
    // 副标题
    SUBTITLE: {
        fontSize: '36px',
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontStyle: 'bold',
        color: '#ffab40',
    },
    // 正文
    BODY: {
        fontSize: '28px',
        fontFamily: UI_CONFIG.FONT_FAMILY,
        color: COLORS.TEXT_PRIMARY,
    },
    // 正文次要
    BODY_SECONDARY: {
        fontSize: '26px',
        fontFamily: UI_CONFIG.FONT_FAMILY,
        color: COLORS.TEXT_SECONDARY,
    },
    // 按钮样式
    BUTTON_PRIMARY: {
        fontSize: '36px',
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontStyle: 'bold',
        color: '#004d40',
        backgroundColor: '#18ffff',
        padding: { x: 56, y: 20 },
    },
    // HUD 样式
    HUD: {
        fontSize: '30px',
        fontFamily: UI_CONFIG.FONT_FAMILY,
        color: COLORS.ACCENT_HEX,
    },
    HUD_SMALL: {
        fontSize: '26px',
        fontFamily: UI_CONFIG.FONT_FAMILY,
    },
    // 飘字样式
    FLOAT_TEXT: {
        fontSize: '28px',
        fontStyle: 'bold',
    },
    BONUS_TEXT: {
        fontSize: '32px',
        fontStyle: 'bold',
        color: COLORS.WARNING_HEX,
    },
};

// ==================== 导出（如果使用模块系统） ====================
// export { GAME_WIDTH, GAME_HEIGHT, COLORS, PLAYER_CONFIG, ... };
