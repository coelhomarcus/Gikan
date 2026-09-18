# UI scale

The active application uses a compact, dark-only control scale inspired by shadcn/Base UI.

| Component | Sizes | Standard classes |
| --- | --- | --- |
| Button | xs / sm / md / lg / xl | `h-8` / `h-9` / `h-10` / `h-11` / `h-12`, with `px-3` through `px-6` |
| Icon button | xs / sm / md / lg / xl | `size-7` / `size-8` / `size-9` / `size-10` / `size-11` |
| Input, Select, Combobox | sm / md / lg | `h-8` / `h-9` / `h-10`, `px-3` |
| Icons in controls | default | `size-4` |

Use `controlScale` and `controlTokens` from `control-scale.ts` for shared primitives. Related controls use `gap-2`, sections use `gap-4`, and major blocks use `gap-6`. Compact cards use `p-4`; standard cards and dialogs use `p-6`.

All new UI must keep the existing dark semantic color tokens and visible focus rings. Arbitrary spacing or radius values should be reserved for a documented, component-specific visual requirement.
