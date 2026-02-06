# Bomberman UK01 (multiplayer + AI bots)

這是一個 Bomberman 風格的多人連線小遊戲 fork（UK01 版），前端使用 **Phaser.js**，後端使用 **Node.js + Express + Socket.IO**。

- UK01 fork repo：https://github.com/darrenyu888/bomberman-uk01
- Upstream（原作）repo：https://github.com/DmytroVasin/bomber （作者：Dmytro Vasin）

---

## 特色（UK01 fork）

### 2026-02-06 更新摘要
- 建置工具更新（Webpack/Babel）並加入 `package-lock.json`（偏向 **npm** 的可重現安裝）。
- 伺服器端加入 **AI bots**（`server/bots.js`），可用來補滿房間/提升可玩性。
- 加強/調整 **觸控操作**與行動裝置友善 UI。
- 地圖選單與地圖資源更新（新增/擴充地圖與預覽圖）。
- 遊戲性調整：道具/效果（FX/SFX）、spoil/power-up 行為等。

### 基本玩法
- 支援最多約 3 位玩家同場。
- 最後存活者獲勝。
- 可透過破壞方塊取得強化（如速度、炸彈能力等）。

> 註：上游 README 內的截圖/影片連結（menu/intro 等）多數沿用原作資源，詳見文末「Upstream reference」。

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
