"""Backend tests for iteration 2 of KYC Analytics Dashboard.

Covers:
- avg_sla_days in /api/analytics/summary
- granularity=day/week/month on /api/analytics/timeseries
- POST /api/import (happy path, rejection of .txt, rejection of missing columns)
- rows count reflected after import
"""
import io
import os

import pandas as pd
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


# ---- avg_sla_days -------------------------------------------------
def test_summary_has_avg_sla_days(sess):
    r = sess.get(f"{API}/analytics/summary", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "avg_sla_days" in data, f"missing avg_sla_days in {data.keys()}"
    val = data["avg_sla_days"]
    assert val is None or isinstance(val, (int, float))
    if val is not None:
        assert val >= 0
        # sanity: dummy data avg ~70+ days as per problem statement
        assert val < 1000


# ---- granularity --------------------------------------------------
def test_timeseries_day(sess):
    r = sess.get(f"{API}/analytics/timeseries", params={"granularity": "day"}, timeout=30)
    assert r.status_code == 200
    day_rows = r.json()
    assert isinstance(day_rows, list)
    assert len(day_rows) > 0
    # keys check
    for k in ("date", "total", "completed", "rejected"):
        assert k in day_rows[0]
    return day_rows


def test_timeseries_week_fewer_than_day(sess):
    day = sess.get(f"{API}/analytics/timeseries", params={"granularity": "day"}).json()
    week = sess.get(f"{API}/analytics/timeseries", params={"granularity": "week"}).json()
    assert isinstance(week, list) and len(week) > 0
    assert len(week) < len(day), f"week ({len(week)}) not < day ({len(day)})"
    # totals should still match
    assert sum(r["total"] for r in week) == sum(r["total"] for r in day)


def test_timeseries_month_fewer_than_week(sess):
    week = sess.get(f"{API}/analytics/timeseries", params={"granularity": "week"}).json()
    month = sess.get(f"{API}/analytics/timeseries", params={"granularity": "month"}).json()
    assert isinstance(month, list) and len(month) > 0
    assert len(month) <= len(week)
    assert sum(r["total"] for r in month) == sum(r["total"] for r in week)


# ---- import endpoint ---------------------------------------------
def _rows_now(sess):
    return sess.get(f"{API}/").json()["rows"]


def test_import_rejects_txt(sess):
    files = {"file": ("bad.txt", b"hello world", "text/plain")}
    r = sess.post(f"{API}/import", files=files, timeout=30)
    assert r.status_code == 400
    assert "xlsx" in r.text.lower() or "xls" in r.text.lower() or "csv" in r.text.lower()


def test_import_rejects_missing_columns(sess, tmp_path):
    df = pd.DataFrame({"foo": [1, 2], "bar": ["a", "b"]})
    p = tmp_path / "bad.xlsx"
    df.to_excel(p, index=False)
    with open(p, "rb") as f:
        r = sess.post(
            f"{API}/import",
            files={"file": ("bad.xlsx", f.read(),
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            timeout=30,
        )
    assert r.status_code == 400
    assert "missing" in r.text.lower() or "required" in r.text.lower()


def test_import_happy_path_replaces_dataset(sess):
    with open(DUMMY_XLSX, "rb") as f:
        content = f.read()
    r = sess.post(
        f"{API}/import",
        files={"file": ("data_dummy_3000.xlsx", content,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        timeout=60,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["ok"] is True
    assert data["rows"] == 3000
    # verify GET / rows now reflects
    assert _rows_now(sess) == 3000
