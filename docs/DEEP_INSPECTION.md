# Deep inspection and annotation behavior

Date: 2026-09-24

## Root cause fixed

The viewport annotation layer previously started with `annotationsVisible = true` and created a marker for every guided-learning lesson. Because the top visual band is named `nose-stack-assembly`, the Vietnamese label **“Cụm mũi / phía tàu vũ trụ”** remained pinned beside the model even when the user was not working with that lesson.

The controller now:

- starts annotations **off**;
- creates only the marker for the **current lesson**;
- shows that one marker only after the user explicitly enables annotations.

This keeps educational labels out of the normal inspection workspace.

## Current source-model capability

The pinned NASA Saturn V GLB is a presentation asset, not a complete internal engineering model. Qualification currently records:

- 23 nodes;
- 22 meshes;
- 13 materials;
- weakly semantic authoring names;
- a dominant body mesh spanning about 96.76% of the vehicle length.

Therefore the viewer must not imply that tanks, avionics, engines, or spacecraft internals exist as selectable geometry when they are absent from the source GLB.

## New “Inspect inside” preset

The View panel now exposes **Inspect inside / Khám phá bên trong**. It:

1. switches the renderer to X-ray mode;
2. turns on a Y-axis section cut;
3. positions the cut at the center of the selected educational region, or 50% when nothing is selected;
4. focuses the selected region when present.

The UI also states the source limitation beside the control.

## Verified reference expansion path

For a future richer educational cutaway, prefer NASA-owned/public resources and keep provenance per layer:

- NASA Saturn V GLB for the full exterior context;
- NASA Saturn V Stage 1 printable assets;
- NASA Saturn V Stage 2 printable assets;
- NASA Apollo Lunar Module GLB for the spacecraft-side learning layer;
- historical NASA diagrams as non-geometric reference for simplified educational overlays.

Any added internal layer should be clearly labeled **schematic/reference**, not presented as manufacturing geometry or as being contained in the original GLB.
