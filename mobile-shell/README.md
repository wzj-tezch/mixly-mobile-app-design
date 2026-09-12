# AI2 Mobile Shell（APK 打包壳）

将 IDE 导出的学生作品（`www/`）用 Capacitor 打成 Android Debug APK，供课堂真机安装。

## 环境要求（教师机 / 构建机）

- Node.js 18+（可用 `E:\Node`）
- Android Studio（含 SDK、平台工具）
- 环境变量：`ANDROID_HOME` 或 `ANDROID_SDK_ROOT`
- JDK 17+

## 快速流程

```bat
cd mobile-shell
set PATH=E:\Node;%PATH%
npm install
npx cap add android
```

把作品放入 `www/`（IDE「导出 APK 工程」解压后的 `www`，或运行仓库根目录 `npm run mobile:load -- path\to\export`）：

```bat
npx cap sync android
npm run build:apk
```

APK 路径通常为：

`android/app/build/outputs/apk/debug/app-debug.apk`

用数据线或局域网发给学生安装（需允许「未知来源」）。

## 说明

- Debug APK 仅供课堂演示，不上架应用商店。
- 相机 / 定位权限在首次使用时由系统弹出。
- 若 `gradlew` 失败，用 Android Studio 打开 `android/` 再 Build → Build APK(s)。
