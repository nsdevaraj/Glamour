# BOLT'S JOURNAL - CRITICAL LEARNINGS ONLY

## 2026-01-31 - External Images & CLS
**Learning:** External images without explicit width/height attributes cause significant Cumulative Layout Shift (CLS), even if CSS handles the final display size.
**Action:** Always add `width` and `height` attributes to `<img>` tags, especially for LCP elements, to reserve layout space.
