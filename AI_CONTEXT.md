# DebtRadar AI Context

## Completed Phases

### Phase 1

Status: Completed

Features:

* Software Credit Rating
* Executive Command Center
* Deployment Gate

### Phase 2

Status: Completed

Features:

* Rupee Impact Calculator
* Risk Timeline

## Existing Core Features

* Repository analysis and scoring pipeline
* HeatMap technical risk graph
* Node sidebar with technical and business explanations
* Trust Score, Deployment Confidence, and Executive Risk cards
* Business impact translation and consequence forecasting
* Collapse prediction and security collapse banner
* Autofix generation and patch preview
* Roadmap generation and CSV export
* Authentication and analysis sharing flows

## Phase 1 Feature Summary

* Software Credit Rating condenses trust, deployment confidence, exploitability, collapse risk, and critical vulnerability count into an executive-grade rating.
* Executive Command Center surfaces the rating, trust score, deployment recommendation, top business risk, and a short executive summary at the top of Business View.
* Deployment Gate converts executive signals into a clear release decision with the top three reasons.

## Phase 2 Feature Summary

* Rupee Impact Calculator translates repository risk into estimated fix cost, incident exposure, and operational exposure using deterministic business formulas.
* Risk Timeline shows how business risk evolves over 30, 60, and 90 days if no action is taken.
* Both features reuse existing analysis output and render only in Business View.

## Implementation Notes

* Phase 1 is read-only and reuses the existing analysis payload, trust score, deployment confidence, executive summary, and business translation data.
* Business View integrations were added to both the analysis page and the roadmap page without changing Technical View rendering.
* The new intelligence helpers live under `lib/business-intelligence/` and the new UI lives under `components/business/`.
* The executive summary shown in the new command center is capped to two sentences for presentation use.
* Phase 2 adds a deterministic financial-impact calculator and risk timeline on top of the same existing analysis payload with no schema or API changes.

## Created Files

* `lib/business-intelligence/software-credit-rating.ts`
* `lib/business-intelligence/deployment-gate.ts`
* `components/business/SoftwareCreditRating.tsx`
* `components/business/DeploymentGate.tsx`
* `components/business/ExecutiveCommandCenter.tsx`
* `AI_CONTEXT.md`
* `lib/business-intelligence/financial-impact.ts`
* `lib/business-intelligence/risk-timeline.ts`
* `components/business/FinancialImpactCard.tsx`
* `components/business/RiskTimeline.tsx`

## Business View Features

* Business mode toggle in the shared view mode provider
* Business-focused HeatMap labels and risk zones
* Non-technical node explanations
* Business impact panel
* Consequence forecast panel
* Trust score card
* Deployment confidence card
* Executive risk summary card
* Executive command center
* Software credit rating
* Deployment gate
* Rupee Impact Calculator
* Financial impact analysis card
* Risk Evolution Timeline

## Technical View Features

* Technical debt HeatMap and scoring labels
* Technical node sidebar with Mistral-powered explanation flow
* Security overview and severity breakdowns
* Attack propagation graph
* Collapse prediction panel
* Autofix workflow and code diff preview
* Security panels and exploitability badges
* Roadmap prioritization and export

## Important Architectural Notes

* View mode is stored in local storage and exposed through `ViewModeContext`.
* Business View is already gated in `AnalyzeClient` and `RoadmapPage`; Technical View remains unchanged when `mode === 'technical'`.
* The analysis API already returns trust score, deployment confidence, executive summary, and risk buckets, so Phase 1 can stay read-only and reuse existing data.
* New executive cards are implemented as modular business-only components under `components/business/` and derived helpers under `lib/business-intelligence/`.