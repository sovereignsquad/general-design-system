# Camera Adoption Plan

Status: Active reusable-contract driver
Version: 1.1.0
Last updated: 2026-06-07
Project: `Camera`

## Objective

Define the reusable GDS contracts, compliance rules, and migration guidance that Camera and similar media-heavy admin products need so they can become clean consumers instead of permanently exception-heavy products.

## Current pressure areas

- needs Mantine 9 / React 19 / Next 16 clarity
- needs stronger admin package coverage
- needs public-surface package coverage
- needs media/gallery/upload patterns
- needs editor/configuration workflow patterns
- needs permission/access UI patterns
- needs SSR-safe App Router guidance
- needs strict admin-wrapper detection for form-heavy create/edit/detail/editor surfaces

## Central contracts Camera is expected to drive

1. compatibility and upgrade policy
2. server-safe/client-safe exports
3. stable admin package contract
4. public shell, auth, profile, and share/detail surface contract
5. media-heavy and upload pattern family
6. editor and settings workflow patterns
7. permission and access UI patterns
8. strict admin GDS-only wrapper boundary

## GDS-owned deliverables

- canonical admin create/edit/detail/editor replacement map in `ADOPTION_AND_MIGRATION_PLAYBOOK.md`
- strict-mode `approvedAdminPrimitives` manifest lane
- `gds-compliance` detection for local admin layout, form, action, breadcrumb, card, media, and field shims
- project-board issues phrased as reusable GDS migration contracts with product-specific source paths treated as consumer evidence, not package-owned implementation
- documentation that separates GDS-owned UI chrome from product-owned APIs, uploads, persistence, permissions, telemetry adapters, retries, and rollback behavior

## Product-owned execution

The consuming Camera repository remains responsible for editing its app files, preserving its backend payloads, running its CI, and providing route-level visual and accessibility evidence. If the Camera team needs more package coverage, that gap should be escalated back here as a reusable GDS contract request rather than solved as a one-off local wrapper.

## Local exception direction

Keep these local unless another product proves the same contract:

- domain-specific media pipelines
- bespoke slideshow/layout editor internals
- relationship-specific data semantics beyond shared list/card/access framing

## Exit criteria

- Camera is listed in the portfolio matrix
- the missing shared contracts are linked to central GDS issues
- exception boundaries are explicit instead of implicit local freedom
- strict admin-wrapper compliance can fail remaining local admin shims in any admin/hybrid consumer
