-- Description: Restore index on user_areas(area_id)
-- This index is required to satisfy the "Unindexed Foreign Keys" linter rule and prevent potential locking issues during cascade operations,
-- even if it appears "unused" by current SELECT queries.

CREATE INDEX IF NOT EXISTS idx_user_areas_area_id ON public.user_areas(area_id);
