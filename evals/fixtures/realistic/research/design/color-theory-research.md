# Research: Color Theory

## Question

How much of color theory is perceptual reality vs aesthetic convention? What actually drives "good" color systems for interfaces?

## Foundational

- **CIE color spaces** — XYZ, Lab, LCH. Perceptually uniform — equal distances feel equally different.
- **OKLCH / OKLab** — newer, addresses Lab's failures on saturated colors. Increasingly default in web tooling.
- **Hex / RGB / HSL** — tooling-native but perceptually uneven. HSL in particular: same "saturation" looks wildly different by hue.

## Why OKLCH is winning

- Consistent perceived lightness across hues
- Chroma separated from hue
- Interpolation produces smooth gradients without gray in the middle
- Tailwind 4.x and Radix colors use OKLCH

## Accessibility

- WCAG uses relative luminance, which is imperfect
- APCA (Accessible Perceptual Contrast Algorithm) is more accurate but not yet adopted
- For now: WCAG is the standard, APCA is the future

## Palettes that work

- Radix colors — carefully designed scales, 12 stops each, include semantic steps (e.g. "UI element background", "text on colored background")
- Tailwind default palette — convenient, mathematically regular
- Individual brand palettes curated by hand — best results but highest effort

## What the research says

- Warm colors feel closer; cool colors feel distant (weak effect but consistent)
- Higher saturation = higher perceived urgency (accessibility red isn't arbitrary)
- Cultural associations vary wildly — red means luck (China) or danger (West)
- Simultaneous contrast effects are real; same color looks different next to different neighbors

## Ongoing questions

- Does dark mode genuinely reduce eye strain, or is it just preference?
- How should color work for color-blind users — graceful degrade vs parallel visual encoding?
- What's the right way to test color systems across monitors, phones, and print?
