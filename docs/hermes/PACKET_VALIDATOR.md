# Hermes Packet Validator CLI

**Purpose:** Validate Hermes packet files against the documented schema before human review.

---

## CLI Usage

```bash
node scripts/hermes-validate-packet.mjs <packet-file>
```

## Exit Codes

| Code | Status | Meaning |
|------|--------|---------|
| 0 | PASS | All required sections present and populated with content |
| 1 | WARN | All required sections present, but some contain placeholders or missing non-critical fields |
| 2 | FAIL | Required sections missing or empty |

## Validation Rules

The validator checks:

| Rule | What It Checks | Severity |
|------|----------------|----------|
| **Packet title** | `# Title` heading exists | Warn |
| **Mission** | `## Mission` section exists and has content | Fail if missing/empty, Warn if placeholder |
| **Allowed Files** | `## Allowed Files` section exists and has content | Fail if missing/empty, Warn if placeholder |
| **Forbidden Files** | `## Forbidden Files` section exists and has content | Fail if missing/empty, Warn if placeholder |
| **Evidence** | `## Evidence` section exists and has content | Fail if missing/empty, Warn if placeholder |
| **Approval** | `## Approval` section exists and has content | Fail if missing/empty, Warn if placeholder |
| **Closeout** | `## Closeout` section exists and has content | Fail if missing/empty, Warn if placeholder |

## Example Output

### PASS

```
  ✔ Packet title: Phase 7.2 Validator Test
  ✔ Mission
  ✔ Allowed Files
  ✔ Evidence
  ✔ Approval

Result:
  PASS
```

### WARN

```
  ✔ Packet title: Phase 7.2 Validator Test
  ✔ Mission
  ✔ Allowed Files
  ⚠ Approval section contains only placeholder content

Result:
  WARN
```

### FAIL

```
  ✔ Packet title: Phase 7.2 Validator Test
  ✘ Forbidden Files section is missing
  ✘ Approval section is missing

Result:
  FAIL
```

## Limitations

- Does not validate YAML frontmatter or metadata field types.
- Does not parse code blocks or verify command syntax.
- Does not check that referenced files actually exist on disk.
- Does not enforce naming conventions.
- Does not check for semantic correctness — only structural completeness.
- Single-file implementation with no dependencies.
