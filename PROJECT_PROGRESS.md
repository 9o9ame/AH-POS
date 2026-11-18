# AH-POS — Verified Progress

**As of:** 2026-11-18  
**Web baseline acceptance:** **0% / 100%**  
**Mobile acceptance:** **0%** (separate roadmap, deferred)  
**Current milestone:** P0 — Restore and inspect legacy database  
**Source of truth:** `PROJECT_MILESTONES.csv` and linked evidence in this file.

| Phase | Scope | Weight | Accepted fraction | Counted web contribution |
|---|---|---:|---:|---:|
| P0 | Legacy restore, inspect, mapping | 12% | 0 | 0% |
| P1 | Architecture, tenancy, security, CI | 13% | 0 | 0% |
| P2 | Brand, UI design, application shell | 8% | 0 | 0% |
| P3 | Master data and import engine | 14% | 0 | 0% |
| P4 | Purchase, inventory, accounting | 14% | 0 | 0% |
| P5 | Online sales, returns, receipts | 15% | 0 | 0% |
| P6 | Offline web sales and sync | 10% | 0 | 0% |
| P7 | Reports, administration, operations | 8% | 0 | 0% |
| P8 | AI copilot MVP | 6% | 0 | 0% |
| **Total** | **Web** | **100%** | | **0%** |

**Calculation:** sum of phase weight × independently accepted task fraction. `implemented_unverified` is **not accepted**. Any change to weights/scope needs an approved versioned baseline.

**Mobile trigger:** start planning/implementation of native companion after 70–80% evidence-based **accepted web** completion and stable tenancy, sales and sync API contracts.

## Evidence log
- 2026-11-18: Planning baseline and repo handoff created. No implementation acceptance evidence. Contribution remains 0%.

## Next gate
P0 success requires actual successful isolated restore or independently verifiable source schema export, a sanitized source inventory, key/relationship map, legacy-to-target mapping, and signed financial/stock reconciliation strategy. Until then, do not assert that data can be dumped straight into a tenant.
