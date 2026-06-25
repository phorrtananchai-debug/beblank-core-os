# BBH Spatial Grid Language (SGL)

## Purpose

The Spatial Grid Language provides a consistent structural reference for layout composition across BBH OS workspaces. It is not a visual design element — it is an invisible alignment tool that ensures spatial consistency.

## Design Philosophy

- Grid is **structural**, not decorative
- Grid is **background**, not foreground
- Grid never blocks interaction
- Grid adapts to context via variants
- Grid is defined in code, not hardcoded per page

## Variants

| Variant | Opacity | Usage |
|---|---|---|
| Architect | 0.05 | Layout composition, design review |
| Operation | 0.03 | Default daily workspace mode |
| Presentation | 0.015 | Client-facing views |
| Print | 0.08 | Documentation output |

## Tokens

| Token | Default | CSS Variable |
|---|---|---|
| Major grid | 64px | `--bb-grid-major` |
| Minor grid | 8px | `--bb-grid-minor` |
| Opacity | 0.03 | `--bb-grid-opacity` |
| Line thickness | 1px | `--bb-grid-line` |
| Fade distance | 120px | `--bb-grid-fade` |

## Do

- Use grid as background reference for alignment
- Enable grid during layout and design review
- Use variant presets (architect/operation/presentation/print)
- Let grid fade at edges for a natural look

## Don't

- Never make grid interactive
- Never place grid above content
- Never use grid as decorative pattern
- Never change grid opacity above 0.1
- Never block pointer events with grid overlay

## Visual Hierarchy

1. **Content** (top layer) — interactive, readable
2. **Grid overlay** (middle layer) — passive reference
3. **Background/shell** (bottom layer) — canvas

## Recommended Usage

- Enable grid globally during development via localStorage or environment variable
- Use `GridCanvas` for pages under active layout review
- Use `GridOverlay` directly for per-section grid display
- Keyboard shortcut: `Ctrl+G` to toggle grid visibility (future)
