# LedgerApp Pre-Refactor Audit

This audit was written and committed before any schema or route changes. It records every hard delete found in the starter code.

## Hard deletes

| File and line | Table | Permanent loss |
|---|---|---|
| `routes/users.js:44` | `users` | Permanently removes the user's identity and account ownership record, preventing recovery and making a transaction-history audit harder to explain. |
| `routes/accounts.js:43` | `accounts` | Permanently removes the bank account container and its relationship to the user. The existing `ON DELETE CASCADE` relationship also makes dependent transaction history vulnerable. |
| `routes/transactions.js:43` | `transactions` | Permanently removes a financial credit/debit event, including amount, type, description, and timestamp, so it cannot be produced during an audit or dispute. |

## Schema risks

- `users`, `accounts`, and `transactions` have no `deleted_at` marker, so the API has no recoverable deletion state.
- The account and transaction foreign keys use `ON DELETE CASCADE`; a hard delete can erase dependent financial records as a side effect.
- Every list and detail query returns all rows, including any future soft-deleted rows unless active filtering is added deliberately.
- There is no admin/audit query for records that have been removed from normal application views.
- There are no partial indexes for the active-record path.

## Scope decision

All three audited tables receive `deleted_at TIMESTAMPTZ DEFAULT NULL` because all three contain user-owned or financial records with recovery and compliance value. This LedgerApp starter has no session-token, one-time-code, or temporary-cache table that should be hard-purged.
