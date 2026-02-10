## 2024-05-22 - Reducing GC Pressure in Canvas AR Loops
**Learning:** In high-frequency render loops (like 60fps AR overlays), even small allocations (like `Array.map` or creating point objects `{x, y}`) accumulate rapidly, causing Garbage Collection glitches that stutter the animation.
**Action:** When optimizing canvas render loops, rewrite logic to use direct iteration and on-the-fly computation instead of intermediate data structures. Move stateless helper functions outside the React component to avoid re-creation.

## 2026-02-03 - DOM Property Access in Hot Loops
**Learning:** Accessing `ctx.canvas.width/height` inside every iteration of a landmark drawing loop (300+ times per frame) adds measurable overhead due to DOM property lookups.
**Action:** Hoist canvas dimensions into local variables (`const w = ctx.canvas.width`) at the start of drawing functions. Also, verify if `ctx.clearRect` is redundant when using full-frame `drawImage`.

## 2026-02-03 - Hoisting DOM Access to Render Loop Scope
**Learning:** Hoisting `canvas.width` and `canvas.height` at the start of the `onResults` loop and passing them as arguments to stateless helper functions is more efficient than accessing them inside each helper. This avoids 10-20 repeated DOM property lookups per frame.
**Action:** When refactoring render loops, push context-dependent variables (like dimensions) up the call stack to the loop entry point.

## 2026-02-04 - Consolidating Canvas State Changes
**Learning:** In complex multi-pass canvas drawings (like lips with 3 layers), using a single `save/restore` block and manually managing state changes (like `globalCompositeOperation`) is more efficient than wrapping each pass in its own `save/restore` block.
**Action:** When implementing multi-layer canvas effects, group them under a single state stack frame if possible.

## 2026-02-04 - Batching Symmetric Canvas Operations
**Learning:** Drawing symmetrical features (left/right eye, cheeks) individually doubles the overhead of `ctx.save()`, `ctx.restore()`, and especially expensive `ctx.filter` assignments.
**Action:** Refactor drawing helpers to accept arrays of shapes (`indices[][]`) and batch them into a single path (using `moveTo` for separation) before a single fill/stroke operation.

## 2026-02-05 - Replacing Expensive Canvas Filter with Gradient
**Learning:** `ctx.filter = 'blur(...)'` triggers expensive convolution operations that can drop frame rates in AR loops. For soft features like blush, `createRadialGradient` offers a performant approximation (O(1) vs O(radius²)).
**Action:** Replace `ctx.filter` with `createRadialGradient` for soft circular/elliptical shapes, using transformation matrices (`scale`, `rotate`) to match the geometry.
