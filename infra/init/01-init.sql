-- Runs once on first cluster initialization (Docker only).
-- pg_trgm backs the catalog full-text/similarity search added in Phase 2.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
