# LedgerApp Soft-Deletion Trade-offs

## When soft delete is the right call

1. **Financial transaction history.** A deleted credit or debit may be needed for a dispute, tax review, fraud investigation, or regulatory audit. Retaining the row with `deleted_at` preserves amount, type, description, and creation time without exposing it in normal application lists.
2. **User and account recovery.** An accidental account deletion should be reversible during a support window. Restoring `deleted_at = NULL` is safer than reconstructing an identity and its relationships from backups.
3. **Foreign-key relationships.** Accounts and transactions are related records. Soft deletion avoids the destructive chain reaction that a hard delete combined with `ON DELETE CASCADE` could create.

## When hard delete is still appropriate

LedgerApp has no session-token, one-time-code, or temporary-cache table in the starter code. If those tables are added, hard deletion is appropriate when the value is ephemeral, has no audit value, and retaining it increases security or storage risk. Hard deletion is also appropriate for a verified GDPR right-to-erasure workflow when legal retention rules do not require the specific field; that process should be explicit, authorized, and separate from the ordinary user-facing delete route.

## Compliance scenario

Suppose an auditor asks for every transaction belonging to user 1 during the previous 36 months, including records the user attempted to remove. The normal transaction route uses `WHERE deleted_at IS NULL` and returns only active records to the product. An authorized audit process can instead join the retained records and query `transactions WHERE account_id IN (...)` without the active filter, or use `/transactions/audit/deleted` for deleted transaction evidence. The `deleted_at` timestamp proves when the record was removed from normal views while `created_at`, amount, type, and description preserve the transaction trail.

## Storage and performance estimate

Assume 10,000 new transactions per month and an 80% active rate. After 24 months the table holds approximately 240,000 rows, but only 192,000 are active; after five years it holds about 600,000 rows. Without an active partial index, every list query can scan all historical rows as the table grows. The `idx_transactions_active`, `idx_accounts_active`, and related partial indexes include only rows where `deleted_at IS NULL`, so the normal path avoids indexing the 20% historical tail. At roughly 1 million rows, or sooner for latency-sensitive financial dashboards, retention partitioning or an archival/purge job should complement the partial indexes.

Soft deletion trades storage and query discipline for recoverability and evidence. The schema makes the trade explicit: active paths are indexed and filtered, while audit paths intentionally opt into retained deleted records.
