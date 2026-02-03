## 2024-05-22 - Reducing GC Pressure in Canvas AR Loops
**Learning:** In high-frequency render loops (like 60fps AR overlays), even small allocations (like `Array.map` or creating point objects `{x, y}`) accumulate rapidly, causing Garbage Collection glitches that stutter the animation.
**Action:** When optimizing canvas render loops, rewrite logic to use direct iteration and on-the-fly computation instead of intermediate data structures. Move stateless helper functions outside the React component to avoid re-creation.

## 2026-02-03 - DOM Property Access in Hot Loops
**Learning:** Accessing `ctx.canvas.width/height` inside every iteration of a landmark drawing loop (300+ times per frame) adds measurable overhead due to DOM property lookups.
**Action:** Hoist canvas dimensions into local variables (`const w = ctx.canvas.width`) at the start of drawing functions. Also, verify if `ctx.clearRect` is redundant when using full-frame `drawImage`.
