# Assembly-capable GLB pipeline

## Purpose

Turn the presentation-oriented Saturn V GLB into an educational scene graph in which visible regions can be moved independently for digital assembly/disassembly demonstrations.

This is a visualization pipeline, not a vehicle-design or manufacturing model.

## Source gate

The CLI accepts the pinned source only when its Git blob SHA is:

`1299e866c174346d0967cd3fd3250f81515fd522`

Source path:

`nasa/NASA-3D-Resources / 3D Models/Saturn V/Saturn V.glb`

Any source drift fails before output is written.

## Partition method

The re-authorer:

1. Parses GLB v2 JSON and BIN chunks.
2. Rejects unsupported transforms, skins, morph targets, sparse accessors, non-triangle primitives, and compressed primitives that require decoding.
3. Reads every triangle through the primitive's POSITION and index accessors.
4. Computes each triangle centroid along the verified primary axis.
5. Normalizes that coordinate against the pinned model bounds.
6. Assigns the triangle to exactly one contiguous educational assembly range.
7. Writes new index accessors while preserving the source vertex attributes, materials, textures, and UVs.
8. Builds one glTF mesh/node per assembly and records provenance in `asset.extras.rocketAnatomyLabAssembly`.

The method assigns complete source triangles rather than cutting triangles at boundary planes. This preserves all triangles exactly once but can leave visually open interfaces. A future cut-surface/capping phase can improve presentation quality.

## Commands

```text
npm run build
npm run build:assembly
node scripts/qualify-assembly-glb.mjs public/assets/saturn-v-education.glb
```

Expected local input:

`public/assets/saturn-v.glb`

Expected output:

`public/assets/saturn-v-education.glb`

## Runtime behavior

The viewer first tries the educational GLB. It verifies:

- manifest ID,
- pinned source SHA,
- `educationalOnly: true`,
- `historicalStageBoundaries: false`,
- five expected assembly IDs,
- one transformable root per assembly.

If any check fails, it falls back to the verified Phase 2 presentation model rather than guessing.
