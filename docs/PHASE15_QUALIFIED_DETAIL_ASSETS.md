# Phase 15 — Qualified real detail assets

Date: 2026-09-24

## Outcome

Phase 15 introduces the first **real NASA detail package** alongside the existing Saturn V shell and schematic fallback.

The first qualified package is the Apollo Lunar Module GLB published by NASA Science and mirrored in the official `nasa/NASA-3D-Resources` repository.

## Qualification pin

- Anatomy node: `apollo-lm-sla`
- File: `Apollo Lunar Module.glb`
- Expected byte length: `716840`
- Expected Git blob SHA-1: `74b7b99a60f9903a0592fd763ed14482204e24d9`
- Runtime path after CI fetch: `public/assets/detail/apollo-lunar-module.glb`

The fetch gate tries the NASA Science CDN first and the official NASA GitHub raw file second. It fails closed unless the downloaded bytes match the pinned byte length, GLB v2 header/declared length, and Git blob SHA.

## Runtime behavior

The detail asset is not parsed at initial page load. It is loaded with the existing Three.js `GLTFLoader` only when the matching anatomy node requests real detail.

The standalone Lunar Module is uniformly scaled and mapped into the current Saturn V shell using an approximate educational anchor. Its geometry is real source geometry; only the placement/scale mapping into the Saturn V overview is approximate.

When a qualified detail asset is shown:

- the Saturn V shell can remain visible in ghost mode for context;
- section clipping is applied to the detail model as well;
- schematic geometry remains a separate fallback layer and is not merged with the real asset identity;
- materials/geometries/textures owned by the detail asset are disposed during teardown.

## Stage 1 / Stage 2 status

NASA Science publishes Stage 1 as four STL pieces and Stage 2 as three STL pieces. Those sources are qualified as candidates, but they are **not** imported directly in Phase 15 because the current runtime is GLB-centric and the multi-part STL packages need an offline conversion/alignment step first.

## Primary sources

- NASA Science — Apollo Lunar Module:
  https://science.nasa.gov/3d-resources/apollo-lunar-module/
- NASA official 3D repository:
  https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Apollo%20Lunar%20Module
- NASA Science — Saturn V Stage 1:
  https://science.nasa.gov/3d-resources/saturn-v-stage-1/
- NASA Science — Saturn V Stage 2:
  https://science.nasa.gov/3d-resources/saturn-v-stage-2/
