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

## 2026-02-04 - Blur Filter vs Radial Gradients
**Learning:** `ctx.filter = 'blur(...)'` invokes a convolution kernel that scales poorly with resolution and kernel size in high-frequency loops (60fps).
**Action:** Replace soft circular blurs (like blush) with `ctx.createRadialGradient` and alpha interpolation. It achieves a similar visual result with O(1) fragment shader complexity per pixel.

## 2026-02-12 - Pre-calculation of Canvas Style Strings
**Learning:** String interpolation for `ctx.fillStyle` or `gradient.addColorStop` (e.g., `rgba(${r}, ${g}, ${b}, ${alpha})`) inside a hot loop creates thousands of temporary strings per second, increasing GC pressure.
**Action:** Pre-calculate invariant color strings in a `useEffect` hook and store them in a `useRef`. Pass these static strings to the drawing function.

## 2026-02-13 - Caching Unit Gradients for Variable Sizes
**Learning:** Instead of creating a new `CanvasGradient` every frame for dynamic shapes (like blush on moving cheeks), create a cached "unit gradient" (radius=1) and use `ctx.scale(radius, radius)` to apply it. This avoids object allocation and string parsing in the render loop.
**Action:** When implementing scalable gradient effects, bake the color stops into a unit gradient and handle sizing via context transformation.
