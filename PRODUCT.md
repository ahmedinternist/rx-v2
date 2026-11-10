# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Patients and pharmacists have equal priority, as confirmed by the owner.
Patients need to read their prescribed medicines and directions on a phone.
Pharmacists need to identify the prescribed products, strengths, and supplied
treatment instructions without ambiguity.

## Product Purpose

Rx Viewer presents a shared digital prescription in a compact, readable mobile
web page. Success means both audiences can understand the supplied prescription
without losing clinical facts or confusing missing information with instructions.

## Operating Context

- This repository is the prescription sharing API and web viewer, separate from
  the prescribing desktop application. Preserve that integration boundary.
- An authorized client submits prescription JSON to `/api/rx`, which returns a
  prescription ID and a shareable `/p/[id]` URL for link or QR-code access.
- The existing implementation uses Next.js App Router, React, TypeScript, and
  Upstash Redis REST storage. The deployment target is Vercel.
- The current API expires stored prescriptions after 60 days. This is an existing
  integration contract, not permission to change retention during design work.

## Capabilities and Constraints

- Present prescriber identity, license and supplied clinic contact actions;
  patient identity, age and date; medication identity, generic name, strength,
  manufacturer, directions, treatment length, and quantity when supplied.
- Keep frequency, meal timing, and treatment length together in the visible gray
  instruction pill with bullet separators. Medication numbering is 1, 2, 3, etc.
- Preserve compact medication rows. The owner explicitly removed the
  "Prescription details" dropdown; do not reintroduce it without a new request.
- Preserve requested drug styling, shadows, highlighting, and browser-side
  contact-button and entrance feedback. Do not restore the removed clock icon.
- API secrets, authentication, environment configuration, payload compatibility,
  Redis storage behavior, returned links, and other app integrations must remain
  unchanged by presentation work.
- Format display text conservatively. Preserve distinct and conflicting clinical
  facts. Do not infer or alter a dose, treatment length, phone number, or medicine
  identity to fit a layout.
- Omit empty instruction blocks and missing-information placeholders. Do not
  invent refill information, days remaining, urgency, verification claims, or
  clinical alerts.
- Animations and interaction state run locally in the browser. Keep presentation
  interactions free of extra backend requests, polling, or database writes.
- Commit, push, and deployment are separate actions requiring the owner's request;
  a successful push alone is not evidence of a successful live deployment.

## Brand Commitments

Preserve the existing Rx Viewer / Rx identity and the supplied prescriber and
clinic information. Use clear, restrained wording suited to patients and
pharmacists. Do not rename the product or replace factual copy during refinement.

## Evidence on Hand

- `app/p/[id]/page.tsx`: current server-rendered prescription presentation and
  accepted payload fallbacks.
- `app/p/[id]/medication-item.tsx`: browser-side medication entrance behavior.
- `app/p/[id]/prescription.module.css`: incumbent responsive presentation and
  motion behavior.
- `app/lib/rx-presentation.ts`: display-only formatting helpers.
- `app/api/rx/route.ts`: existing authentication, storage, retention, and sharing
  contracts. Read-only reference for design tasks.
- `tests/prescription-interactions.test.cjs`: fictional-data rendering regression
  checks. These do not establish visual or touch-device acceptance.
- The owner's supplied screenshots illustrate desired refinements; they do not
  authorize changing the clinical or contact values shown in actual records.
- Production builds and rendering tests have passed for the current compact
  viewer. Live browser/touch verification remains unconfirmed because the
  isolated preview could not be reached by the browser tool.

## Product Principles

1. Give patients and pharmacists equal access to clear prescription information.
2. Preserve clinical meaning and supplied facts before optimizing presentation.
3. Keep essential directions visible without extra taps or disclosure controls.
4. Improve reading and feedback without altering integrations or adding backend
   work for local interactions.
5. Evaluate with fictional data and distinguish source checks from live evidence.

## Accessibility & Inclusion

- Support Arabic, English, and mixed-direction content. Isolate text direction so
  Arabic instructions and names do not disrupt adjacent numbers or controls.
- Preserve readable wrapping and alignment on narrow mobile screens.
- Respect reduced-motion preferences and retain readable content before client
  JavaScript runs or when animations are disabled.
- Keep contact actions keyboard accessible, clearly labelled, and visibly focused.

## Open Decisions

- No formal accessibility conformance target has been confirmed.
- No supported-device or browser acceptance matrix has been confirmed.
