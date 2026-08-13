# Design QA — Gallery option 1

- Source visual truth: `output/playwright/design-target-option1.png`
- Implementation screenshot: `output/playwright/04-option1-desktop-final.png`
- Mobile evidence: `output/playwright/05-option1-mobile.png`
- Combined comparison: `output/playwright/option1-final-side-by-side.png`
- Target pixels: 1487 × 1058
- Implementation pixels: 1487 × 1058
- CSS viewport: 1487 × 1058; device scale factor 1
- State: default gallery landing page with all six skins

## Full-view comparison evidence

The combined comparison verifies the selected option's core hierarchy: avatar-led dark navigation, two-column hero, two-line Chinese headline, black-whale real-profile hero image, install actions, prominent four-part license strip, and a three-column real-screenshot gallery. The implementation intentionally uses the actual repository copy, release command, license wording, and six source screenshots rather than the mock's invented text.

## Focused evidence

Focused browser checks covered:

- hero title wrapping and hero screenshot aspect ratio;
- all four license/provenance statements and full-notice link;
- 6/6 gallery cards and 9/9 total page images loaded;
- search filtering from six skins to the black-whale result;
- copy-command success feedback;
- responsive widths 390, 768, 1024, 1280, and 1487 with zero horizontal overflow;
- browser console: zero errors and zero warnings.

## Required fidelity surfaces

- Fonts and typography: strong Chinese sans-serif display hierarchy retained; mono labels and commands use system monospace fallbacks. Headline was corrected from three lines to the target's two-line rhythm.
- Spacing and layout rhythm: compact navigation, balanced hero columns, license strip directly below the hero, and three gallery previews visible at the fold. The implementation keeps more breathing room than the mock for readable real copy.
- Colors and visual tokens: graphite black, cool white, muted gray, and Xiaoyao pink match the selected direction with accessible foreground contrast.
- Image quality and asset fidelity: the supplied 438 × 438 Xiaoyao avatar and six original 2984–3004 px real-profile JPEGs are used directly; no visible asset is recreated with CSS or a placeholder.
- Copy and content: real package commands, accurate Web-profile boundary copy, MIT/BSD-3-Clause/CC BY-NC 4.0 distinctions, original attribution, and unofficial-project disclaimer are present.

## Comparison history

1. Initial implementation showed a three-line hero title and a vertically stretched hero image container.
2. Fixed the heading scale/wrapping and set the hero media to the source screenshot's 2.02:1 ratio.
3. Reduced hero and section vertical spacing so the license strip and first gallery row match the selected option's above-the-fold density.
4. Post-fix evidence is `output/playwright/04-option1-desktop-final.png` and `output/playwright/option1-final-side-by-side.png`.

## Findings

No actionable P0, P1, or P2 visual differences remain. The implementation is deliberately not pixel-identical where the mock contains generated or inaccurate product copy; accurate commands, legal language, and source screenshots take precedence.

## Follow-up polish

- P3: optional hover-only screenshot enlargement could be explored later, but is not needed for the current gallery task.

final result: passed
