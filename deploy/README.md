# 静态发布与回滚

这里的 Nginx、路径、域名和服务约定服务于 7788 的专用 Linux/aaPanel 主机，不是通用系统安装器。复用前替换域名、证书路径和部署目录，并确认不会影响该主机上的其他站点。

## 静态站

`npm ci` 后运行测试及 `npm run build:static`，将 `out/` 用作站点根目录。Nginx 需要将无后缀路由映射到对应 `.html`，并把精确 `/api/status` 转给仅监听本机的监控服务。生产不使用 `vinext start`。

发布入口（PowerShell）：

```powershell
.\scripts\deploy-production.ps1 -HostName <网站主机>
.\scripts\rollback-production.ps1 -HostName <网站主机>
.\scripts\rollback-production.ps1 -HostName <网站主机> -ReleaseName <保留版本目录名>
```

SSH 密钥与 known_hosts 位于用户目录 `.ssh/` 下；也可用 `-IdentityFile`、`-KnownHostsFile` 显式指定。严格主机密钥验证始终开启。实际凭据与管理地址不应提交。

发布脚本要求已提交的工作树，运行网站测试与静态构建，再上传并调用 `activate-release.sh`。切换后检查八条网页路由及状态 API；失败恢复原链接并标记失败版本。首次部署没有旧版本时，失败会移除新链接。

成功版本记录 `.healthy` 和 `.previous-release`。回滚优先使用记载的前一版本；对于尚无记录的旧版本，仅从当前版本之前的目录选择，跳过失败目录。回滚检查失败时恢复操作前的版本。Nginx 拒绝访问这些点文件。

清理保留最新五个目录，并额外保护当前版本与直接回滚版本，因此必要时可能超过五个。发布到不提供监控 API 的独立副本前，应调整健康检查策略。

## 初始主机配置

`configure-server.sh` 会更改 SSH、防火墙、aaPanel Nginx，并停用 MySQL、PHP 和 FTP。默认拒绝执行；只有确认是专用主机并审核脚本后才能传入 `--dedicated-aapanel-host`。它不参与日常发布。

## 测试

`python -m unittest discover -s tests -p 'test_deploy_scripts.py'` 在 Linux 临时目录中使用模拟 Nginx/curl 测试发布与回滚，不连接生产主机。Windows 仍可运行 PowerShell 解析检查与 Git Bash 的 shell 语法检查；行为测试由 Linux CI 执行。
