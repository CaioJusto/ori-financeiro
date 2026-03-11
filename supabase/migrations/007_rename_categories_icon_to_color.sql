-- Rename categories.icon to categories.color
-- The column stores a hex color string (e.g. #ef4444), not an icon reference
ALTER TABLE categories RENAME COLUMN icon TO color;
