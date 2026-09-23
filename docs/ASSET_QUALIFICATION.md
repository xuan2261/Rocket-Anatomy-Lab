# NASA Saturn V asset qualification — Phase 2

## Source identity

Official source: NASA 3D Resources / `nasa/NASA-3D-Resources`

File: `3D Models/Saturn V/Saturn V.glb`

Pinned Git blob: `1299e866c174346d0967cd3fd3250f81515fd522`

NASA resource page: `https://science.nasa.gov/3d-resources/saturn-v/`

## Verified GLB structure

Observed directly from the pinned public binary:

- GLB / glTF 2.0
- 927,212 bytes
- 1 scene
- 23 nodes
- 22 meshes
- 13 materials
- 23 animation clips
- root node `saturnv_ca`
- longitudinal model extent on Y: approximately `-0.14089 .. 12.84592`

The raw authoring names are weakly semantic (`pCylinder*`, `polySurfa*`, `group*`), so historical
labels are never inferred from a name alone.

## Primitive-level finding

The most important Phase 2 finding is the dominant `pCylinder1` node:

- 9 render primitives
- Y range approximately `0.27979 .. 12.84592`
- about **96.76%** of the complete model's longitudinal range

Several of its primitives overlap large portions of the body. Therefore a renderer cannot honestly
turn this full GLB into independently transformable historical stages merely by assigning node
labels and moving nodes.

This changes the asset verdict from Phase 1:

- **PASS:** real-model inspection, selection, hide/show, isolate, Ghost/X-ray, annotations later
- **PASS:** curated grouping of stable imported objects
- **FAIL AS SOURCE CAPABILITY:** clean stage-level digital disassembly through node transforms

This is a source-asset limitation, not a viewer-state limitation.

## Supporting NASA assets

NASA also publishes separate educational 3D-printable resources for Saturn V Stage 1 and Stage 2:

- `https://science.nasa.gov/3d-resources/saturn-v-stage-1/`
- `https://science.nasa.gov/3d-resources/saturn-v-stage-2/`

Those resources are useful as digital reference inputs for a future assembly-capable visualization
asset. Phase 2 does not merge them automatically because alignment, hierarchy and remaining upper
sections still need explicit digital authoring/curation.

## Animation verdict

The 23 existing animation clips are per-node transform tracks with generic authoring names. They are
not treated as a meaningful educational assembly/disassembly sequence.
