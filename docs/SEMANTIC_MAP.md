# Curated semantic map — Saturn V full GLB

Mapping is stored in `src/curatedManifest.ts`; renderer code contains no raw-node conditionals.

| Curated group | Source objects | Evidence | Explode role |
|---|---:|---|---:|
| Base hardware & fins | 13 | geometry at the model base + official preview review | -1.00 |
| Lower body exterior details | 2 | both span ~Y 1.93–4.34 | -0.45 |
| Mid-body exterior details | 2 | both span ~Y 5.72–7.73 | +0.15 |
| Upper exterior details | 4 | all cluster ~Y 11.19–11.31 | +0.65 |
| Primary body shell | 1 | dominant full-body object | 0.00 |

`explodeSignedFactor` is a visual inspection offset, not a claim about a physical separation event.
The body shell intentionally stays fixed because its geometry spans almost the entire model.

## Stability contract

At runtime the imported 22 source names are compared to the curated manifest:

- unknown imported node → fail closed
- expected node missing → fail closed
- duplicate mapping → qualification failure
- unexpected primary axis → fail closed

The bootstrap then falls back to the dependency-free demonstrator rather than silently inventing a
new mapping.
