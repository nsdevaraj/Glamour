## 2024-05-22 - Reducing GC Pressure in Canvas AR Loops
**Learning:** In high-frequency render loops (like 60fps AR overlays), even small allocations (like `Array.map` or creating point objects `{x, y}`) accumulate rapidly, causing Garbage Collection glitches that stutter the animation.
**Action:** When optimizing canvas render loops, rewrite logic to use direct iteration and on-the-fly computation instead of intermediate data structures. Move stateless helper functions outside the React component to avoid re-creation.
