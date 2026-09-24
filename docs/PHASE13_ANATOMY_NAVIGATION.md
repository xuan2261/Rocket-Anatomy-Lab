# Phase 13 — Anatomy navigation & evidence upgrade

Date: 2026-09-24

## Goal

Make the NASA reference-anatomy layer directly navigable and shareable without weakening the Phase 12 separation between verified GLB geometry and historical reference data.

## Interaction contract

- Deep link: `?structure=anatomy&anatomy=<node-id>`.
- Anatomy navigation uses browser history so Back/Forward traverses drill-down state.
- Search is bilingual and diacritic-tolerant. Results remain ordinary semantic buttons rather than an ARIA listbox because each result carries rich descriptive metadata.
- Every selected node exposes an evidence drawer with the official NASA source, source type, and mapping precision.
- A selected anatomy node may render a viewport reference marker only while NASA Anatomy mode is active.
- Camera bookmarks use the nearest verified GLB educational region plus the node's approximate longitudinal anchor.
- Inspect Inside combines the node bookmark with X-ray and the existing section-cut controller.
- No reference node creates, clones, or claims internal mesh geometry.

## Evidence semantics

- **Official NASA source** means the historical label/description is backed by an official NASA/NTRS page or document.
- **Approximate 3D position** means the visual marker, camera target, and section position are an educational mapping to the current GLB, not an engineering boundary recovered from the model.

## Web-platform rationale

The query string is the shareable state surface. Browser History API entries are used for user-initiated anatomy navigation so reload and Back/Forward remain meaningful. Search results are buttons with real headings/copy instead of forcing rich content into ARIA listbox options.

## Verification gates

- unit: query parsing/serialization, search ranking, camera-scale policy;
- contract: no mesh creation in the anatomy controller;
- E2E: direct URL load, reload, Back/Forward, search, keyboard, evidence drawer, marker, Inspect Inside;
- a11y: Axe WCAG A/AA in NASA Anatomy mode for VI/EN;
- visual: existing default Model mode baselines remain unchanged.
