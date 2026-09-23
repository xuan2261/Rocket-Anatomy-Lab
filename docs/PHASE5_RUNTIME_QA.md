# Phase 5B runtime QA checklist

Run:

```text
npm run serve
```

Open the printed loopback URL in the same browser environment that successfully ran Phase 4.

## Section / Cutaway

1. Enable `Section: On`.
2. Move the section position range; clipping should move continuously through the model.
3. Switch X / Y / Z; the plane orientation should change without changing assembly state.
4. Toggle Direction; the kept/clipped side should reverse while the geometric plane remains at the same position.
5. Toggle `Visual cap`; clipping must remain active when the cap is off.
6. Verify selection, Hide/Show, Isolate, Normal/Ghost/X-Ray and manual Explode still work with Section enabled.
7. Verify the guided timeline still works with Section enabled.
8. `Reset view` should restore Section Off, timeline baseline, authored transforms and overview camera.

## Accessibility

- Tab reaches every Section control.
- Section range responds to Arrow keys and Home/End through native range semantics.
- X/Y/Z, Direction, Section and Visual-cap pressed states are visually distinguishable.
- No horizontal overflow at desktop, mobile portrait and mobile landscape sizes.

## Expected limitation

The educational GLB is not a watertight CAD solid. The Visual cap is an inspection aid; if a cap artifact appears at some cut positions, turn Visual cap off. The clipping plane itself should remain correct.

## Completion gate

Phase 5B is PASS when the above behaviors are confirmed with no console errors that affect interaction or rendering.
