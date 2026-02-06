class Preload extends Phaser.State {

  preload() {
    // Debug loader issues on mobile (use ?debug=1)
    try {
      this.load.onFileError.add((key, file) => {
        try { if (window.UK01Log) window.UK01Log(`LOAD_ERR key=${key} url=${file && file.url}`); } catch (_) {}
      });
      this.load.onFileComplete.add((progress, key) => {
        try {
          if (window.UK01Loading) window.UK01Loading.set(progress, `載入中：${key}`);
          if (window.UK01Log && progress < 100) window.UK01Log(`LOAD ${progress}% ${key}`);
        } catch (_) {}
      });
      this.load.onLoadComplete.add(() => {
        try {
          if (window.UK01Loading) window.UK01Loading.set(100, '完成');
          if (window.UK01Log) window.UK01Log('LOAD_DONE');
        } catch (_) {}
      });
    } catch (_) {}
    // Menu:
    this.load.image('main_menu',     'images/menu/main_menu.png');
    this.load.image('slot_backdrop', 'images/menu/slot_backdrop.png');

    this.load.spritesheet('buttons',    'images/menu/buttons.png', 200, 75);
    this.load.spritesheet('check_icon', 'images/menu/accepts.png', 75, 75);
    this.load.spritesheet('list_icon',  'images/menu/game_enter.png', 75, 75);

    this.load.image('hot_map_preview',   'images/menu/hot_map_preview.png');
    this.load.image('cold_map_preview',  'images/menu/cold_map_preview.png');
    // cache-bust to ensure clients fetch the updated preview
    this.load.image('arena_map_preview', 'images/menu/arena_map_preview.png?v=2');
    // cache-bust to ensure clients fetch the updated preview
    this.load.image('open_map_preview',  'images/menu/open_map_preview.png?v=3');
    this.load.image('rune_lab_preview',  'images/menu/rune_lab_preview.png?v=1');
    this.load.image('mirror_temple_preview', 'images/menu/mirror_temple_preview.png?v=1');
    this.load.image('trap_garden_preview', 'images/menu/trap_garden_preview.png?v=1');
    this.load.image('prev',             'images/menu/left_arrow.png');
    this.load.image('next',             'images/menu/right_arrow.png');

    // Map:
    this.load.image('tiles',      'maps/tileset.png');
    this.load.tilemap('hot_map',   'maps/hot_map.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('cold_map',  'maps/cold_map.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('arena_map', 'maps/arena_map.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('open_map',  'maps/open_map.json',  null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('rune_lab',  'maps/rune_lab.json',  null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('mirror_temple',  'maps/mirror_temple.json',  null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('trap_garden',  'maps/trap_garden.json',  null, Phaser.Tilemap.TILED_JSON);


    // Game:
    this.load.spritesheet('explosion_center',     'images/game/explosion_center.png',     35, 35);
    this.load.spritesheet('explosion_horizontal', 'images/game/explosion_horizontal.png', 35, 35);
    this.load.spritesheet('explosion_vertical',   'images/game/explosion_vertical.png',   35, 35);
    this.load.spritesheet('explosion_up',         'images/game/explosion_up.png',         35, 35);
    this.load.spritesheet('explosion_right',      'images/game/explosion_right.png',      35, 35);
    this.load.spritesheet('explosion_down',       'images/game/explosion_down.png',       35, 35);
    this.load.spritesheet('explosion_left',       'images/game/explosion_left.png',       35, 35);

    this.load.spritesheet('spoil_tileset', 'images/game/spoil_tileset.png', 35, 35);
    this.load.spritesheet('bone_tileset',  'images/game/bone_tileset.png', 35, 35);
    this.load.spritesheet('bomb_tileset',  'images/game/bombs.png', 35, 35);

    this.load.image('speed_up_bonus',    'images/game/speed_up_bonus.png');
    this.load.image('speed_up_no_bonus', 'images/game/speed_up_no_bonus.png');
    this.load.image('delay_up_bonus',    'images/game/delay_up_bonus.png');
    this.load.image('delay_up_no_bonus', 'images/game/delay_up_no_bonus.png');
    this.load.image('power_up_bonus',    'images/game/power_up_bonus.png');

    this.load.image('placeholder_power', 'images/game/placeholder_power.png');
    this.load.image('placeholder_speed', 'images/game/placeholder_speed.png');
    this.load.image('placeholder_time',  'images/game/placeholder_time.png');

    // Special tiles FX
    this.load.spritesheet('portal_fx', 'images/game/portal_fx.png', 35, 35);
    this.load.spritesheet('speed_fx',  'images/game/speed_fx.png', 35, 35);
    this.load.image('ghost_icon', 'images/game/ghost_icon.png');

    // SFX / BGM (mobile may require user gesture to unlock audio)
    this.load.audio('sfx_portal',    ['sfx/portal.wav']);
    this.load.audio('sfx_speed',     ['sfx/speed.wav']);
    this.load.audio('sfx_explosion', ['sfx/explosion.wav']);
    this.load.audio('sfx_death',     ['sfx/death.wav']);
    this.load.audio('bgm_main',      ['sfx/bgm.wav']);

    // Cosmetics (paper-doll overlays)
    this.load.image('cosmetic_base', 'images/game/cosmetics/base.png');
    for (let i = 1; i <= 10; i++) {
      this.load.image(`cosmetic_hat_${i}`, `images/game/cosmetics/hat_${i}.png`);
      this.load.image(`cosmetic_hair_${i}`, `images/game/cosmetics/hair_${i}.png`);
      this.load.image(`cosmetic_outfit_${i}`, `images/game/cosmetics/outfit_${i}.png`);
    }
    for (let i = 1; i <= 4; i++) {
      this.load.image(`cosmetic_face_${i}`, `images/game/cosmetics/face_${i}.png`);
    }
    for (let i = 1; i <= 6; i++) {
      this.load.image(`cosmetic_pattern_${i}`, `images/game/cosmetics/pattern_${i}.png`);
    }

    // Skins:
    this.load.image('bomberman_head_blank',     'images/game/chars/0-face.png');

    this.load.image('bomberman_head_Theodora',  'images/game/chars/1-face.png');
    this.load.image('bomberman_head_Ringo',     'images/game/chars/2-face.png');
    this.load.image('bomberman_head_Jeniffer',  'images/game/chars/3-face.png');
    this.load.image('bomberman_head_Godard',    'images/game/chars/4-face.png');
    this.load.image('bomberman_head_Biarid',    'images/game/chars/5-face.png');
    this.load.image('bomberman_head_Solia',     'images/game/chars/6-face.png');
    this.load.image('bomberman_head_Kedan',     'images/game/chars/7-face.png');
    this.load.image('bomberman_head_Nigob',     'images/game/chars/8-face.png');
    this.load.image('bomberman_head_Baradir',   'images/game/chars/9-face.png');
    this.load.image('bomberman_head_Raviel',    'images/game/chars/10-face.png');
    this.load.image('bomberman_head_Valpo',     'images/game/chars/11-face.png');

    this.load.spritesheet('bomberman_Theodora',  'images/game/chars/1-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Ringo',     'images/game/chars/2-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Jeniffer',  'images/game/chars/3-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Godard',    'images/game/chars/4-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Biarid',    'images/game/chars/5-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Solia',     'images/game/chars/6-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Kedan',     'images/game/chars/7-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Nigob',     'images/game/chars/8-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Baradir',   'images/game/chars/9-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Raviel',    'images/game/chars/10-preview.png', 32, 32);
    this.load.spritesheet('bomberman_Valpo',     'images/game/chars/11-preview.png', 32, 32);
  }

  create() {
    // Hide loading overlay
    try { if (window.UK01Loading) window.UK01Loading.done(); } catch (_) {}
    this.state.start('Menu');
  }
}

export default Preload;
