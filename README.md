# AI2 Node Inventor

基于 MIT App Inventor 交互理念的**可视化 App 搭建器**（电脑端网页）：设计器 + Blockly 积木 + 浏览器预览 + **PWA / 本机一键 APK**。

面向中小学生自主课题研究：在电脑上设计，教师机一键打成 Debug APK 装到手机演示。

- **开发**：Node（推荐 `E:\Node`）
- **学生端**：浏览器打开 IDE，数据在 IndexedDB
- **发布**：导出 PWA，或点「导出 APK」本机直接出安装包（需 `E:\ai2-build-env`）

## 快速开始（IDE）

```bat
set PATH=E:\Node;%PATH%
cd /d 本仓库目录
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 学生使用路径

1. 左侧「学习」面板按六步做课题，或从模板开始
2. 「设计器」拖组件 → 「积木」写逻辑 → 预览验证
3. **导出 PWA**：网页演示
4. **导出 APK**：本机直接下载 `.apk`（约 1～2 分钟）

详见 [docs/CLASSROOM.md](docs/CLASSROOM.md)

## 教师：打 APK

前提：已装 `E:\ai2-build-env`（JDK21+SDK）与 `E:\ai2-node\mobile-shell`。

1. `npm run dev` 打开 IDE
2. 打开学生作品，点顶栏 **导出 APK**
3. 浏览器自动下载一份 `.apk`（在系统「下载」文件夹）

详见 [docs/APK.md](docs/APK.md) 与 [mobile-shell/README.md](mobile-shell/README.md)

## 构建静态 IDE 站点

```bat
npm run build
```

产物在 `dist/`。注意：纯静态托管**不能**本机打 APK，需 `npm run dev` 或 `npm run preview`。

## 功能摘要

| 能力 | 说明 |
|------|------|
| 组件 | 80+：界面/布局/媒体/趣味/数据/传感器/工具 |
| 积木 | 简体中文工具箱与自定义块 |
| 导出 PWA | zip：index.html + SW |
| 导出 APK | 本机 Gradle 打 Debug 包并下载 |
| 真机能力 | Capacitor Camera / Geolocation / Preferences |

## 已知限制

- Debug APK 需侧载，默认不上架应用商店
- 桌面预览时传感器/相机能力弱于真机
- 「导出 APK」依赖本机 Android 环境，纯静态站不可用

## 目录要点

- `src/` — IDE 与运行时
- `mobile-shell/` — Capacitor 打包壳
- `E:\ai2-build-env` — JDK / SDK（本机）
- `E:\ai2-node\mobile-shell` — 打包壳（构建用，不作为分发目录）
