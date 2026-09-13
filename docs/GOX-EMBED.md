# go3 给课页 / gox 的嵌入约定

go3 是编辑器，不内置课程内容或半成品目录。课程网页以后另做；gox 只嵌课页，课页再 iframe 或跳转引用 go3，并用 postMessage 传入工程 JSON。

## 地址

- 本机：`http://localhost:5173/?embed=1`
- 指定已有案例：`http://localhost:5173/?embed=1&project=mood_diary`
- 线上：`https://go3.mixly.cn/mobile-app-design/?embed=1`

`embed=1` 收起上课无关导航。`?project=` **只认编辑器已有案例 id**（如 `mood_diary`），不认 `lesson06-*` 这类课包 id。半成品请由课页传入 JSON。

编辑器内：**重置**回到本次载入时的初始工程（`starterSnapshot`）；**另存副本**新 id，不覆盖快照。

## postMessage

父页（课页）→ go3：

- `{ type: 'go3-inspect' }`
- `{ type: 'go3-load', project: 'mood_diary' }`（仅已有案例 id）
- `{ type: 'go3-load', json: { ...工程 } }`（课页自带的半成品）
- `{ type: 'go3-reset' }`
- `{ type: 'go3-export' }`

go3 → 父页：

- `{ type: 'go3-ready' }`
- `{ type: 'go3-preview-opened' }`
- `{ type: 'go3-inspect-result', previewOpened, screens, components, componentTypes, blockTypes, project }`
- `{ type: 'go3-export-result', project }`

第一期检查：预览是否打开过 + 是否有某屏幕/组件/积木（如 `tinydb_*`、`web_get`/`web_post`、`app_clear_local`）+ 工程 JSON 能否带走。不做自动阅卷。

本机可在父页控制台向 iframe `contentWindow.postMessage({ type: 'go3-inspect' }, '*')` 验证。

## 线上必须配：允许被课站 iframe

`frame-ancestors` 只能靠 HTTP 头，meta 无效。发布脚本只上传 `dist/`。线上已在站点配置 `html_go3.mixly.cn.conf` 加过：

```
add_header Content-Security-Policy "frame-ancestors 'self' http://localhost:5174 http://127.0.0.1:5174";
```

正式课站域名确定后，把该域名追加进同一条，不要写 `X-Frame-Options: DENY` / `SAMEORIGIN`。需要再改时可跑 `node scripts/patch-go3-csp.mjs`（需 `BT_PASS`）。本机 `npm run dev` / `npm run preview` 已带同样的 CSP 头。

## 铺满 iframe

`embed=1` 时 `html` / `body` / `#root` / `.ide` 为 100% 高宽，`min-width: 0`，内部自己滚动，避免按显示器比例切出的课站框被撑破。
