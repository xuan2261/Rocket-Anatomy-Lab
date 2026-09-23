# Official web-source provenance — Saturn V source GLB

Phase 3B uses the civil-spaceflight Saturn V GLB published by NASA Science and mirrored in NASA's public `NASA-3D-Resources` GitHub repository.

Verified web metadata on 2026-09-23:

- NASA Science resource page: `https://science.nasa.gov/3d-resources/saturn-v/`
- NASA official binary URL: `https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/saturn-v/Saturn%20V.glb`
- GitHub repository file: `nasa/NASA-3D-Resources/3D Models/Saturn V/Saturn V.glb`
- Git blob SHA: `1299e866c174346d0967cd3fd3250f81515fd522`
- Byte length: `927212`
- SHA-256: `6c44497bce54ee0b09d0edb8e33a6f484762a320dab1c54b383e434f5bba06b5`
- NASA page display size: `905.48 KB`
- Source attribution shown by NASA: NASA/Michael D. Carbajal

The intake gate checks all three machine-verifiable fingerprints: Git blob SHA, SHA-256, and byte length. A matching file is still parsed as GLB 2.0 before being accepted.

`npm run fetch:source` tries the two official URLs above and accepts a response only after the same fail-closed qualification. On network-restricted hosts it writes `docs/fetch-source-report.json` with `BLOCKED_NETWORK_OR_SOURCE` and does not create `public/assets/saturn-v.glb`.
