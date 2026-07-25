"""
Business Analytics Dashboard Backend
Serves aggregated analytics + filtered records over a static Excel dataset.
"""
from fastapi import FastAPI, APIRouter, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import io
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, date
import pandas as pd
import numpy as np

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ------------------------------------------------------------------
# Data loading (once at startup) -----------------------------------
# ------------------------------------------------------------------
DATA_PATH = ROOT_DIR / "data" / "data_dummy_3000.xlsx"

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def normalize_status(v):
    if pd.isna(v):
        return None
    s = str(v).strip()
    if s in ("-", ""):
        return None
    up = s.upper()
    if up == "DONE":
        return "DONE"
    if up in ("APPROVE (OK)", "APPROVE OK", "APPROVED"):
        return "Approve (OK)"
    if up == "REJECT":
        return "Reject"
    if up == "PENDING":
        return "Pending"
    if up == "SESUAI":
        return "Sesuai"
    return s


def load_data() -> pd.DataFrame:
    df = pd.read_excel(DATA_PATH, sheet_name=0)

    # Normalize status columns
    for col in ["Status Update S-Invest", "Status Update SABO", "Status Maker", "Status Checker"]:
        if col in df.columns:
            df[col] = df[col].map(normalize_status)

    # Ensure date columns are datetimes
    for col in ["Tanggal Action S-Invest", "Tanggal Action SABO",
                "Tanggal Proses S-Invest", "Tanggal Proses SABO3", "Tanggal Proses Maker"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")

    # Primary "final status" for KPIs
    df["FinalStatus"] = df["Status Checker"].fillna(df["Status Maker"])
    df["FinalStatus"] = df["FinalStatus"].fillna("Pending")

    # Primary date column
    df["Date"] = df["Tanggal Action S-Invest"].fillna(df["Tanggal Action SABO"])

    # Clean channel (split combined values like "BAREKSA, ROBO" → take first)
    df["ChannelClean"] = df["Channel"].astype(str).str.split(",").str[0].str.strip()

    logger.info(f"Loaded {len(df)} rows from {DATA_PATH}")
    return df


DF: pd.DataFrame = load_data()

# ------------------------------------------------------------------
# App & Router -----------------------------------------------------
# ------------------------------------------------------------------
app = FastAPI(title="Business Analytics Dashboard")
api = APIRouter(prefix="/api")


# ------------------------------------------------------------------
# Filtering helpers ------------------------------------------------
# ------------------------------------------------------------------
def apply_filters(
    df: pd.DataFrame,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    categories: Optional[List[str]] = None,
    pics: Optional[List[str]] = None,
    statuses: Optional[List[str]] = None,
    channels: Optional[List[str]] = None,
    search: Optional[str] = None,
) -> pd.DataFrame:
    d = df

    if start_date:
        try:
            sd = pd.to_datetime(start_date)
            d = d[d["Date"].notna() & (d["Date"] >= sd)]
        except Exception:
            pass
    if end_date:
        try:
            ed = pd.to_datetime(end_date) + pd.Timedelta(days=1)
            d = d[d["Date"].notna() & (d["Date"] < ed)]
        except Exception:
            pass
    if categories:
        d = d[d["Kategori Perubahan"].isin(categories)]
    if pics:
        d = d[d["PIC Maker"].isin(pics) | d["PIC Checker"].isin(pics)]
    if statuses:
        d = d[d["FinalStatus"].isin(statuses)]
    if channels:
        d = d[d["ChannelClean"].isin(channels)]
    if search:
        s = search.lower()
        d = d[
            d["SID"].astype(str).str.lower().str.contains(s, na=False)
            | d["Nama Lengkap"].astype(str).str.lower().str.contains(s, na=False)
            | d["Email"].astype(str).str.lower().str.contains(s, na=False)
        ]
    return d


def parse_multi(v: Optional[List[str]]):
    """FastAPI can send us list; also split comma-separated single item."""
    if not v:
        return None
    out = []
    for item in v:
        if item is None:
            continue
        out.extend([p.strip() for p in str(item).split(",") if p.strip()])
    return out or None


# ------------------------------------------------------------------
# Endpoints --------------------------------------------------------
# ------------------------------------------------------------------
@api.get("/")
def root():
    return {"message": "Business Analytics Dashboard API", "rows": int(len(DF))}


@api.get("/filters/options")
def filter_options():
    date_min = DF["Date"].min()
    date_max = DF["Date"].max()
    return {
        "categories": sorted([c for c in DF["Kategori Perubahan"].dropna().unique().tolist()]),
        "pics": sorted(list(set(DF["PIC Maker"].dropna().unique().tolist() +
                                DF["PIC Checker"].dropna().unique().tolist()))),
        "statuses": ["DONE", "Approve (OK)", "Sesuai", "Pending", "Reject"],
        "channels": sorted([c for c in DF["ChannelClean"].dropna().unique().tolist() if c and c != "nan"]),
        "date_min": date_min.strftime("%Y-%m-%d") if pd.notna(date_min) else None,
        "date_max": date_max.strftime("%Y-%m-%d") if pd.notna(date_max) else None,
    }


def _filter_query(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    categories: Optional[List[str]] = Query(None),
    pics: Optional[List[str]] = Query(None),
    statuses: Optional[List[str]] = Query(None),
    channels: Optional[List[str]] = Query(None),
    search: Optional[str] = Query(None),
):
    return dict(
        start_date=start_date, end_date=end_date,
        categories=parse_multi(categories), pics=parse_multi(pics),
        statuses=parse_multi(statuses), channels=parse_multi(channels),
        search=search,
    )


@api.get("/analytics/summary")
def analytics_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    categories: Optional[List[str]] = Query(None),
    pics: Optional[List[str]] = Query(None),
    statuses: Optional[List[str]] = Query(None),
    channels: Optional[List[str]] = Query(None),
    search: Optional[str] = None,
):
    d = apply_filters(DF, start_date, end_date,
                      parse_multi(categories), parse_multi(pics),
                      parse_multi(statuses), parse_multi(channels), search)
    total = int(len(d))
    completed_mask = d["FinalStatus"].isin(["DONE", "Approve (OK)", "Sesuai"])
    completed = int(completed_mask.sum())
    pending = int((d["FinalStatus"] == "Pending").sum())
    rejected = int((d["FinalStatus"] == "Reject").sum())
    completion_rate = round(completed / total * 100, 1) if total else 0.0
    reject_rate = round(rejected / total * 100, 1) if total else 0.0

    unique_customers = int(d["SID"].dropna().nunique())

    return {
        "total_records": total,
        "completed": completed,
        "pending": pending,
        "rejected": rejected,
        "completion_rate": completion_rate,
        "reject_rate": reject_rate,
        "unique_customers": unique_customers,
    }


@api.get("/analytics/timeseries")
def analytics_timeseries(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    categories: Optional[List[str]] = Query(None),
    pics: Optional[List[str]] = Query(None),
    statuses: Optional[List[str]] = Query(None),
    channels: Optional[List[str]] = Query(None),
    granularity: str = "day",
):
    d = apply_filters(DF, start_date, end_date,
                      parse_multi(categories), parse_multi(pics),
                      parse_multi(statuses), parse_multi(channels))
    d = d[d["Date"].notna()].copy()
    if granularity == "month":
        d["_bucket"] = d["Date"].dt.to_period("M").dt.to_timestamp()
    else:
        d["_bucket"] = d["Date"].dt.floor("D")

    grp = d.groupby("_bucket").agg(
        total=("SID", "count"),
        completed=("FinalStatus", lambda x: x.isin(["DONE", "Approve (OK)", "Sesuai"]).sum()),
        rejected=("FinalStatus", lambda x: (x == "Reject").sum()),
    ).reset_index()
    grp = grp.sort_values("_bucket")
    return [
        {
            "date": row["_bucket"].strftime("%Y-%m-%d"),
            "total": int(row["total"]),
            "completed": int(row["completed"]),
            "rejected": int(row["rejected"]),
        }
        for _, row in grp.iterrows()
    ]


@api.get("/analytics/status")
def analytics_status(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    categories: Optional[List[str]] = Query(None),
    pics: Optional[List[str]] = Query(None),
    channels: Optional[List[str]] = Query(None),
):
    d = apply_filters(DF, start_date, end_date,
                      parse_multi(categories), parse_multi(pics),
                      None, parse_multi(channels))
    vc = d["FinalStatus"].value_counts()
    return [{"status": k, "count": int(v)} for k, v in vc.items()]


@api.get("/analytics/categories")
def analytics_categories(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    pics: Optional[List[str]] = Query(None),
    statuses: Optional[List[str]] = Query(None),
    channels: Optional[List[str]] = Query(None),
):
    d = apply_filters(DF, start_date, end_date, None,
                      parse_multi(pics), parse_multi(statuses), parse_multi(channels))
    grp = d.groupby("Kategori Perubahan").agg(
        total=("SID", "count"),
        completed=("FinalStatus", lambda x: x.isin(["DONE", "Approve (OK)", "Sesuai"]).sum()),
        rejected=("FinalStatus", lambda x: (x == "Reject").sum()),
    ).reset_index().sort_values("total", ascending=False)
    return [
        {"category": r["Kategori Perubahan"], "total": int(r["total"]),
         "completed": int(r["completed"]), "rejected": int(r["rejected"])}
        for _, r in grp.iterrows()
    ]


@api.get("/analytics/pic")
def analytics_pic(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    categories: Optional[List[str]] = Query(None),
    statuses: Optional[List[str]] = Query(None),
    channels: Optional[List[str]] = Query(None),
):
    d = apply_filters(DF, start_date, end_date,
                      parse_multi(categories), None,
                      parse_multi(statuses), parse_multi(channels))
    maker = d["PIC Maker"].value_counts().to_dict()
    checker = d["PIC Checker"].value_counts().to_dict()
    all_pics = sorted(set(list(maker.keys()) + list(checker.keys())))
    return [
        {"pic": p, "maker": int(maker.get(p, 0)), "checker": int(checker.get(p, 0))}
        for p in all_pics
    ]


@api.get("/analytics/channels")
def analytics_channels(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    categories: Optional[List[str]] = Query(None),
    pics: Optional[List[str]] = Query(None),
    statuses: Optional[List[str]] = Query(None),
):
    d = apply_filters(DF, start_date, end_date,
                      parse_multi(categories), parse_multi(pics),
                      parse_multi(statuses), None)
    vc = d["ChannelClean"].value_counts()
    return [{"channel": k, "count": int(v)} for k, v in vc.items() if k and str(k) != "nan"]


@api.get("/analytics/insights")
def analytics_insights(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    categories: Optional[List[str]] = Query(None),
    pics: Optional[List[str]] = Query(None),
    channels: Optional[List[str]] = Query(None),
):
    d = apply_filters(DF, start_date, end_date,
                      parse_multi(categories), parse_multi(pics),
                      None, parse_multi(channels))
    notes = d["Note"].dropna()
    notes = notes[notes.astype(str).str.strip() != "-"]
    vc = notes.value_counts().head(10)
    return [{"note": str(k), "count": int(v)} for k, v in vc.items()]


@api.get("/records")
def get_records(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    categories: Optional[List[str]] = Query(None),
    pics: Optional[List[str]] = Query(None),
    statuses: Optional[List[str]] = Query(None),
    channels: Optional[List[str]] = Query(None),
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
):
    d = apply_filters(DF, start_date, end_date,
                      parse_multi(categories), parse_multi(pics),
                      parse_multi(statuses), parse_multi(channels), search)
    d = d.sort_values("Date", ascending=False, na_position="last")

    total = int(len(d))
    start = (page - 1) * page_size
    slice_ = d.iloc[start:start + page_size]

    cols = ["No.", "SID", "Nama Lengkap", "Email", "Kategori Perubahan",
            "PIC Maker", "PIC Checker", "ChannelClean", "FinalStatus", "Date", "Note"]
    rows = []
    for _, r in slice_.iterrows():
        rows.append({
            "no": int(r["No."]) if pd.notna(r["No."]) else None,
            "sid": str(r["SID"]) if pd.notna(r["SID"]) else "",
            "name": str(r["Nama Lengkap"]) if pd.notna(r["Nama Lengkap"]) else "",
            "email": str(r["Email"]) if pd.notna(r["Email"]) else "",
            "category": str(r["Kategori Perubahan"]) if pd.notna(r["Kategori Perubahan"]) else "",
            "maker": str(r["PIC Maker"]) if pd.notna(r["PIC Maker"]) else "",
            "checker": str(r["PIC Checker"]) if pd.notna(r["PIC Checker"]) else "",
            "channel": str(r["ChannelClean"]) if pd.notna(r["ChannelClean"]) else "",
            "status": str(r["FinalStatus"]) if pd.notna(r["FinalStatus"]) else "",
            "date": r["Date"].strftime("%Y-%m-%d") if pd.notna(r["Date"]) else "",
            "note": str(r["Note"]) if pd.notna(r["Note"]) else "",
        })
    return {"total": total, "page": page, "page_size": page_size, "rows": rows}


@api.get("/records/export")
def export_csv(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    categories: Optional[List[str]] = Query(None),
    pics: Optional[List[str]] = Query(None),
    statuses: Optional[List[str]] = Query(None),
    channels: Optional[List[str]] = Query(None),
    search: Optional[str] = None,
):
    d = apply_filters(DF, start_date, end_date,
                      parse_multi(categories), parse_multi(pics),
                      parse_multi(statuses), parse_multi(channels), search)
    out = d[["No.", "SID", "Nama Lengkap", "Email", "Kategori Perubahan",
             "PIC Maker", "PIC Checker", "ChannelClean", "FinalStatus", "Date", "Note"]].copy()
    out.columns = ["No", "SID", "Nama", "Email", "Kategori", "PIC Maker",
                   "PIC Checker", "Channel", "Status", "Tanggal", "Catatan"]
    buf = io.StringIO()
    out.to_csv(buf, index=False)
    buf.seek(0)
    filename = f"analytics-export-{datetime.now().strftime('%Y%m%d-%H%M%S')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
