# Hanziify

[简体中文](#简体中文) · [English](#english)

## 简体中文

Hanziify 将 Spotify 桌面版中的繁体中文转换为简体中文。支持正在播放栏、歌单、艺人和专辑页面、音乐库、搜索结果，以及 Spotify 已提供的歌词。你也可以在歌单中用简体中文搜索歌名或艺人名。

### 在 Windows 上安装

1. 安装 Spotify 桌面版并登录。如果是刚安装的，请先打开 Spotify 等待约一分钟。
2. 从 [GitHub 发布页面](https://github.com/shenzheyu06/Hanziify/releases)下载 `HanziifySetup.exe`。
3. 双击安装文件。如果电脑还没有 Spicetify，安装程序会先通过 WinGet 安装 Spicetify，再安装 Hanziify。

使用安装程序无需安装 Node.js。

#### 手动安装

先安装并配置 [Spicetify](https://spicetify.app/docs/getting-started)。从发布页面下载 `hanziify.js`，保存到「下载」文件夹，然后在 PowerShell 中运行：

```powershell
New-Item -ItemType Directory -Force "$env:APPDATA\spicetify\Extensions" | Out-Null
Copy-Item "$env:USERPROFILE\Downloads\hanziify.js" "$env:APPDATA\spicetify\Extensions\hanziify.js" -Force
spicetify config extensions hanziify.js
spicetify apply
```

### 从源码构建

安装 Node.js 24 或更高版本后，在项目文件夹中运行：

```powershell
npm ci
npm run build
```

构建完成后，扩展文件会保存在 `dist/hanziify.js`。在 Windows 上运行 `npm run build:installer` 可生成安装程序 `dist/HanziifySetup.exe`。

## English

Hanziify converts Traditional Chinese to Simplified Chinese in Spotify Desktop. It covers Now Playing, playlists, artist and album pages, Your Library, search, and lyrics Spotify already shows. You can also search a playlist by typing a Simplified Chinese song title or artist name.

### Install on Windows

1. Install Spotify Desktop and sign in. If you just installed Spotify, leave it open for about a minute.
2. Download `HanziifySetup.exe` from [GitHub Releases](https://github.com/shenzheyu06/Hanziify/releases).
3. Double-click the file. Setup installs Spicetify through WinGet if needed, then installs Hanziify.

You don’t need Node.js to use the installer.

#### Manual install

Set up [Spicetify](https://spicetify.app/docs/getting-started) first. Save `hanziify.js` from the release in your Downloads folder, then run these commands in PowerShell:

```powershell
New-Item -ItemType Directory -Force "$env:APPDATA\spicetify\Extensions" | Out-Null
Copy-Item "$env:USERPROFILE\Downloads\hanziify.js" "$env:APPDATA\spicetify\Extensions\hanziify.js" -Force
spicetify config extensions hanziify.js
spicetify apply
```

### Build from source

With Node.js 24 or newer, run these commands in the project folder:

```powershell
npm ci
npm run build
```

This creates `dist/hanziify.js`. On Windows, run `npm run build:installer` to build `dist/HanziifySetup.exe`.
