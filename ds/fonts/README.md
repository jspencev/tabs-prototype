# Fonts

Descript's licensed brand faces, installed as webfonts:

| Role                 | Family            | Weights shipped               | Files                                             |
| -------------------- | ----------------- | ----------------------------- | ------------------------------------------------- |
| Product UI / display | **Booton**        | 400 regular · 400 italic · 600 SemiBold · 600 SemiBold Italic | `Booton-Regular`, `Booton-RegularItalic`, `Booton-SemiBold`, `Booton-SemiBoldItalic` (`.otf` + `.ttf`) |
| Editorial serif      | **Brett** (205TF) | 400 regular                   | `205TF-Brett-Regular.otf/.ttf` |
| Marketing display    | **Gamuth Display**| 700 bold · 700 bold italic    | `GamuthDisplay-Bold`, `GamuthDisplay-BoldItalic` (`.otf` + `.ttf`) |
| Mono                 | Roboto Mono       | —                             | loaded from Google Fonts in preview cards |

## Where each face is used

- **Booton** is the workhorse. Everything in the product UI — buttons, chips, inputs, toasts, Underlord messages, labels, stepper, checkboxes, body paragraphs. `var(--font-sans)` maps to Booton.
- **Brett** is the editorial serif. Reserved for reflective documentation moments and the secondary display style (`.ds-editorial`). Avoid in product UI. `var(--font-serif)` maps to Brett.
- **Gamuth Display** is bold-only and for 48px+ marketing / cover display (`.ds-display`). Never use below 48px; never use for body copy. `var(--font-display)` maps to Gamuth Display.

`@font-face` declarations live at the top of `colors_and_type.css`.
