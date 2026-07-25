# Business Analytics Dashboard — PRD

## Problem Statement
"buat dashboard business analytics menggunakan data dummy, sudah disiapkan" — Build a business analytics dashboard on top of the provided dummy dataset (`data_dummy_3000.xlsx`, 3,000 rows) for an Indonesian financial institution's KYC / customer profile update workflow.

## User Choices
- Metrics: Sales/revenue proxy + all relevant metrics + customer analytics on the given data
- Features: Read-only dashboard, interactive filters, CSV export
- Theme: **Dark mode** (Swiss / high-contrast, Zinc scale)
- Auth: None — public direct link

## User Personas
- **Ops Manager**: Watches completion & reject rates, PIC workload, and daily throughput to spot bottlenecks.
- **Compliance Analyst**: Investigates rejects, drills into notes ("BELUM UPDATE REKENING", "DATA NASABAH NOT FOUND DI SABO 3") to reconcile SABO / S-Invest systems.
- **Team Lead**: Uses PIC Maker/Checker workload to rebalance queues and export filtered slices to CSV.

## Core Requirements (Static)
- Load 3,000-row Excel dataset at backend startup, keep in memory as a pandas DataFrame.
- 8 backend endpoints under `/api` for aggregations + records + CSV export.
- All aggregations must honor a common set of filters: date range, categories (Kategori Perubahan), PICs (Maker/Checker), statuses (FinalStatus), channels, and free-text search.
- Frontend: single dark-mode dashboard with KPIs, area chart, donut, category bar, PIC stacked bar, channel bar, insights panel, and paginated records table.

## Architecture
- **Backend**: FastAPI + pandas. Data loaded once at startup from `/app/backend/data/data_dummy_3000.xlsx`. Status values normalized (`DONE`/`done` collapsed). `FinalStatus` derived from `Status Checker` with `Status Maker` fallback.
- **Frontend**: React 19 + Recharts + Shadcn UI + Tailwind. Manrope (headings) + IBM Plex Sans (body) + IBM Plex Mono (numbers). Zinc + accent colors (blue/emerald/amber/rose/purple).
- **Ingress**: `/api` → 8001; all frontend calls via `REACT_APP_BACKEND_URL`.

## What's Been Implemented (2026-02-XX)
- Backend endpoints (all filtered):
  - `GET /api/filters/options` — filter values + date range
  - `GET /api/analytics/summary` — 7 KPI scalars
  - `GET /api/analytics/timeseries` — day/month buckets
  - `GET /api/analytics/status` — donut data
  - `GET /api/analytics/categories` — category bar
  - `GET /api/analytics/pic` — Maker vs Checker per PIC
  - `GET /api/analytics/channels` — channel bar
  - `GET /api/analytics/insights` — top notes (compliance)
  - `GET /api/records` — paginated table with search
  - `GET /api/records/export` — CSV streaming download
- Frontend dashboard:
  - Sticky header with Refresh + Export CSV
  - Filter bar: date-range calendar (Shadcn), 4 multi-select dropdowns, active-count badge + reset
  - 4 KPI cards (Total, Completion %, Pending, Reject %)
  - Time-series area chart (Total vs Completed)
  - Status donut with legend + percentages
  - Change Categories horizontal bar chart
  - Channel mix bar chart
  - PIC Workload stacked bar chart (Maker vs Checker)
  - Insights panel highlighting critical reject reasons in rose
  - Records table with search, status pills, pagination

## Verified (testing_agent_v3 iter 1)
- 100% backend endpoint pass — correct shapes, counts, filters, CSV export
- 100% frontend pass — KPIs render correct values (3,000 / 58.9% / 631 / 20.1%), filters reduce total interactively, pagination works, 0 console errors

## Backlog / Next Actions
- **P1**: Save-view / shareable-URL filters (encode filters in query string)
- **P1**: Drill-down modal on chart click (e.g. click a category → open filtered table)
- **P2**: Monthly / weekly granularity toggle on time-series
- **P2**: SLA / turnaround-time metric (Tanggal Action → Tanggal Proses gap)
- **P2**: PDF export in addition to CSV
- **P2**: Server-side data source swap (allow uploading a new Excel)
