# Phase 16 — Multi-part NASA Stage detail packages

Date: 2026-09-24

## Outcome

Phase 16 turns the official NASA Saturn V Stage 1 and Stage 2 printable STL sets into local, lazy-loaded GLB detail packages for **historical and educational visualization**.

The conversion pipeline preserves source provenance and part identity. It does not reconstruct missing engineering geometry, infer internal systems, or turn the printable models into manufacturing data.

## Official source sets

### Stage 1

NASA Science publishes four STL files:

- top part a.stl
- top part b.stl
- bottom part a.stl
- bottom part b.stl

Each source is pinned to the exact byte length and Git blob SHA from the official `nasa/NASA-3D-Resources` repository.

### Stage 2

NASA Science publishes three STL files:

- top.stl
- joining cube.stl
- bottom.stl

These are pinned the same way.

## Offline conversion

`scripts/build-stage-detail-packages.mjs`:

1. downloads each official NASA STL from the pinned NASA GitHub repository URL;
2. rejects byte-length or Git-blob-SHA drift;
3. parses the STL using Three.js `STLLoader`;
4. writes one GLB package per stage;
5. keeps every source STL as a separate glTF node + mesh;
6. stores source part ID, filename and blob SHA in glTF extras;
7. validates GLB v2 header, node/mesh count and non-empty position accessors before writing the package.

The generated GLBs are build artifacts under `public/assets/detail/` and are ignored by Git.

## Runtime

The existing Phase 15 `GLTFLoader` remains the only runtime detail loader. Browser runtime never downloads the STL source files and never fetches the NASA GitHub raw URLs.

Placement and scale of each stage package inside the Saturn V overview remain approximate educational mappings.

## Scope

The package supports viewing, hiding and visually separating source-model parts. It is not a physical assembly guide and does not provide fabrication or operational instructions.

## Primary sources

- NASA Science Stage 1:
  https://science.nasa.gov/3d-resources/saturn-v-stage-1/
- NASA Science Stage 2:
  https://science.nasa.gov/3d-resources/saturn-v-stage-2/
- NASA official 3D repository:
  https://github.com/nasa/NASA-3D-Resources
- Three.js STLLoader:
  https://threejs.org/docs/pages/STLLoader.html
- Three.js GLTFLoader:
  https://threejs.org/docs/pages/GLTFLoader.html
