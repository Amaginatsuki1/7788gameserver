# 7788 游戏服务器网站

Terraria 与 Minecraft 私人游戏服务器的公开入口，提供世界介绍、图文进服教程、模组资料、更新记录、匿名运行状态，以及 Daybreak DamageTracker 的运行逻辑与源码导览。

Terraria 内容已配置；Minecraft 保留完整页面，具体版本、玩法、地址和模组仍待确定。状态页通过独立 Python/SQLite 后端读取真实匿名数据；连接失败、数据过期或结构不正确时显示未知。

## 本地开发

需要 Node.js 22.13+ 和 npm。运行监控测试另需 Python 3.10+。

```sh
npm ci
npm run dev
```

默认访问 `http://localhost:3000`。Windows 也可双击 `打开本地预览.cmd`。开发服务器仅用于本地开发；私钥、密码及实际 SSH 配置应放在项目目录之外。

## 构建与验证

```sh
npm run lint
npm test
npm run test:backend
npm run build:static
npm run check:public
```

- `npm run build`：vinext/Vite 开发运行时构建，产物为 `dist/`；`npm run start` 启动该运行时。
- `npm run build:static`：Next.js 静态导出，产物为 `out/`，用于 Nginx 等静态托管。生产站不需要 Node 服务。
- `npm test`：构建后验证八个公开页面、内容约束、状态响应校验及网络错误处理。
- `npm run test:backend`：验证匿名监控、过期/失败处理与带时间戳的历史数据。
- `npm run check:public`：检查待公开文件路径、常见密钥模式、图片格式和本地素材混入情况。它不替代对 Git 历史、图片内容和第三方素材授权的人工检查。

## 复用与配置

项目保留 7788 自身的公开品牌、连接信息及内容，默认状态 API 和探针也指向 7788。部署自己的副本前，将 `.env.example` 复制为 `.env.local`，设置自己的公开端点；`NEXT_PUBLIC_*` 在构建时写入浏览器代码，不能放密码或令牌。

| 配置/内容 | 位置 |
| --- | --- |
| 网站 URL、状态 API、游戏 HTTPS 探针 | `lib/site-config.ts`、`.env.example` |
| 模组资料、图标与 Workshop 来源 | `lib/server-data.ts`、`lib/mod-image-extensions.json` |
| 游戏版本、世界说明、连接教程 | `app/terraria/`、`app/minecraft/`、`app/page.tsx` |
| 更新记录、Mod 开发说明 | `app/updates/`、`app/mod-development/` |
| 状态 API 中的公开游戏字段 | `monitoring-backend/status_backend.py` |
| 站点地图、robots 和部署域名 | `public/sitemap.xml`、`public/robots.txt`、`deploy/` |

环境变量只配置公共端点，不会自动替换正文、截图、地图或部署配置中的品牌与域名。修改站点域名时应一并检查上述位置。监控接口与探针需要为实际网页来源配置 CORS。

## 页面

`/`、`/terraria`、`/terraria/join`、`/minecraft`、`/minecraft/join`、`/status`、`/updates`、`/mod-development`。

两种游戏共享详情和教程组件；首页保留双世界揭示交互；状态页保留两条独立测速线路。HTTPS 测速包含连接及 HTTP 开销，不等同于游戏内 Ping。最近备份展示已配置的计划时间，不是备份成功回执。

## 部署与监控

- [静态站部署与回滚](deploy/README.md)
- [监控安装、接口与测试](monitoring-backend/README.md)
- [贡献说明](CONTRIBUTING.md)
- [安全反馈](SECURITY.md)
- [素材与引用来源](ASSET_SOURCES.md)

Git 忽略规则不会阻止 `public/` 内的文件被打包。私人文档、旧导图与本地预览产物应放在被忽略的 `local-only/`、`outputs/` 等目录；不要直接分享整个开发工作区。发布脚本要求工作树已提交，便于将产物对应到确切版本。

## 许可证

本站自有代码使用 [GNU GPL v3.0](LICENSE)（`GPL-3.0-only`）。第三方游戏素材、Workshop 图标、截图内作品和引用内容的权利归各自权利人所有，详见 [素材说明](ASSET_SOURCES.md)。代码许可证不代表已获得所有素材的再授权。
