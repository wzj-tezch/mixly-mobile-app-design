# 本机一键打 APK

## 前提（装一次）

1. Node：`E:\Node`
2. 构建环境：`E:\ai2-build-env`（jdk-21 + sdk）
3. 壳工程：`E:\ai2-node\mobile-shell`（必须英文路径）

## 用法

```bat
set PATH=E:\Node;%PATH%
cd /d 本仓库
npm run dev
```

打开 http://localhost:5173 → **导出 APK** → 等待进度条 → **浏览器自动下载一份** `.apk`。

文件名形如：`ai2-<项目id>-debug.apk`，在系统「下载」文件夹。

> 构建在 `E:\ai2-node\mobile-shell` 进行；完成后只通过浏览器下载一份 apk。

## 注意

- 仅 Debug 包，课堂侧载用
- 同时只能跑一个打包任务
- 仓库在中文路径时，打包子进程固定从 `E:\ai2-node\scripts` 启动
