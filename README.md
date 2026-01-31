# 三消小游戏（手机可玩）

这是一个纯前端（HTML/CSS/JS）的三消小游戏，手机浏览器打开即可玩：

- 手指在格子上 **上下左右滑动**，与相邻格子交换
- 形成 **≥3 连** 会自动消除、下落补位，并可连消加成
- 右上角可 **重开**

## 如何运行

### 方式 A：用 VSCode/Cursor 的 Live Server（推荐）

1. 安装/启用 Live Server
2. 右键 `index.html` → Open with Live Server

### 方式 B：用 Python 启动静态服务器

在项目目录运行：

```bash
python -m http.server 5173
```

然后用浏览器打开 `http://localhost:5173/`。

## 文件说明

- `index.html`：页面结构
- `style.css`：移动端自适应样式
- `game.js`：三消核心逻辑（交换、匹配、消除、下落、计分、触控）

