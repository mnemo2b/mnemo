# Research: Typography Trends

## Question

What's happening in web + product typography in 2026 that wasn't five years ago?

## Observations

- **Variable fonts have arrived** — Inter, Roboto Flex, etc. Single file, adjustable weight/width/slant at runtime
- **Custom typefaces for products** — SaaS brands commissioning bespoke fonts (Stripe Sans, Linear Mono, Uber Move)
- **Big type on web** — hero headlines at 72-120px, becoming normalized
- **Monospace renaissance** — JetBrains Mono, Berkeley Mono, Fira Code. Used beyond code.
- **Serifs making a comeback** — editorial sites, newsletter UIs (Substack), design-forward brands
- **Expressive motion** — kinetic typography in onboarding, hero sections

## Variable fonts

Biggest practical shift:
- Single file ships multiple weights and widths
- Fine-grained control via `font-variation-settings`
- Smaller byte footprint vs shipping multiple weight files
- Animation-friendly (weight morphing on hover, etc.)

## Accessibility tension

- Big type is readable; extremely big type strains low-vision users
- "Aesthetic" letter spacing often hurts legibility
- Low-contrast trends (gray-on-gray) still prevalent despite WCAG

## Links to follow

- Typewolf trends report (annual)
- Monotype briefings
- Klim Type Foundry
- Google Fonts ecosystem

## Questions for future research

- How do typefaces affect comprehension in LLM-generated content?
- Are there type systems that work better for code + prose than dedicated pairings?
- How does reader fatigue differ across serif / sans / mono for long-form?
