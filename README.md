# Bomberman UK01 (multiplayer + AI bots)

這是一個 Bomberman 風格的多人連線小遊戲 fork（UK01 版），前端使用 **Phaser.js**，後端使用 **Node.js + Express + Socket.IO**。

- UK01 fork repo：https://github.com/darrenyu888/bomberman-uk01
- Upstream（原作）repo：https://github.com/DmytroVasin/bomber （作者：Dmytro Vasin）

---

## 🦞 Abyssal Bomber (Project Codename) Update (2026-02-07)

本專案正在進行深海主題改版（Codename: Abyssal Bomber）。

### 🎨 Visual Style (美術風格)
- **Style**: 16-bit SNES Pixel Art (超任像素風)
- **Perspective**: Top-down Grid (俯視網格)
- **Palette**: Deep Ocean (Dark Blues, Teals, Bioluminescent Neon Pinks/Greens)
- **Sprite Size**: 32x32px (Grid), 24x24px (Collision Box)

### 🎁 Items & Power-ups (道具圖鑑)

#### Basic Items (基礎強化)
| Icon | Name | Effect (作用) |
| :--- | :--- | :--- |
| 🔥 | **Fire (火力)** | 增加炸彈爆炸的延伸長度 (+1 格)。 |
| 💣 | **Bomb (炸彈)** | 增加同時可放置的炸彈數量 (+1 顆)。 |
| ⛸️ | **Speed (速度)** | 增加角色移動速度。 |

#### Special Items (特殊能力)
| Icon | Name | Effect (作用) |
| :--- | :--- | :--- |
| 🥊 | **Kick (踢踢腳)** | 允許踢開擋路的炸彈（踢出去的炸彈會滑行直到撞牆）。 |
| 🎮 | **Remote (遙控器)** | 放置的炸彈不會自動爆炸，按 B 鍵（或點擊炸彈鈕）手動引爆。 |
| 🛡️ | **Shield (護盾)** | 獲得短暫的無敵時間（約 15 秒），可抵擋一次傷害。 |
| 👻 | **Ghost (穿牆)** | 允許穿過軟牆（可破壞障礙物）和炸彈，持續約 15 秒。 |

### 👾 Monster Bestiary (怪物圖鑑)

#### 1. Sweet Bite (甜心咬咬)
*A deceptive anglerfish that uses a cute heart-shaped light to lure prey.*

- **Visuals**:
  - **Body**: Round, Teal/Green (`#008080`)
  - **Lure**: Glowing Pink Heart (`#FF69B4`) on a short rod
  - **Feature**: Small "tadpole" lure dangling from mouth corner
  - **Expression**: Cute white triangle teeth, turns scary when attacking

- **Animations**:
  - **Idle**: Bobbing up/down (1px), Heart pulsing.
  - **Walk**: Squashing and stretching like a jellyfish.
  - **Attack (Bite)**: Mouth opens wide (exaggerated 90°), teeth extend, lunges forward.
  - **Stun**: Upside down, X eyes, tongue out.

- **Behavior**:
  - **Pattern**: Patrols hallways.
  - **Aggro**: Accelerates when player enters the same row/column.
  - **Trap**: Feigns passivity until close range.

### 🗺️ Map Design (地圖設計)

#### Theme: The Abyssal Trench (深海海溝)
- **Vibe**: Dark, claustrophobic, illuminated by glowing flora and enemies.

#### Tilesets (32x32)
1.  **Floor**:
    - Dark blue seabed sand.
    - Occasional glowing plankton (animated pixels).
2.  **Hard Blocks (Indestructible)**:
    - Ancient Shipwreck Metal (rusty rivets).
    - Black Volcanic Rock.
3.  **Soft Blocks (Destructible)**:
    - **Brain Coral**: Pink/Purple, pulsates slightly.
    - **Tube Sponges**: Green, tall vertical structures.
    - **Crates**: Waterlogged wooden crates with barnacles.

### 🐰 Character Design (角色造型)

#### Pink Rabbit (粉紅兔兔)
*Just a normal Pink Rabbit. No diving gear. Just vibing.*

- **Visuals**:
  - **Color**: Hot Pink / Pastel Pink (`#FFB6C1`)
  - **Style**: Classic "Bomberman" mascot style (Big head, simple body).
  - **Equipment**: **None.** No helmet, no tank. Just a rabbit in the deep sea. (Cartoon logic).
  - **Expression**: Determined or Cheerful (`>‿<`).

- **Animations**:
  - **Idle**: Breathing, ears twitching.
  - **Walk**: Bouncy run cycle.
  - **Bomb**: Tossing a standard black bomb (or carrot bomb).
  - **Death**: Classic spin-and-flatten or "burnt toast" face.

---

## 特色（UK01 fork 舊有功能）

### 2026-02-06 更新摘要
- 建置工具更新（Webpack/Babel）並加入 `package-lock.json`（偏向 **npm** 的可重現安裝）。
- 伺服器端加入 **AI bots**（`server/bots.js`），可用來補滿房間/提升可玩性。
- 加強/調整 **觸控操作**與行動裝置友善 UI（mobile menu/pending/touch overlays + loading overlay）。
- 地圖選單與地圖資源更新（新增/擴充地圖與預覽圖）。
- 遊戲性調整：
  - 新道具（shield/remote/kick/ghost）+ 道具閃光效果
  - 特殊地板（portal/speed floor）視覺與音效
  - 勝利事件補充 reason（debug）+ 手機結算頁支援 tap return
- Google 登入（GIS）+ 可改 displayName + 後台保存 Gmail/email + 基本戰績（wins/losses/gamesPlayed）。
- 新增排行榜：
  - API：`/api/leaderboard`（支援 `sort=wins|winrate|games`、`minGames`）
  - 頁面：`/leaderboard`（可視化、可切排序、支援最低場次門檻、標示你的名次）

### 基本玩法
- 支援最多約 3 位玩家同場。
- 最後存活者獲勝。
- 可透過破壞方塊取得強化（如速度、炸彈能力等）。

> 註：上游 README 內的截圖/影片連結（menu/intro 等）多數沿用原作資源，詳見文末「Upstream reference」。

---

## 遊戲入口（UK01）
- 線上遊玩（Production）：https://uk01.taiwan101.net/

---

## 地圖（Maps）
目前前端選單可選的地圖（見 `client/js/utils/constants.js` → `AVAILABLE_MAPS`）：
- hot_map
- cold_map
- arena_map
- open_map
- rune_lab
- mirror_temple
- trap_garden

---

## 系統需求
- Node.js：建議 **18+**（見 `package.json` engines）
- npm：建議使用 `npm ci`（本 repo 提供 `package-lock.json`）

---

## 本機快速開始（建議 / npm）

```bash
git clone https://github.com/darrenyu888/bomberman-uk01.git
cd bomberman-uk01

# 安裝依賴（使用 lockfile，環境更穩定）
npm ci

# 建置前端 bundle（production）
npm run build:prod

# 啟動伺服器（預設 PORT=3000）
PORT=3000 npm start

# 打開瀏覽器
# http://localhost:3000
```

### 常用 npm scripts
- `npm run build`：development build
- `npm run build:prod`：production build
- `npm start`：直接啟動 server
- `npm test`：Node.js 內建 test runner

---

## 登入 / 個人資料 / 戰績（UK01）

### Google 登入（輕量方案）
本 fork 支援使用 **Google Identity Services** 進行登入：
- 登入後會在後台保存：`google sub`、**Gmail/email**（供後台查詢）、頭像、displayName
- 使用者可在頁面左上角浮層修改自己的 **displayName**（1..24 字）

#### 環境變數
啟動 server 前請設定：
- `GOOGLE_CLIENT_ID`：Google OAuth Client ID
- `JWT_SECRET`：簽發登入 cookie 用的 secret（務必改成強密碼字串）

---

## AI bots（用法 / 參數）

### 房間建立限制（UK01）
- 同一個使用者（以 **Socket 連線**代表使用者）在**同一個 IP** 下，最多同時建立 **2 個 pending rooms**。
- 超過時會回傳 `ROOM_LIMIT` 並在前端跳出提示（alert）。

### UI 操作（建議）
進入「Pending Game / 等待房間」畫面後，可以直接在畫面上設定：
- **AI 數量**：`AI: N`（用 `+` / `-` 調整）
  - 目前 client 端會把數量限制在 **0..3**（對應 max players=4 的情境）
- **AI 難度**：`Easy / Normal / Hard`

### 伺服器端行為（摘要）
- 進入 pending game 時，伺服器會嘗試 **自動補滿 bot**（未滿房就補到接近滿房）。
- 伺服器端 bot id 會以 `bot:` 作為前綴（例如 `bot:<gameId>:...`）。
- 若 pending game 內「只剩 bots」，最後一個真人離開時會自動清掉 bots 並刪除該 pending game。

### Socket.IO 事件（給自製前端/測試用）
在進入 pending game 後可透過以下事件調整：
- `set ai count`：`{ count: number }`
  - 伺服器端會再做一次 clamp：`0..(max_players-1)`
- `set ai difficulty`：`{ difficulty: 'easy' | 'normal' | 'hard' }`

---

## 部署（UK01 fork：Linux / systemd + Nginx）

### 方式 A：systemd 服務化
本機環境曾使用的範例服務檔（依你的實際路徑調整）：
- `/etc/systemd/system/bomberman-web.service`
- `WorkingDirectory=/root/clawd/bomberman-web`
- `ExecStart=/usr/bin/node server/app.js`
- `Environment=PORT=3000`

常用指令：
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now bomberman-web
sudo systemctl status bomberman-web
sudo journalctl -u bomberman-web -f
```

### 方式 B：（可選）Nginx 反向代理 + WebSocket（Socket.IO）
若要用網域對外服務，Nginx 需要支援 WebSocket upgrade。

本機環境曾使用的範例設定（可能放在 `bomberman.conf.disabled`，啟用時請改成 `.conf`）：
- `/etc/nginx/conf.d/bomberman.conf`
- upstream 指向 `127.0.0.1:3000`

啟用/測試：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 除錯（Debug Node）
1. 打開 `chrome://inspect/#devices`
2. Click "Open dedicated DevTools for Node"
3. 以 `--inspect` 方式啟動 server，例如：
   - `node --inspect server/app.js`

---

## Upstream reference（原作參考）
以下資源/說明主要來自 upstream，保留作為參考：
- Tutorial（need work）：https://github.com/DmytroVasin/bomber/blob/master/tutorial.md
- 原作 demo（Heroku 歷史連結）：https://bomb-attack.herokuapp.com/
- 原作 README 內的預覽圖：
  - Menu： https://raw.githubusercontent.com/DmytroVasin/bomber/master/_readme/menu.png
  - Intro： https://raw.githubusercontent.com/DmytroVasin/bomber/master/_readme/intro.png

---

## License / Credits
- 原作作者：Dmytro Vasin（upstream repo： https://github.com/DmytroVasin/bomber ）
- 本 repo 為 UK01 fork，保留 upstream attribution。
