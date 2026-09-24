# Phase 17 — Detail Package Inspector

Date: 2026-09-24

## Goal

Turn the qualified Stage 1 / Stage 2 GLB packages into a compact source-part inspector without adding a second control surface.

This phase is strictly for historical and educational visualization. It does not alter source geometry, infer missing internal systems, or provide fabrication or operational guidance.

## Interaction model

The inspector stays inside the existing **NASA real model** card.

For generated multi-part packages:

- hover a part row → highlight that source part in the viewport;
- click a part row → select it and persist the selection in the URL;
- click the loaded part in the viewport → select the matching row;
- Focus part → frame that part from its actual loaded bounds;
- Ghost other parts → reduce visual prominence of non-selected parts;
- Show only this part → temporarily isolate the selected source part;
- per-part visibility remains independent of selection;
- package explode amount and hidden-part state are deep-linked.

## Deep-link contract

Phase 17 extends the existing anatomy query state with:

- `detailPart=<source-part-id>`
- `detailExplode=0..100`
- `detailHidden=<comma-separated-source-part-ids>`
- `detailGhost=1`
- `detailOnly=1`

Invalid part IDs are ignored. Browser Back/Forward and reload restore valid inspector state.

## Three.js path

The implementation uses only Three.js r186 APIs already compatible with the project:

- `Raycaster` for viewport picking;
- `Box3.setFromObject(..., true)` for precise selected-part bounds and statistics;
- `BoxHelper` for selected/hover visual feedback;
- the existing camera-transition helper for Focus part.

No postprocessing stack or third-party picking dependency is added.

## Inspector metrics

For the selected source part the UI reports:

- mesh count;
- triangle count derived from loaded geometry;
- estimated draw calls from geometry groups;
- loaded world-space bounds;
- source filename + pinned Git blob SHA.

These are viewer/runtime metrics, not engineering specifications.

## Source integrity

Part identity comes from `extras.sourcePart` embedded during Phase 16 STL→GLB conversion. The inspector changes visibility/material presentation and transforms used for exploded-view presentation only; it does not mutate the source vertex data.

## Primary references

- Three.js Raycaster:
  https://threejs.org/docs/pages/Raycaster.html
- Three.js Box3:
  https://threejs.org/docs/pages/Box3.html
- Three.js BoxHelper:
  https://threejs.org/docs/pages/BoxHelper.html
