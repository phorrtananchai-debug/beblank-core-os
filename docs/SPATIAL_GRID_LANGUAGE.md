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

- Grid is active by default in all OS workspaces via `OSLayout`
- Studio and Design System pages use **architect** mode (0.05)
- All other workspaces use **operation** mode (0.03)
- Grid renders as an absolutely-positioned background (`shell` mode)
- No layout shift — grid is behind all content
- `pointer-events: none` — grid never blocks interaction
- Keyboard shortcut: `Ctrl+G` to toggle grid visibility (future)

## Runtime Integration

The grid is injected at the `OSLayout` level. Every route under `/os/` gets automatic grid rendering.

```tsx
// In OSLayout.tsx — automatic per-route grid mode
const gridVariant =
  path.startsWith('/os/studio') || path.startsWith('/os/design-system')
    ? 'architect'
    : 'operation'

<GridOverlay enabled={true} variant={gridVariant} shell={true} />
```

The `shell={true}` prop uses `position: absolute; z-index: 0` so the grid sits behind all content naturally.

## GridCanvas

For per-page grid wrapping:

```tsx
<GridCanvas gridEnabled gridVariant="architect">
  <YourPageContent />
</GridCanvas>
```
