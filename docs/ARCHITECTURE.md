# Rocket Anatomy Lab — Phase 2 architecture

## Runtime layers

```text
NASA GLB / optional local GLB
        ↓
Three.js GLTFLoader
        ↓
Imported Object3D tree
        ↓
Pinned curated-node-map + asset fingerprint
        ↓
Pure viewer state
        ↓
Selection / visibility / isolate / Ghost / X-ray / visual explode
        ↓
Tree + inspector + raw-object debug inventory + 3D viewport
```

## Ownership boundaries

- `src/engine.ts` — immutable generic viewer-state transitions.
- `src/semantic.ts` — semantic types, derived view state, validation and coverage checks.
- `src/nasaSaturnVInventory.ts` — verified evidence snapshot for the pinned NASA GLB revision.
- `src/curatedManifest.ts` — source-node → educational-group mapping.
- `public/real-app.mjs` — Three.js scene, input, Object3D binding and rendering only.
- `public/fallback-app.mjs` — dependency-free offline demonstrator.

The renderer does **not** contain `if (nodeName === ...)` mapping logic. Asset-specific identity is
data. This keeps a later asset replacement from contaminating viewer state or UI components.

## Fail-closed mapping

Real mode refuses to use the curated manifest if the imported source-node set or primary axis differs
from the pinned contract. This is deliberate: a changed upstream asset must be reviewed before its
educational labels are trusted.

## Resource lifecycle

The pagehide teardown cancels animation, disconnects `ResizeObserver`, disposes OrbitControls,
deduplicates/disposes textures, materials and geometries, then disposes the renderer.

## Technology decision

Three.js remains pinned at `0.186.0`. React/R3F is still optional: current domain contracts are
framework-independent and adding a React wrapper would not solve the source-asset assembly gap.
