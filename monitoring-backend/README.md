# 匿名监控后端

Python 3.10+，仅使用标准库。SQLite 保存七天样本，对外返回过去 24 小时历史；默认每 30 秒通过受限 SSH 采集，120 秒无有效数据则未知。

## 安装前提

本仓库不包含游戏主机上的 privileged exporter、游戏存档、模组配置或凭据。必须在游戏主机另行部署一个只读、输出下述 JSON 的采集命令，并通过来源限制、forced-command 和禁止端口转发的专用 SSH key 访问。不要给采集账号交互 shell 或无限制管理权限。

`game-status-ssh-config` 是示例，包含保留域名。复制到仓库外，填写自己的主机、端口、专用账号、密钥及严格验证的 known_hosts；不要覆盖生产配置为示例值。

```sh
python status_backend.py --database /var/lib/7788-monitor/status.sqlite3 \
  --ssh-config /var/lib/7788-monitor/ssh/config --ssh-alias game-status \
  --game-probe-url https://game.example.com/ping --listen 127.0.0.1 --port 8787
```

生产可参考 `7788-status-backend.service`：独立用户、私有文件权限、仅本机监听，再通过 Nginx 精确代理 `/api/status`。首次安装应为数据库和 SSH 目录设置仅服务账号可读写的权限。

## 游戏主机输入契约

以下是字段结构示例，不是真实监控数据。`service.active=false` 时进程 CPU/内存可为 null。`game.statusFresh` 表示匿名人数快照是否有效，不能决定服务器在线状态。

```json
{
  "service": {"active": true, "restarts": 0},
  "process": {"cpuUsageNSec": 1000000000, "memoryBytes": 1048576},
  "port": {"listening": true},
  "host": {
    "logicalCpu": 4, "cpuTotalJiffies": 1000, "cpuIdleJiffies": 800,
    "memoryTotalBytes": 8589934592, "memoryAvailableBytes": 6442450944,
    "dataDiskTotalBytes": 107374182400, "dataDiskUsedBytes": 21474836480,
    "networkRxBytes": 1000, "networkTxBytes": 500
  },
  "game": {"players": 0, "statusFresh": true}
}
```

只输出这些匿名数值与布尔字段，不携带玩家名、主机身份、路径或日志。在线状态由服务 active 与监听端口共同决定；人数过期单独返回 null。最新采集失败不会回放上一条在线结果。

## 公开 API 与兼容

`GET /api/status` 返回 `schemaVersion: 1`、no-store，字段由后端明确选取。游戏公开名称、版本和地址在 `public_payload` 中配置，复用时须改成自己的值。`generatedAt` 是响应生成时间，`collector.lastSuccessAt` 才是最后有效采样时间。

历史保留旧 `cpu`/`memory` 均值数组；新增 `windowStart`/`windowEnd`（Unix 秒）、`bucketSeconds`、`cpuSeries`/`memorySeries`（`{at,value}`，null 表示缺口）和 `cpuSummary`/`memorySummary`（原始有效样本的平均值及最大值）。前端兼容旧后端：仍显示原有采样，但明确时间轴不可用且不冒充真实峰值。升级不要求前后端同时切换。

`python -m unittest discover -s monitoring-backend -p 'test_*.py'` 从项目根目录运行测试。更新已安装后端可参考 `deploy/update-status-backend.sh`，事先确认目标主机与回滚备份；网站源码推送不会自动更新监控服务。
