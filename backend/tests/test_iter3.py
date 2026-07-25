"""Backend tests for iteration 3 additions:
- /api/analytics/comparison (wow/mom/invalid/filters)
- /api/import backup creation
- /api/import/backups listing
- /api/import/restore (valid, invalid, path traversal)
"""
import os
import time
import pytest
import requests


def _load_frontend_env():
    p = "/app/frontend/.env"
    if os.path.exists(p):
        for line in open(p):
            if line.startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip()
    return os.environ.get("REACT_APP_BACKEND_URL")


BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _load_frontend_env()).rstrip("/")
API = f"{BASE_URL}/api"
DUMMY_XLSX = "/app/backend/data/data_dummy_3000.xlsx"


@pytest.fixture(scope="module")
def sess():
    s = requests.Session()
    yield s


# ---- /api/analytics/comparison -----------------------------------
def test_comparison_wow_shape(sess):
    r = sess.get(f"{API}/analytics/comparison", params={"compare": "wow"}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["mode"] == "wow"
    for k in ("current_period", "previous_period", "current", "previous", "delta"):
        assert k in data, f"missing {k}"
    for pk in ("start", "end"):
        assert pk in data["current_period"]
        assert pk in data["previous_period"]
    # 7-day window
    from datetime import datetime
    cs = datetime.strptime(data["current_period"]["start"], "%Y-%m-%d")
    ce = datetime.strptime(data["current_period"]["end"], "%Y-%m-%d")
    assert (ce - cs).days == 6
    ps = datetime.strptime(data["previous_period"]["start"], "%Y-%m-%d")
    pe = datetime.strptime(data["previous_period"]["end"], "%Y-%m-%d")
    assert (pe - ps).days == 6
    # previous ends day before current start
    assert (cs - pe).days == 1
    # delta keys
    for dk in ("total_pct", "completion_rate_pp", "pending_pct", "rejected_pct",
               "reject_rate_pp", "sla_days"):
        assert dk in data["delta"], f"missing delta key {dk}"


def test_comparison_mom_30day(sess):
    r = sess.get(f"{API}/analytics/comparison", params={"compare": "mom"}, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data["mode"] == "mom"
    from datetime import datetime
    cs = datetime.strptime(data["current_period"]["start"], "%Y-%m-%d")
    ce = datetime.strptime(data["current_period"]["end"], "%Y-%m-%d")
    assert (ce - cs).days == 29


def test_comparison_invalid_400(sess):
    r = sess.get(f"{API}/analytics/comparison", params={"compare": "xxx"}, timeout=30)
    assert r.status_code == 400


def test_comparison_honors_filters(sess):
    unfiltered = sess.get(f"{API}/analytics/comparison", params={"compare": "wow"}).json()
    filtered = sess.get(
        f"{API}/analytics/comparison",
        params={"compare": "wow", "categories": "Update Rekening"},
    ).json()
    # filtered totals should be <= unfiltered totals
    assert filtered["current"]["total"] <= unfiltered["current"]["total"]
    assert filtered["previous"]["total"] <= unfiltered["previous"]["total"]


# ---- /api/import backup creation & listing -----------------------
def test_import_creates_backup_and_list(sess):
    r0 = sess.get(f"{API}/import/backups", timeout=30)
    assert r0.status_code == 200
    before = r0.json()["backups"]
    before_count = len(before)

    with open(DUMMY_XLSX, "rb") as f:
        content = f.read()
    r = sess.post(
        f"{API}/import",
        files={"file": ("data_dummy_3000.xlsx", content,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        timeout=60,
    )
    assert r.status_code == 200, r.text
    payload = r.json()
    assert payload["ok"] is True
    # backup meta present
    assert payload.get("backup") is not None
    assert "filename" in payload["backup"]
    assert payload["backup"]["filename"].startswith("data_")
    assert payload["backup"]["filename"].endswith(".xlsx")
    assert payload["backup"]["size"] > 0

    r2 = sess.get(f"{API}/import/backups", timeout=30)
    after = r2.json()["backups"]
    assert len(after) >= before_count + 1
    # sorted newest first
    filenames = [b["filename"] for b in after]
    assert filenames == sorted(filenames, reverse=True)
    # each entry has required keys
    for b in after:
        for k in ("filename", "size", "created"):
            assert k in b


# ---- /api/import/restore ----------------------------------------
def test_restore_valid(sess):
    # Ensure at least one backup exists (previous test creates one)
    backups = sess.get(f"{API}/import/backups").json()["backups"]
    assert len(backups) > 0, "no backups available for restore test"
    fname = backups[0]["filename"]
    r = sess.post(f"{API}/import/restore", json={"filename": fname}, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["ok"] is True
    assert data["restored_from"] == fname
    assert data["rows"] > 0


def test_restore_invalid_filename_404(sess):
    r = sess.post(
        f"{API}/import/restore",
        json={"filename": "data_99999999-999999.xlsx"},
        timeout=30,
    )
    assert r.status_code in (400, 404), r.text


def test_restore_path_traversal_400(sess):
    for bad in ("../server.py", "..\\server.py", "sub/data.xlsx"):
        r = sess.post(f"{API}/import/restore", json={"filename": bad}, timeout=30)
        assert r.status_code == 400, f"expected 400 for {bad}, got {r.status_code}"
