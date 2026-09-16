import io
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]

@unittest.skipIf(os.name == "nt", "Linux deployment behavior is verified in Linux CI")
class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.site = self.root / "site"
        (self.site / "releases").mkdir(parents=True)
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.env = {**os.environ, "SITE_ROOT": str(self.site), "PATH": str(self.bin) + os.pathsep + os.environ["PATH"]}
        self.mock("nginx", "exit 0")
        self.mock("curl", 'printf \'%s\\n\' \'{"schemaVersion":1}\'')

    def tearDown(self):
        self.temp.cleanup()

    def mock(self, name, body):
        p = self.bin / name
        p.write_text("#!/bin/sh\n" + body + "\n")
        p.chmod(0o755)

    def release(self, name, failed=False):
        p = self.site / "releases" / name
        p.mkdir()
        (p / "index.html").write_text("test")
        if failed:
            (p / ".failed").touch()
        return p

    def current(self, release):
        (self.site / "current").symlink_to(release, target_is_directory=True)

    def run_script(self, script, *args):
        return subprocess.run(["sh", str(ROOT / "deploy" / script), *args], env=self.env, text=True, capture_output=True)

    def archive(self):
        archive = self.root / "release.tar.gz"
        with tarfile.open(archive, "w:gz") as bundle:
            entry = tarfile.TarInfo("index.html")
            entry.size = 4
            bundle.addfile(entry, io.BytesIO(b"test"))
        return str(archive)

    def test_rollback_ignores_newer_failed_release(self):
        previous = self.release("20260914-old")
        current = self.release("20260915-current")
        self.release("20260916-failed", failed=True)
        self.current(current)
        result = self.run_script("rollback-release.sh")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.site / "current").resolve(), previous)

    def test_failed_rollback_restores_original(self):
        previous = self.release("20260914-old")
        current = self.release("20260915-current")
        self.current(current)
        self.mock("curl", "exit 22")
        result = self.run_script("rollback-release.sh", previous.name)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual((self.site / "current").resolve(), current)

    def test_failed_activation_restores_and_marks_failure(self):
        current = self.release("20260915-current")
        self.current(current)
        self.mock("curl", "exit 22")
        result = self.run_script("activate-release.sh", self.archive(), "20260916-new")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual((self.site / "current").resolve(), current)
        self.assertTrue((self.site / "releases/20260916-new/.failed").exists())

    def test_success_records_exact_previous_release(self):
        current = self.release("20260915-current")
        self.current(current)
        result = self.run_script("activate-release.sh", self.archive(), "20260916-new")
        self.assertEqual(result.returncode, 0, result.stderr)
        new = self.site / "releases/20260916-new"
        self.assertEqual((self.site / "current").resolve(), new)
        self.assertEqual((new / ".previous-release").read_text().strip(), current.name)
        self.assertTrue((new / ".healthy").exists())

    def test_first_activation_failure_removes_current_link(self):
        self.mock("curl", "exit 22")
        result = self.run_script("activate-release.sh", self.archive(), "20260916-first")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.site / "current").is_symlink())

    def test_rejects_paths_and_existing_release_without_switch(self):
        current = self.release("20260915-current")
        self.current(current)
        for name in ("../escape", current.name):
            result = self.run_script("activate-release.sh", self.archive(), name)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual((self.site / "current").resolve(), current)

if __name__ == "__main__":
    unittest.main()
