# BBH Spatial Principles

## Structure before Decoration

Every visual element must serve a structural purpose. Decoration is not added unless it supports readability, hierarchy, or interaction. Grid is the foundation — not ornament.

## Whitespace is Structure

Whitespace is not empty space. It is an active structural element that defines relationships between components. Consistent spacing creates predictable reading patterns.

## Grid Defines Rhythm

The 64px major / 8px minor grid establishes a consistent spatial rhythm across all workspaces. Components align to this grid naturally. Deviations must be justified by content requirements.

## Components Align to Grid

All components should align their padding, margins, and sizing to the grid increments (8px, 16px, 24px, 32px, 48px, 64px). This ensures visual consistency without requiring explicit measurements per component.

## Typography Follows Baseline

Text aligns to an 8px baseline grid. Line heights and spacing between text elements should be multiples of 8px. This creates vertical rhythm that feels structured and calm.

## Cards Never Float

Cards and panels always have clear boundaries. They never float without a defined container, shadow, or border. Every surface has a purpose.

## Motion Follows Space

Any motion or transition should follow spatial rules — moving within the grid, not crossing it arbitrarily. Duration and easing should feel architectural: deliberate, not playful.

## Implementation

These principles are enforced through:
- The Spatial Grid Language (SGL) grid overlay
- The SpatialProvider context for runtime grid access
- Workspace components that consume SpatialContext
- GridDebug mode for visual verification (Ctrl+Shift+G)
