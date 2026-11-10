# Mobile prescription technical audit

Date: 2026-11-10. Source baseline: commit `ce37841631e5a0c3440c7f0752c61e6ded6ef5fd`.
Scope: `/p/[id]`, medication presentation helpers, shared document layout, and mobile CSS.

This is a source-level audit with executed fictional-data rendering tests, helper
reproductions, and calculated color contrast. It is not a live browser,
screen-reader, touch-device, or WCAG conformance certification. Previous attempts
to reach an isolated local preview failed; this audit does not claim that runtime
limitation has been resolved. No real prescriptions or production storage were read.
No implementation fixes, commits, pushes, or deployment changes were made.

## Implementation integrity verdict

Fail on preservation of supplied instruction text; otherwise the presentation is
coherent with the confirmed product brief. Compact numbered rows, visible dosing
pills, conditional contact actions, and no disclosure controls are intentional.
The instruction formatter demonstrably rewrites punctuation within supplied text
and removes repeated fragments, creating a content-integrity defect.

The bundled detector produced one warning at
`app/p/[id]/prescription.module.css:48`: spring/bounce easing. This is intentional
owner-requested tactile feedback, with a reduced-motion alternative. It is not
counted as a defect. Absence of a dropdown or clock icon is also intentional.

## Audit health score

Scores are provisional code-level assessments under the Impeccable rubric.

| Dimension | Score | Key finding |
|---|---:|---|
| Accessibility | 2/4 | Persistently reduced contrast without hydration; Arabic passages lack language metadata |
| Performance | 3/4 | Lean browser-side behavior; device frame rate and runtime metrics unverified |
| Responsive design | 2/4 | Unbreakable badges inside a clipping container; contact targets only 36px tall |
| Theming | 0/4 | Literal colors throughout; no theme tokens or switching system |
| Implementation integrity | 2/4 | Instruction formatting can change supplied numeric text |
| **Total** | **9/20** | **Poor under this rubric; prioritize targeted repairs, not a redesign** |

The theming score measures architectural readiness. Dark mode is not a confirmed
requirement, and its absence is not treated as a user-facing defect. The total is
not an assessment of visual taste or evidence that the existing layout needs replacement.

## Executive summary

Seven findings: **P0: 0; P1: 3; P2: 3; P3: 1**.

Highest priorities are preserving instruction text verbatim, retaining full text
contrast before client JavaScript runs, and marking Arabic instruction passages
with language metadata. Keep the owner's compact layout, gray pill, normal
numbering, and requested motion while making these corrections.

## Findings

### 1. [P1] Instruction joining can change supplied numeric text

- Location: `app/lib/rx-presentation.ts:24-32`; invoked at `app/p/[id]/page.tsx:150-156`.
- Category: Implementation integrity.
- Verified reproduction: `instructionSummary('0·5 mg')` returns `0 • 5 mg`;
  `instructionSummary('1 • 1 • 1')` returns `1`.
- Cause: every supplied field is split on both middle dots and bullets, then
  individual fragments are deduplicated across the entire instruction string.
- Impact: punctuation or repetition that belongs to the supplied directions can
  be changed. The viewer must not reinterpret the content while arranging it.
- Standard: product requirement to preserve clinical meaning and supplied facts.
- Recommendation: preserve each supplied field as an opaque string. Join distinct
  structured fields with presentation separators; do not split or deduplicate
  tokens within those fields. Any whole-field duplicate suppression needs explicit
  rules and regression cases for intentional repetitions and numeric punctuation.
- Suggested command: `$impeccable harden mobile prescription`.

### 2. [P1] No-JavaScript medication text falls below minimum contrast

- Location: `app/p/[id]/prescription.module.css:26,32,43,52-53` and
  `app/p/[id]/medication-item.tsx:10-25`.
- Category: Accessibility.
- Verified calculation: `#64748b` on white is **4.76:1** when opaque. Compositing
  the row at its default `opacity: 0.85` reduces this to approximately **3.56:1**.
  Generic text, form labels, and numbering use that foreground color.
- Impact: if hydration is unavailable or fails, this is a persistent state rather
  than a brief entrance effect. Small text becomes harder to read.
- Standard: [WCAG 1.4.3 Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
  requires 4.5:1 for ordinary small text.
- Recommendation: render rows at full opacity by default. Keep the slide motion,
  or animate a decorative surface without making essential text less legible.
- Suggested command: `$impeccable harden mobile prescription`.

### 3. [P1] Arabic instruction phrases inherit English language metadata

- Location: `app/layout.tsx:10`; `app/p/[id]/page.tsx:253-254`.
- Category: Accessibility.
- Verified evidence: the document declares `lang="en"`; Arabic instructions use
  `dir="auto"` without a corresponding language annotation. Direction metadata
  does not identify the language for assistive technology.
- Impact: screen readers cannot programmatically determine the language of the
  Arabic instruction phrases. Actual pronunciation still requires device testing.
- Standard: [WCAG 3.1.2 Language of Parts](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html).
  Proper names and technical terms are exceptions; this finding concerns instruction
  phrases such as `قبل الاكل`, not patient or medicine names.
- Recommendation: identify known Arabic/English instruction segments with correct
  language metadata while retaining BiDi isolation. Preserve an explicit path for
  mixed-language content rather than relabelling the entire page as Arabic.
- Suggested command: `$impeccable harden mobile prescription`.

### 4. [P2] Long dosage text has no safe reflow path

- Location: `app/p/[id]/prescription.module.css:19,30`; `app/p/[id]/page.tsx:146,249`.
- Category: Responsive design.
- Verified source risk: badges use `white-space: nowrap` while the medication
  container uses `overflow: hidden`. `max-width: 100%` limits the badge box, not
  the unbreakable text inside it. Accepted dosage values are arbitrary supplied
  strings, including multiword directions, rather than bounded numeric strengths.
- Impact: sufficiently long values can extend outside their box and be clipped
  at the container edge. Enlarged text increases the risk. Specific device and zoom
  failures have not been measured in a browser.
- Standard: related to [WCAG 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html);
  this is a confirmed unsafe CSS path, not a claimed completed conformance test.
- Recommendation: keep short strengths intact while allowing long values to wrap
  without truncation. Verify at 320 CSS px and with text enlargement, using long
  combination strengths and multiword dosage strings.
- Suggested command: `$impeccable adapt mobile prescription`.

### 5. [P2] Contact buttons are shorter than the mobile audit target

- Location: `app/p/[id]/prescription.module.css:11`.
- Category: Responsive design / Accessibility.
- Verified evidence: the minimum target height is 36px, below this audit's 44px
  mobile target recommendation.
- Impact: less forgiving taps for patients with limited dexterity.
- Standard: this is not asserted as a WCAG AA violation. [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
  specifies a 24px minimum with exceptions; 36px already exceeds that height.
- Recommendation: provide at least a 44px hit area, preserving compact-looking
  visual surfaces if desired and keeping neighboring targets separate.
- Suggested command: `$impeccable adapt mobile prescription`.

### 6. [P2] Missing or expired prescriptions lack tailored recovery guidance

- Location: `app/p/[id]/page.tsx:22-34`; no `app/p/[id]/not-found.tsx` or
  `app/p/[id]/error.tsx` exists.
- Category: Implementation integrity / Usability.
- Verified evidence: missing records invoke Next.js `notFound()`; storage problems
  can throw into the framework's default error handling. No route-specific patient
  explanation or recovery action is supplied. Framework defaults were not viewed
  in a browser during this audit.
- Impact: patients may not know to request a fresh prescription link or retry a
  temporary problem. Existing records expire after 60 days.
- Standard: product comprehension and recovery expectations; no specific WCAG
  violation asserted.
- Recommendation: explain that the link is unavailable without claiming to know
  whether it is expired, mistyped, or deleted. Add suitable retry/contact guidance
  without revealing internal configuration or accessing another record.
- Suggested command: `$impeccable clarify mobile prescription`.

### 7. [P3] Repeated literal colors make future palette changes fragile

- Location: `app/p/[id]/prescription.module.css:1-67`; `app/layout.tsx:11`.
- Category: Theming.
- Verified evidence: surfaces, text, focus, badge, and interaction colors are literal
  hex values with no shared CSS custom properties.
- Impact: future changes can leave inconsistent focus or motion-state colors.
- Standard: maintainability; no current accessibility failure inferred from the
  lack of tokens or dark mode.
- Recommendation: document and extract a small semantic token set while preserving
  the existing palette. Do not introduce a new theme as part of this repair.
- Suggested command: `$impeccable document`, followed by `$impeccable polish mobile prescription`.

## Patterns and positive findings

- Presentation transformations currently try to infer structure from free text.
  Favor explicit structured fields and conservative formatting instead.
- The contrast and overflow findings occur at shared row/badge rules, so focused
  repairs can benefit every medicine without redesigning individual items.
- Essential directions and quantity remain visible; dropdowns and empty instruction
  blocks are absent as requested.
- Contact links have labels and keyboard focus indicators; website/map links retain
  validation and safe external-link attributes.
- Arabic names and directions use direction isolation; age/date and strengths use
  `bdi`. This is a useful foundation, distinct from language metadata.
- Reduced-motion mode removes movement and ripples while retaining static hover,
  pressed-state color feedback, visible content, and focus outlines.
- Animation uses transforms and opacity, with no layout read/write loops or heavy
  motion library. Observers disconnect once rows enter. No interaction polling,
  API calls, or Redis writes were introduced.
- The fictional-data rendering regression test passed during this audit. It does
  not exercise real pointer input, screen readers, frame rate, or zoom.

## Recommended order

1. **[P1] `$impeccable harden mobile prescription`**: preserve supplied directions,
   fix default text contrast, and annotate instruction languages.
2. **[P2] `$impeccable adapt mobile prescription`**: safe badge wrapping and larger
   contact hit areas; verify narrow screens and enlarged text.
3. **[P2] `$impeccable clarify mobile prescription`**: missing-link and temporary
   error guidance without altering API/storage contracts.
4. **[P3] `$impeccable document`**: capture the incumbent visual system if reusable
   palette guidance is wanted.
5. **`$impeccable polish mobile prescription`**: finish only the verified repair
   backlog, retaining the owner's compact layout and chosen motion.

After repairs, rerun the audit with a reachable fictional preview, keyboard and
screen-reader checks, reduced-motion/no-JavaScript modes, printing, narrow widths,
and enlarged text. No additional visual or interaction verification is claimed here.
