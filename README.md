# LedgerApp — Soft Deletion Strategies

LedgerApp is a financial record API refactored from permanent hard deletes to recoverable soft deletion. The pre-refactor hard-delete inventory was committed in `AUDIT.md` before the implementation changes.

## Live Deployment

Live preview: https://3000-ips6j5fdth1e1ikgtkorw-f16c4bec.sg2.manus.computer/

## Implementation

- Added `deleted_at TIMESTAMPTZ DEFAULT NULL` to users, accounts, and transactions.
- Replaced all three hard-delete routes with `UPDATE ... SET deleted_at = NOW()`.
- Added active filters to normal list, detail, and relationship queries.
- Added `/users/audit/deleted`, `/accounts/audit/deleted`, and `/transactions/audit/deleted` routes for retained evidence.
- Added restore routes for each entity.
- Changed foreign keys to `ON DELETE RESTRICT` so an accidental physical delete cannot cascade through financial history.
- Added partial active indexes for user, account, and transaction paths.
- Documented storage estimates, performance implications, compliance use, and hard-delete exceptions in `TRADEOFFS.md`.

## Verification

```bash
npm install
npm run check
npm test
```

The smoke test proves that deleted records disappear from normal responses, remain available through audit routes, and can be restored. The live health response is available at `/` and reports `deletionPolicy: soft-delete`.
