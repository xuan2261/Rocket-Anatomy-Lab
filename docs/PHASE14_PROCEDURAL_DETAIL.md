# Phase 14 — Procedural schematic detail layer

Date: 2026-09-24

## Purpose

Use Three.js itself to add a richer **educational schematic 3D layer** around the verified Saturn V GLB without pretending that generated primitives are manufacturing geometry.

## Implementation path

The runtime remains pinned to Three.js r186 / 0.186.0. The first implementation deliberately uses only official Three.js core APIs already available through the project's import map:

- `InstancedMesh` for repeated reference objects with few draw calls.
- `EdgesGeometry` + `LineSegments` for crisp technical outlines.
- existing local clipping planes for section/cutaway.
- transparent PBR primitives for schematic reference volumes.
- the existing exploded-view interaction for visual separation.

No third-party CSG/BVH dependency is required for this phase.

## Geometry policy

Generated detail is intentionally **dimensionless/relative** to the loaded model bounding box. It represents educational zones and repeated reference objects only.

It must always be described as **schematic / approximate / reference**. It is not suitable for manufacturing, construction, or operational engineering.

## Schematic objects

The first layer contains translucent reference volumes/rings for the anatomy nodes already present in Phase 12/13, plus instanced repeated reference objects. The goal is spatial comprehension and visual drill-down, not exact component reconstruction.

## Why this path first

Three.js cannot infer missing real geometry from a low-detail GLB. More truthful detail requires either:

1. richer source assets (NASA GLB/STL or artist-authored assets), or
2. a clearly labeled schematic layer.

NASA publishes a Saturn V GLB and separate Stage 1 / Stage 2 printable assets, so later phases can qualify those sources before replacing schematic regions with richer real geometry.

## Optional next-stage tooling

- `three-mesh-bvh`: activate only after measured raycasting/spatial-query cost becomes meaningful on richer meshes.
- glTF Transform: use in the offline asset pipeline for inspect/split/dedup/meshopt/KTX2 optimization.
- `LOD` / `SimplifyModifier`: add when multiple real detail levels exist.
- Draco/Meshopt + KTX2: use after asset-size and decode/VRAM measurements justify them.

## Primary references

- https://threejs.org/docs/pages/InstancedMesh.html
- https://threejs.org/docs/pages/EdgesGeometry.html
- https://threejs.org/docs/pages/WebGLRenderer.html
- https://threejs.org/docs/pages/LOD.html
- https://threejs.org/docs/pages/SimplifyModifier.html
- https://threejs.org/docs/pages/GLTFLoader.html
- https://threejs.org/docs/pages/DRACOLoader.html
- https://threejs.org/docs/pages/KTX2Loader.html
- https://science.nasa.gov/3d-resources/saturn-v/
- https://science.nasa.gov/3d-resources/saturn-v-stage-1/
- https://science.nasa.gov/3d-resources/saturn-v-stage-2/
