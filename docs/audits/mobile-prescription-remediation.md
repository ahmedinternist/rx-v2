# Mobile prescription remediation

Follow-up to [the source audit](mobile-prescription-audit.md), 2026-11-10.
The audit's baseline score describes the earlier source, not this revision.

## Changes

- Instruction joining treats supplied fields as opaque strings. Numeric punctuation,
  repeated directions, line breaks, and conflicting supplied directions are preserved.
  Empty fields and whole-field `Not provided` placeholders are still omitted.
- Medication text is fully opaque before JavaScript runs and throughout entrances.
  The slide/stagger, contact-button press/ripple, shadows, and highlights remain.
- Arabic and Latin-script words in instruction phrases have language annotations;
  spaces, punctuation, and the displayed order are unchanged. This is specifically
  an Arabic/English helper, not automatic identification of every human language.
- Long dosage strings may wrap without truncation. Contact targets are at least
  44px high and wide; small labels may wrap. Manufacturer alignment uses a logical
  margin, and instruction pills keep rounded corners when wrapping.
- Unavailable-link and temporary-error views provide bilingual guidance. Only
  a deliberate retry requests another render; no background polling was added.
- Existing colors are centralized as CSS properties without adding a new theme.
  Secondary header text remains readable on printed white pages.
- The compact list, visible gray dosing pills, 1/2/3 numbering, and absence of
  dropdowns and clock icons remain unchanged.

## Verification

- `node --test tests/prescription-interactions.test.cjs`: all four tests passed.
  Coverage includes real-component fictional-data rendering, opaque instruction
  fields, mixed-script text preservation, and bilingual recovery views.
- Production build: passed, including Next.js type validation.
- Source diff check: API route, shared root layout, Next.js configuration, and
  package manifest are unchanged. No dependencies, secrets, authentication,
  retention, or integration contracts were changed.
- Secondary `#64748b` text on white remains approximately 4.76:1 because row
  opacity is now 1, including the default state and entrance keyframes.
- Browser automation rejected the local fictional preview because its URL policy
  allows only HTTP/HTTPS. The restriction was not bypassed. Visual viewport,
  actual touch, enlarged-text, screen-reader, and runtime reduced-motion checks
  remain unverified. Source checks do not establish browser/device acceptance.
- No new audit score or WCAG conformance claim is assigned without those checks.

Temporary preview-generation files were removed before publication. The original
audit remains as the historical defect record; this document records the repairs
and their verification limits.
