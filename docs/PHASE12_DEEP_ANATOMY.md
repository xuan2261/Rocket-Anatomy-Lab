# Phase 12 — Deep Anatomy

Date: 2026-09-24

## Outcome

Phase 12 adds a NASA-sourced **reference anatomy** drill-down beside the existing 3D geometry tree.

The UI deliberately separates two concepts:

- **3D Model** — what is actually present in the verified/re-authored GLB.
- **NASA Anatomy** — historical systems and components documented by NASA, mapped only to approximate longitudinal reference positions in the current model.

This phase **does not add hidden internal geometry** that is absent from the source GLB.

## Historical hierarchy

Top level: S-IC, S-II, S-IVB, Instrument Unit, and the Apollo spacecraft stack.

Detailed examples include S-IC F-1 cluster / thrust structure / fuel tank / intertank / LOX tank / forward skirt; S-II and S-IVB tank and bulkhead references; Instrument Unit guidance/electronics; and Apollo LM/SLA, Service Module, Command Module and Launch Escape System.

## Evidence policy

Every anatomy node carries an official NASA source URL, bilingual educational copy, an approximate normalized longitudinal anchor, and the nearest existing educational GLB region used only for focus/highlight.

The UI labels this mapping as **NASA reference / approximate 3D position**. It must never be presented as an exact engineering boundary extracted from the GLB.

## Interaction

Inside **Objects** the user can switch between **3D Model** and **NASA Anatomy**, drill down with breadcrumbs, focus the nearest real 3D region, or use **Inspect inside** to enable X-ray plus a Y section cut at the reference position.

The Three.js raycaster continues to select real meshes recursively; reference anatomy never rewrites mesh identity.

## Primary references

- https://science.nasa.gov/3d-resources/saturn-v/
- https://ntrs.nasa.gov/citations/20090016301
- https://www.nasa.gov/wp-content/uploads/static/history/afj/ap13fj/pdf/report-of-a13-review-board-19700615-19700076776.pdf
- https://www.nasa.gov/image-article/manufacturing-saturn-v-instrument-unit/
- https://www.nasa.gov/history/diagrams/apollo.html

## Verification gates

TypeScript manifest validation, unit and contract tests, Playwright drill-down behavior, Axe WCAG A/AA in NASA Anatomy mode, and existing visual regression.
