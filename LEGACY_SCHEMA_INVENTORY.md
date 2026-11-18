# Legacy SQL Server Schema Inventory — P0

**Status:** BLOCKED — source backup unavailable in this session; nothing below is a verified source schema.
**Source identifier from existing project documents:** `DBSmilePOS`
**Backup filename from project documents:** `POS Backup [09092026170831].bak`
**Security:** Record only sanitized metadata here. Never commit source .bak, PII, credentials, or raw production records.

## Custody and environment checklist
- [ ] Obtain original backup privately, outside public Git repository.
- [ ] Record SHA-256, byte size, authorized custodian, and acquisition timestamp in secured internal record (publish hash only if approved).
- [ ] Identify isolated SQL Server host/version, storage, access controls, and disposal process.
- [ ] Run RESTORE HEADERONLY, FILELISTONLY and VERIFYONLY; retain redacted console evidence.
- [ ] Check backup set type/chain, compatibility, TDE/certificates, logical files and space requirements.
- [ ] Restore under a unique new database name and safe file paths; NEVER WITH REPLACE.
- [ ] Record DB compatibility, schemas, tables, columns, PK/FK, indexes, constraints, triggers, views and row counts.
- [ ] Inspect product, unit, barcode, price, party, sales/purchase, tax, inventory and accounting semantics.
- [ ] Flag inferred relations separately from actual foreign key constraints.

## Verification commands (SQL Server; execute only on isolated instance)
```sql
RESTORE HEADERONLY FROM DISK = N'<private-backup-path>';
RESTORE FILELISTONLY FROM DISK = N'<private-backup-path>';
RESTORE VERIFYONLY FROM DISK = N'<private-backup-path>';
```
Replace placeholder only in authorized isolated environment. These commands are inspection/backup checks, NOT a completed restore or evidence that the backup is healthy.

## Actual inventory (populate only after verified restore)
| Source schema | Table/view | PK | FK relationships | Rows | Business meaning | Evidence | Confidence |
|---|---|---|---|---|---|---|---|
| NOT INSPECTED | NOT INSPECTED | — | — | — | — | None | unverified |

## Open blockers
1. Binary backup not present in current session.
2. SQL Server restore/version/TDE requirements not established.
3. Source keys, columns, constraints, row counts, financial/stock semantics unknown.

## Acceptance boundary
Do not approve a destination schema or claim migration readiness until source inventory, mappings and reconciliation are independently evidenced.


## 2026-11-18 — user-provided local SQLCMD evidence (not independently reproduced)
- SQL Server: Microsoft SQL Server 2025 Express, 17.0.1155.3, instance `SQLEXPRESS`; client connection succeeded with `sqlcmd -E -C`.
- Existing databases: `DBSmilePOS` created 2026-09-11 (31 user tables), `DBSmilePOS_LAB` created 2026-09-13 (41 user tables), both ONLINE and accessible; compatibility level 100.
- Both use a 264.75 MiB allocated ROWS file and a 1.00 MiB allocated LOG file. Allocated file sizes do not establish data equality.
- Reported backup: 261116416 bytes (~249.02 MiB), SHA-256 `2E2C063B56B308FB2C63333BFB13CC592FA425F7EABB053FA5519D822DCD3575` (reported by user's Get-FileHash; no independent verification).
- `RESTORE HEADERONLY` was attempted and returned OS error 5 (access denied) for backup in OneDrive user profile. Backup identity, integrity, restore success and relationship to either existing database remain **unverified**.
- All 31 tables in `DBSmilePOS` appear in `DBSmilePOS_LAB`. LAB-only tables by user-provided names: AppAuditEvent, AppMasterCounter, AppPermission, AppPostingRequest, AppReturnLink, AppRole, AppRolePermission, AppUser, AppUserRole, AppVoucherCounter. Names alone do not establish actual behavior.
- Next: read-only compare source/LAB per-table approximate row counts, columns and PK/FK metadata; then obtain a restricted inspection copy for HEADERONLY/FILELISTONLY/VERIFYONLY. Never modify existing databases; do not claim backup was restored from these facts.
