## A Bomberman-style game with multiplayer option.

**Fork notice / 原作說明**
- 原作者（Upstream）：Dmytro Vasin
- 原作 Repo：https://github.com/DmytroVasin/bomber
- 本 repo（UK01 fork）：https://github.com/darrenyu888/bomberman-uk01

A Bomberman-style game with multiplayer option made with [Phaser.js](https://phaser.io/), [Node.js](https://nodejs.org/uk/), [Express.js](http://expressjs.com/), [Socket.io](https://socket.io/).

### UK01 Fork Updates (2026-02-06)
- Modernize build/tooling (Webpack/Babel config refresh) + add `package-lock.json` (npm-based install).
- Added **AI bots** support on server side (`server/bots.js`) for filling lobbies / single-player-like play.
- Added/updated **touch controls** & mobile-friendly UI adjustments.
- Map selection improvements + new/extra maps & previews (e.g. arena/open + additional map stubs).
- Gameplay tweaks & new effects/assets (speed/portal FX + SFX), plus power-up/spoil behavior adjustments.


### Game description:

The game is designed for up to three players.

Games can be played on one of two maps.

![Maps](https://raw.githubusercontent.com/DmytroVasin/bomber/master/_readme/maps.png)

Player models user will receive randomly when he will enter the game.

The winning player is the last one standing.

Within the game, players can upgrade skills like:
( Change to drop - 50% when player break the block )

* ![Speed Up](https://raw.githubusercontent.com/DmytroVasin/bomber/master/_readme/speed.png) Speed: can increase to 3
* ![Bomb setting time](https://raw.githubusercontent.com/DmytroVasin/bomber/master/_readme/time.png) Bomb setting time: can be reduced to 0.5 seconds
* ![Power Up](https://raw.githubusercontent.com/DmytroVasin/bomber/master/_readme/power.png) Power: no limit

## Demo:
You can find a tutorial on how to make Bomberman-style games here: [Tutorial (need work)](https://github.com/DmytroVasin/bomber/blob/master/tutorial.md)

A demo of this game can be found on Heroku: [Bomberman with multiplayer - Demo](https://bomb-attack.herokuapp.com/)

Note: To play the game, you should open the browser in two separate windows. The game pauses when You open a new tab in the same window. Open game in different windows.

## Game: *Click to play*:
[![Preview](https://raw.githubusercontent.com/DmytroVasin/bomber/master/_readme/menu.png)](https://player.vimeo.com/video/246595375?autoplay=1)

## Menu: *Click to play*:
[![Preview](https://raw.githubusercontent.com/DmytroVasin/bomber/master/_readme/intro.png)](https://player.vimeo.com/video/247095838?autoplay=1)

## Setup:
The game requires Node and Yarn (npm) package manager. Make sure that you already have both installed on your system before trying to launch it.

Steps (upstream original):
1. Clone the repository.
2. Run `yarn install` inside a newly created directory.
3. Start the server with the command `yarn run server` ( defined in the `package.json` file ). This will launch `webpack` in your development environment and then start the `node` server.
4. Check out the game at [http://localhost:3000](http://localhost:3000)
5. Enjoy!

### UK01 fork: 本機部署方式（建議 / npm）
> 本段是針對本 fork 目前的安裝與部署方式（已加入 `package-lock.json`）。

#### 方式 A：直接在本機跑（開發/測試）
```bash
git clone https://github.com/darrenyu888/bomberman-uk01.git
cd bomberman-uk01

# 安裝依賴（建議用 npm lockfile）
npm ci

# Build（production bundle）
npm run build:prod

# 啟動（預設 PORT=3000）
PORT=3000 npm start

# 瀏覽器開啟
# http://localhost:3000
```

#### 方式 B：systemd 服務化（Linux）
範例 service（本機環境曾使用）：
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

#### （可選）方式 C：Nginx 反向代理 + WebSocket（Socket.IO）
如果要用網域對外服務，Nginx 需要支援 WebSocket upgrade。
範例設定（本機環境曾使用，檔名可能為 `bomberman.conf.disabled`，啟用時請改成 `.conf`）：
- `/etc/nginx/conf.d/bomberman.conf`
- 反向代理到 `127.0.0.1:3000`

啟用/測試：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Notes:
You can use my code as a boilerplate if you want, but I would suggest you change the tile sizes. I've picked tiles that are 35x35 pixels, but tiles that are 32x32 would be more ideal. All free templates are based on this tile size, and it is also handily divisible by 2.

## To Debug Node process:
1. Open: chrome://inspect/#devices
2. Click 'Open dedicated DevTools for Node'
3. "server": "webpack --mode development && node --inspect server/app.js",
