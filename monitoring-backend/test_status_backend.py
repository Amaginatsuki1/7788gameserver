from __future__ import annotations

import importlib.util
import sys
import tempfile
import time
import unittest
from pathlib import Path
from subprocess import CompletedProcess
from unittest.mock import patch


MODULE_PATH = Path(__file__).with_name("status_backend.py")
SPEC = importlib.util.spec_from_file_location("status_backend", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("Unable to load status_backend.py")

status_backend = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = status_backend
SPEC.loader.exec_module(status_backend)


def sample(**overrides: object) -> dict[str, object]:
    values: dict[str, object] = {
        "collected_at": int(time.time()),
        "source_ok": 1,
        "service_active": 1,
        "port_listening": 1,
        "status_fresh": 1,
        "players": 0,
        "restarts": 0,
        "host_cpu_percent": 10.0,
        "host_memory_percent": 20.0,
        "data_disk_percent": 30.0,
        "process_cpu_percent": 1.0,
        "process_memory_bytes": 1024,
        "process_memory_percent": 2.0,
        "network_rx_bytes_per_second": 100.0,
        "network_tx_bytes_per_second": 50.0,
        "game_latency_ms": 40.0,
    }
    values.update(overrides)
    return values


class PublicPayloadTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        database = Path(self.temporary_directory.name) / "status.sqlite3"
        self.store = status_backend.StatusStore(database)

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def test_player_snapshot_freshness_does_not_control_service_online(self) -> None:
        self.store.insert(sample(status_fresh=0, players=1))

        payload = status_backend.public_payload(self.store)

        self.assertTrue(payload["terraria"]["online"])
        self.assertIsNone(payload["terraria"]["players"])
        self.assertFalse(payload["stale"])

    def test_service_and_port_control_online_state(self) -> None:
        self.store.insert(sample(port_listening=0, status_fresh=1, players=0))

        payload = status_backend.public_payload(self.store)

        self.assertFalse(payload["terraria"]["online"])
        self.assertEqual(payload["terraria"]["players"], 0)

    def test_stale_collection_keeps_service_state_unknown(self) -> None:
        self.store.insert(
            sample(
                collected_at=int(time.time())
                - status_backend.STALE_AFTER_SECONDS
                - 1,
            )
        )

        payload = status_backend.public_payload(self.store)

        self.assertTrue(payload["stale"])
        self.assertIsNone(payload["terraria"]["online"])
        self.assertIsNone(payload["terraria"]["players"])


class CollectorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        database = Path(self.temporary_directory.name) / "status.sqlite3"
        self.store = status_backend.StatusStore(database)
        self.collector = status_backend.Collector(
            store=self.store,
            ssh_config=Path("/tmp/ssh-config"),
            ssh_alias="game-status",
            game_probe_url=status_backend.DEFAULT_GAME_PROBE_URL,
            interval=30,
        )

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def test_collection_reads_status_before_running_network_probe(self) -> None:
        events: list[str] = []

        def run_ssh(*_args: object, **_kwargs: object) -> CompletedProcess[str]:
            events.append("status")
            return CompletedProcess([], 0, stdout="{}", stderr="")

        def measure_probe() -> float:
            events.append("probe")
            return 42.0

        normalized = sample(collected_at=int(time.time()))
        with (
            patch.object(status_backend.subprocess, "run", side_effect=run_ssh),
            patch.object(
                self.collector,
                "measure_game_latency",
                side_effect=measure_probe,
            ),
            patch.object(self.collector, "normalize", return_value=normalized),
        ):
            self.collector.collect_once()

        self.assertEqual(events, ["status", "probe"])

    def test_latency_uses_https_probe_instead_of_game_port(self) -> None:
        class Response:
            status = 200

            def __enter__(self) -> "Response":
                return self

            def __exit__(self, *_args: object) -> None:
                return None

            def read(self, _limit: int) -> bytes:
                return b"ok"

        with patch.object(status_backend, "urlopen", return_value=Response()) as open_url:
            latency = self.collector.measure_game_latency()

        request = open_url.call_args.args[0]
        self.assertEqual(request.full_url, status_backend.DEFAULT_GAME_PROBE_URL)
        self.assertNotIn(":18035", request.full_url)
        self.assertIsNotNone(latency)


if __name__ == "__main__":
    unittest.main()
