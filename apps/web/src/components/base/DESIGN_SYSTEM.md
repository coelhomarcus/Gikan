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

## Composition patterns

- Use `Field`, `FieldLabel`, `FieldDescription`, and `FieldError` for grouped form controls. Keep the field stack at `gap-2` and field groups at `gap-4`.
- Use `ToggleGroupRoot` and `ToggleGroupItem` for mutually related formatting or filter controls instead of styling independent buttons as a group.
- Keep overlays and menus on the Base UI primitives so focus management, Escape, portals, and keyboard navigation remain consistent.
- Use `Sheet` for controlled side panels such as Issue Peek. It owns the backdrop, viewport, dialog title, focus handling, and mobile full-screen behavior.
- Use `data-icon="inline-start"` and `data-icon="inline-end"` for Button icons. Standalone utility buttons use `data-icon` on the icon itself.

## Rich text

`RichTextEditor` is a shared Tiptap composition. Editable instances use a sticky top toolbar, a selection BubbleMenu, and `/` commands. Documents, descriptions, and comments opt into the `document`, `description`, or `comment` variant. Read-only instances do not mount editing controls and must keep task list controls inert.

Project icon selection is a searchable, keyboard-navigable palette. Persist semantic project icon keys, not Lucide component names, so the visual catalog can evolve without invalidating stored projects.
