#!/usr/bin/env python3
"""Read-only public status collector for the 7788 game server."""

from __future__ import annotations

import argparse
import json
import math
import signal
import sqlite3
import subprocess
import threading
import time
from contextlib import closing
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


SCHEMA_VERSION = 1
STALE_AFTER_SECONDS = 120
HISTORY_SECONDS = 24 * 60 * 60
RETENTION_SECONDS = 7 * 24 * 60 * 60
DEFAULT_GAME_PROBE_URL = "https://tr.7788oio.icu:28443/ping"


def utc_iso(timestamp: float | int) -> str:
    return (
        datetime.fromtimestamp(timestamp, timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z")
    )


def percentage(numerator: float, denominator: float) -> float | None:
    if denominator <= 0:
        return None
    return max(0.0, min(100.0, numerator / denominator * 100.0))


def rounded(value: float | int | None, digits: int = 1) -> float | None:
    if value is None or not math.isfinite(float(value)):
        return None
    return round(float(value), digits)


class StatusStore:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=5)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with closing(self.connect()) as connection:
            connection.execute("PRAGMA journal_mode=WAL")
            connection.execute("PRAGMA synchronous=NORMAL")
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS samples (
                    collected_at INTEGER PRIMARY KEY,
                    source_ok INTEGER NOT NULL,
                    service_active INTEGER,
                    port_listening INTEGER,
                    status_fresh INTEGER,
                    players INTEGER,
                    restarts INTEGER,
                    host_cpu_percent REAL,
                    host_memory_percent REAL,
                    data_disk_percent REAL,
                    process_cpu_percent REAL,
                    process_memory_bytes INTEGER,
                    process_memory_percent REAL,
                    network_rx_bytes_per_second REAL,
                    network_tx_bytes_per_second REAL,
                    game_latency_ms REAL
                )
                """
            )
            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS samples_success_time_idx
                ON samples(source_ok, collected_at)
                """
            )
            connection.commit()

    def insert(self, sample: dict[str, Any]) -> None:
        columns = (
            "collected_at",
            "source_ok",
            "service_active",
            "port_listening",
            "status_fresh",
            "players",
            "restarts",
            "host_cpu_percent",
            "host_memory_percent",
            "data_disk_percent",
            "process_cpu_percent",
            "process_memory_bytes",
            "process_memory_percent",
            "network_rx_bytes_per_second",
            "network_tx_bytes_per_second",
            "game_latency_ms",
        )
        placeholders = ", ".join("?" for _ in columns)
        with closing(self.connect()) as connection:
            connection.execute(
                f"INSERT OR REPLACE INTO samples ({', '.join(columns)}) "
                f"VALUES ({placeholders})",
                tuple(sample.get(column) for column in columns),
            )
            connection.execute(
                "DELETE FROM samples WHERE collected_at < ?",
                (int(time.time()) - RETENTION_SECONDS,),
            )
            connection.commit()

    def latest(self, successful_only: bool = False) -> sqlite3.Row | None:
        where = "WHERE source_ok = 1" if successful_only else ""
        with closing(self.connect()) as connection:
            return connection.execute(
                f"SELECT * FROM samples {where} ORDER BY collected_at DESC LIMIT 1"
            ).fetchone()

    def history(self) -> dict[str, list[float]]:
        cutoff = int(time.time()) - HISTORY_SECONDS
        with closing(self.connect()) as connection:
            rows = connection.execute(
                """
                SELECT
                    (collected_at / 900) AS bucket,
                    AVG(host_cpu_percent) AS cpu,
                    AVG(host_memory_percent) AS memory
                FROM samples
                WHERE source_ok = 1
                  AND collected_at >= ?
                GROUP BY bucket
                ORDER BY bucket
                """,
                (cutoff,),
            ).fetchall()

        cpu = [round(float(row["cpu"]), 1) for row in rows if row["cpu"] is not None]
        memory = [
            round(float(row["memory"]), 1)
            for row in rows
            if row["memory"] is not None
        ]
        return {"cpu": cpu, "memory": memory}


class Collector:
    def __init__(
        self,
        store: StatusStore,
        ssh_config: Path,
        ssh_alias: str,
        game_probe_url: str,
        interval: int,
    ) -> None:
        self.store = store
        self.ssh_config = ssh_config
        self.ssh_alias = ssh_alias
        self.game_probe_url = game_probe_url
        self.interval = interval
        self.stop_event = threading.Event()
        self.previous: dict[str, float] | None = None

    def run(self) -> None:
        while not self.stop_event.is_set():
            started = time.monotonic()
            self.collect_once()
            elapsed = time.monotonic() - started
            self.stop_event.wait(max(1.0, self.interval - elapsed))

    def collect_once(self) -> None:
        now = int(time.time())
        try:
            completed = subprocess.run(
                [
                    "/usr/bin/ssh",
                    "-F",
                    str(self.ssh_config),
                    self.ssh_alias,
                ],
                check=True,
                capture_output=True,
                text=True,
                timeout=12,
            )
            source = json.loads(completed.stdout)
            game_latency_ms = self.measure_game_latency()
            sample = self.normalize(source, now, game_latency_ms)
        except Exception as exception:
            self.previous = None
            sample = {
                "collected_at": now,
                "source_ok": 0,
                "game_latency_ms": None,
            }
            print(
                f"{utc_iso(now)} collection unavailable: "
                f"{type(exception).__name__}",
                flush=True,
            )

        self.store.insert(sample)

    def measure_game_latency(self) -> float | None:
        started = time.monotonic()
        try:
            request = Request(
                self.game_probe_url,
                headers={"User-Agent": "7788-status-monitor/1"},
                method="GET",
            )
            with urlopen(request, timeout=4) as response:
                body = response.read(16).strip()
                if response.status != 200 or body != b"ok":
                    return None
            return rounded((time.monotonic() - started) * 1000.0)
        except Exception:
            return None

    def normalize(
        self,
        source: dict[str, Any],
        now: int,
        game_latency_ms: float | None,
    ) -> dict[str, Any]:
        service = source["service"]
        process = source["process"]
        port = source["port"]
        host = source["host"]
        game = source["game"]

        logical_cpu = max(1, int(host["logicalCpu"]))
        cpu_total = int(host["cpuTotalJiffies"])
        cpu_idle = int(host["cpuIdleJiffies"])
        process_cpu_ns = int(process["cpuUsageNSec"])
        memory_total = int(host["memoryTotalBytes"])
        memory_available = int(host["memoryAvailableBytes"])
        disk_total = int(host["dataDiskTotalBytes"])
        disk_used = int(host["dataDiskUsedBytes"])
        network_rx = int(host["networkRxBytes"])
        network_tx = int(host["networkTxBytes"])
        process_memory = int(process["memoryBytes"])

        host_cpu_percent = None
        process_cpu_percent = None
        network_rx_rate = None
        network_tx_rate = None
        monotonic_now = time.monotonic()

        if self.previous is not None:
            total_delta = cpu_total - int(self.previous["cpu_total"])
            idle_delta = cpu_idle - int(self.previous["cpu_idle"])
            elapsed = monotonic_now - self.previous["monotonic"]
            process_delta = process_cpu_ns - int(self.previous["process_cpu_ns"])
            rx_delta = network_rx - int(self.previous["network_rx"])
            tx_delta = network_tx - int(self.previous["network_tx"])

            if total_delta > 0 and 0 <= idle_delta <= total_delta:
                host_cpu_percent = percentage(total_delta - idle_delta, total_delta)
            if elapsed > 0 and process_delta >= 0:
                process_cpu_percent = percentage(
                    process_delta,
                    elapsed * 1_000_000_000 * logical_cpu,
                )
            if elapsed > 0 and rx_delta >= 0:
                network_rx_rate = rx_delta / elapsed
            if elapsed > 0 and tx_delta >= 0:
                network_tx_rate = tx_delta / elapsed

        self.previous = {
            "cpu_total": cpu_total,
            "cpu_idle": cpu_idle,
            "process_cpu_ns": process_cpu_ns,
            "network_rx": network_rx,
            "network_tx": network_tx,
            "monotonic": monotonic_now,
        }

        players = game.get("players")
        if not isinstance(players, int) or not 0 <= players <= 255:
            players = None

        return {
            "collected_at": now,
            "source_ok": 1,
            "service_active": int(bool(service["active"])),
            "port_listening": int(bool(port["listening"])),
            "status_fresh": int(bool(game["statusFresh"])),
            "players": players,
            "restarts": max(0, int(service["restarts"])),
            "host_cpu_percent": rounded(host_cpu_percent),
            "host_memory_percent": rounded(
                percentage(memory_total - memory_available, memory_total)
            ),
            "data_disk_percent": rounded(percentage(disk_used, disk_total)),
            "process_cpu_percent": rounded(process_cpu_percent),
            "process_memory_bytes": max(0, process_memory),
            "process_memory_percent": rounded(
                percentage(process_memory, memory_total)
            ),
            "network_rx_bytes_per_second": rounded(network_rx_rate),
            "network_tx_bytes_per_second": rounded(network_tx_rate),
            "game_latency_ms": game_latency_ms,
        }


def public_payload(store: StatusStore) -> dict[str, Any]:
    now = int(time.time())
    latest = store.latest()
    successful = store.latest(successful_only=True)
    history = store.history()

    last_success_at = int(successful["collected_at"]) if successful else None
    stale = last_success_at is None or now - last_success_at > STALE_AFTER_SECONDS
    collector_ok = bool(latest and latest["source_ok"] and not stale)
    available = bool(successful and not stale)

    online: bool | None = None
    if available:
        online = bool(
            successful["service_active"]
            and successful["port_listening"]
        )

    players_available = bool(
        available
        and successful["status_fresh"]
        and successful["players"] is not None
    )

    def metric(name: str) -> float | None:
        if not available or successful[name] is None:
            return None
        return rounded(successful[name])

    return {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": utc_iso(now),
        "stale": stale,
        "collector": {
            "ok": collector_ok,
            "lastSuccessAt": utc_iso(last_success_at) if last_success_at else None,
            "intervalSeconds": 30,
        },
        "terraria": {
            "deployed": True,
            "online": online,
            "players": int(successful["players"])
            if players_available
            else None,
            "maxPlayers": 5,
            "address": "tr.7788oio.icu:18035",
            "version": "tModLoader v2026.05.3.0",
            "world": "oio的冒险",
            "worldType": "大世界 · 大师 · 猩红",
            "modCount": 29,
            "restarts": int(successful["restarts"]) if available else None,
            "gameLatencyMs": metric("game_latency_ms"),
            "process": {
                "cpuPercent": metric("process_cpu_percent"),
                "memoryBytes": int(successful["process_memory_bytes"])
                if available and successful["process_memory_bytes"] is not None
                else None,
                "memoryPercent": metric("process_memory_percent"),
            },
        },
        "minecraft": {
            "deployed": False,
            "online": None,
            "players": None,
            "maxPlayers": 5,
            "address": "mc.7788oio.icu",
        },
        "host": {
            "cpuPercent": metric("host_cpu_percent"),
            "memoryPercent": metric("host_memory_percent"),
            "dataDiskPercent": metric("data_disk_percent"),
            "networkRxBytesPerSecond": metric("network_rx_bytes_per_second"),
            "networkTxBytesPerSecond": metric("network_tx_bytes_per_second"),
        },
        "history": {
            "periodHours": 24,
            "cpu": history["cpu"],
            "memory": history["memory"],
        },
    }


class StatusHandler(BaseHTTPRequestHandler):
    store: StatusStore

    def do_HEAD(self) -> None:
        self.respond(include_body=False)

    def do_GET(self) -> None:
        self.respond(include_body=True)

    def respond(self, include_body: bool) -> None:
        if urlsplit(self.path).path != "/api/status":
            self.send_error(404)
            return

        body = json.dumps(
            public_payload(self.store),
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        if include_body:
            self.wfile.write(body)

    def log_message(self, format: str, *args: Any) -> None:
        return


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--database",
        type=Path,
        default=Path("/var/lib/7788-monitor/status.sqlite3"),
    )
    parser.add_argument(
        "--ssh-config",
        type=Path,
        default=Path("/var/lib/7788-monitor/ssh/config"),
    )
    parser.add_argument("--ssh-alias", default="game-status")
    parser.add_argument(
        "--game-probe-url",
        default=DEFAULT_GAME_PROBE_URL,
    )
    parser.add_argument("--interval", type=int, default=30)
    parser.add_argument("--listen", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8787)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    store = StatusStore(args.database)
    collector = Collector(
        store=store,
        ssh_config=args.ssh_config,
        ssh_alias=args.ssh_alias,
        game_probe_url=args.game_probe_url,
        interval=max(10, args.interval),
    )
    StatusHandler.store = store

    collector_thread = threading.Thread(
        target=collector.run,
        name="status-collector",
        daemon=True,
    )
    collector_thread.start()

    server = ThreadingHTTPServer((args.listen, args.port), StatusHandler)

    def stop_server(_signum: int, _frame: Any) -> None:
        collector.stop_event.set()
        threading.Thread(target=server.shutdown, daemon=True).start()

    signal.signal(signal.SIGTERM, stop_server)
    signal.signal(signal.SIGINT, stop_server)
    server.serve_forever(poll_interval=0.5)
    server.server_close()
    collector_thread.join(timeout=5)


if __name__ == "__main__":
    main()
