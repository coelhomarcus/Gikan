# Gikan — Complete Application Redesign

Status: implementation in progress; the plan is being delivered incrementally.
Research date: September 18, 2026.
Code baseline: `eb54771`.

## 1. Objective and scope

Redesign every user-facing area of Gikan around a coherent, Linear-inspired product interface: restrained navigation, dense work views, clear hierarchy, consistent controls, and fast interaction. This includes layout and behavior, not only colors.

The result should feel like one focused application across Projects, Overview, Issues, Board, issue details, Documents, settings, authentication, search, and every overlay or feedback state.

This document remains the source of truth for the redesign. Implementation is being delivered incrementally; keep repository documentation and application copy in English.

### Product boundaries

- Projects remain the organizational unit; existing memberships and permissions remain authoritative.
- Issues retain public identifiers, existing routes, configured statuses, priorities, a single category/label, assignee, cycle, estimate, parent, relations, comments, and activity.
- Keep one primary document per project and the `/page` compatibility redirect.
- Preserve Gikan's name and identity. Linear is a reference for interaction and structure, not a source of logos or product branding.
- Keep the application predominantly black/near-black. Explore a very slight warm-neutral shift without turning it into a light gray or saturated interface.
- Use the existing React application and data contracts as the integration baseline, not a restriction on UI tooling. New dependencies, replacement primitives, and new component systems are allowed when they better support the target experience. React Aria/Untitled UI and other installed presentation libraries are not mandatory foundations.
- Retain Geist and Geist Mono as the starting typography direction. Adopt `lucide-react` as the primary interface icon library and replace the limited current icon selection with a broader, coherent catalog.
- Preserve the existing light/system theme capability, with dark as the primary design reference.
- Do not introduce workspaces, teams, Inbox, My Issues, milestones, saved views, multiple documents, attachments, AI tools, or real-time collaboration as part of this redesign.

Complete missing presentation and interactions for existing capabilities when required by a redesigned screen. Treat new backend capabilities separately and record them explicitly; do not create decorative controls for unsupported features.

## 2. Research and interpretation

The supplied ChatGPT material was reviewed alongside official Linear articles, product documentation, and reference images. Dimensions and colors proposed later in this document are Gikan design decisions, not official Linear tokens.

| Reference | Verified finding | Application to Gikan |
| --- | --- | --- |
| [2024 UI redesign](https://linear.app/now/how-we-redesigned-the-linear-ui) | Linear treated sidebar, tabs, headers, panels, and the surrounding application chrome as a coordinated system. It tested multiple view types before rollout. | Define shell and component behavior before migrating pages; validate list, board, detail, document, and settings together. |
| [March 2026 design refresh](https://linear.app/now/behind-the-latest-design-refresh) | Navigation became quieter, icons more restrained, separators softer, and the default palette slightly warmer and less saturated. | Give working content the strongest hierarchy; use near-black surface differences and selective separators. |
| [March 2026 changelog](https://linear.app/changelog/2026-03-12-ui-refresh) | Headers, navigation, and view controls were made more consistent across product areas. | Use predictable positions for location, view selection, filters, actions, and overflow menus. |
| [July 2026 issue sidebar update](https://linear.app/changelog/2026-07-23-agent-assisted-editing) | Issue properties were integrated more closely with the main content; Linear also placed its Diffs feature in that panel. | Build an integrated properties rail. Gikan has no Diffs feature, so do not reproduce that section. |
| [Display options](https://linear.app/docs/display-options) | Layout, grouping, ordering, and visible properties are separate from filtering. | Replace the row of native selects with Filter and Display popovers; maintain consistent state across List and Board. |
| [Board layout](https://linear.app/docs/board-layout) | Board is another layout for issues, with creation in context and compact issue information. | Keep existing statuses and drag-and-drop; show identifiers and selected metadata with restrained color. |
| [Peek preview](https://linear.app/docs/peek) | Linear Peek is a keyboard preview launched with Space, including temporary press-and-hold behavior. | Do not describe Gikan's editable click-to-open panel as an exact copy. Keep that existing workflow and document it as Gikan's issue panel. |
| [Project overview](https://linear.app/docs/project-overview) | Overview combines project context, properties, and resources. | Use a readable summary and compact facts rather than a dashboard of large statistic cards. |
| [Editor](https://linear.app/docs/editor) and [Documents](https://linear.app/docs/documents) | Formatting can be contextual, and projects and issues share editing conventions. Linear also has collaboration capabilities beyond Gikan's scope. | Share editor/renderer foundations; use selection formatting, searchable references, and explicit save feedback without promising live collaboration. |
| [Search](https://linear.app/docs/search) and [issue selection](https://linear.app/docs/select-issues) | Finding work and acting on focused issues are important navigation paths. | Evolve project search into a keyboard-accessible command menu, with clearly labeled search scope. |

Official visual references inspected:

- [Header layers: application, location, view, content](https://webassets.linear.app/images/ornj730p/production/b15d343ed41c5e938c26f9e2f5a61c7b63285caa-3904x2160.png).
- [Sidebar comparison](https://webassets.linear.app/images/ornj730p/production/b6d6be14c96978b10553cfb9205be1065087e793-3904x2720.png).
- [Issue properties reference](https://webassets.linear.app/images/ornj730p/production/fdbe518ba5882edab1681f7410f9af78716021f2-3600x2058.png).

These illustrations establish direction, not pixel measurements of a live application. The Gikan audit below is based on source inspection; baseline browser screenshots and interaction measurements belong to phase 0.

### Decisions beyond the supplied material

1. Preserve the existing project-based model. The sample sidebar in the attachment includes product areas Gikan does not have.
2. Keep Gikan's black identity and typography direction, but evaluate UI foundations on their fit for the new design rather than whether they are already installed. Preserve accessibility outcomes, not a particular library.
3. Use subtle borders for grouping, but visible focus indicators and readable secondary text. A dim navigation screenshot is not an accessibility specification.
4. Treat an editable issue panel and a read-only quick preview as different interactions. Only the editable panel is required here.
5. Redesign settings, authentication, error recovery, save states, and destructive actions with the same care as the main issue screen.
6. Include state consistency and draft preservation in the redesign: visual speed is insufficient when a property change resets an editor or leaves the board stale.

## 3. Current design audit

Paths in this table are relative to `apps/web/src/` unless otherwise noted.

| Area | Evidence in the current implementation | Required transformation |
| --- | --- | --- |
| Root shell | `components/layout/app-shell.tsx` uses `min-h-dvh`; pages independently choose `h-dvh` or `min-h-dvh`. | One viewport owner, one inset work surface, and explicit scroll ownership. |
| Sidebar | `sidebar.tsx` wraps `sidebar-navigation/sidebar-simple.tsx`, which uses a fixed 280px sidebar and an invisible spacing element. | Integrated 232px starting width, quieter project navigation, collapsible groups, independent scroll, mobile drawer. |
| Account area | `sidebar-account.tsx` renders a bordered account card with several controls. | Compact account row with a menu for profile/settings and sign out. |
| Headers | `topbar.tsx` is 64px high; `project-workspace-header.tsx` puts all view buttons and actions in a nonshrinking action area. | Separate location and view controls; handle long names and narrow widths without crowding. |
| Tokens | `styles/theme.css` already has extensive aliases, Geist fonts, dark/light palettes, radii, and shadows. | Consolidate semantic roles rather than layering a second unrelated theme over them. |
| Controls | `components/base/buttons/button.tsx` has large default icons, strong rings, and inset shadow treatments; issue filters use native selects. | Compact shared controls with consistent dimensions and accessible popovers. |
| Projects | `pages/projects-page.tsx` uses a grid of large bordered `ProjectCard` components and a dashed empty container. | Dense project index, restrained metadata, simple empty-state action. |
| Overview | `pages/project-overview-page.tsx` separates counts and links into multiple cards with display-size headings. | Project brief, lightweight status breakdown, cycle/estimate facts, and resources. |
| Issues list | `pages/project-issues-page.tsx` combines search and multiple native selects; rows use fixed 8rem metadata columns. | Full-width dense rows, coherent filtering/display controls, keyboard focus, and responsive properties. |
| Board | `card-item.tsx` does not render the public identifier; `columnTint` colors backgrounds and borders; creation still uses `CardModal`. | Neutral compact issue tiles, identifier-first metadata, shared quick create, visible drag targets. |
| Issue details | `issue-view.tsx` puts native property selects beneath a single-line title input and renders many separately bordered sections. | Multiline title, integrated properties rail, compact sub-issues/relations, unified activity and comments presentation. |
| Issue panel | The current panel is a fixed `aside`; loading/error paths return before its shell, and Escape is handled globally. | Stable panel shell for every state, layered dismissal, focus restoration, and route-aware close/full-page behavior. |
| Editor | `rich-text-editor.tsx` has a permanent toolbar, a browser prompt for links, and a hand-built mention popup. | Shared contextual formatting, accessible link/reference popovers, predictable read-only rendering and save states. |
| Documents | `project-documents-page.tsx` provides a bordered editor with an explicit Save button and resets local content when query data changes. | Document canvas, robust draft handling, keyboard saving, and visible pending/error feedback. |
| Project settings | `project-settings-modal.tsx` has General, Columns, Members, and Categories tabs. | Unified settings shell; use Statuses and Labels in UI copy; consistent panel width and action placement. |
| Account/admin settings | `user-settings-modal.tsx` combines profile form and admin backup download. | Redesign both; preserve admin-only access and distinguish profile saving from backup download. |
| Search | `project-search-modal.tsx` searches project names and Enter always opens the first match. | Explicit keyboard selection and a command menu with actions and honest result scope. |
| Context menus | `context-menu-provider.tsx` intercepts context menus globally and still uses `data-card-*` and “Copy card”. | Entity-scoped menus, accessible keyboard activation, native editing/link menus preserved. |
| Auth and 404 | Auth uses an independent centered form; 404 uses large display headings and oversized actions. | Same tokens, restrained typography, clear validation, compact recovery navigation. |
| Feedback | Most screens show plain loading text; mutation feedback is inconsistent. | Shared skeleton, empty, forbidden, not-found, save-failed, and retry patterns. |
| Legacy surfaces | `project-notes-page.tsx`, board adapters, card schemas/types, and CodeMirror remain alongside the issue model. | Trace imports and retire obsolete paths only after replacements are complete. |

### Behavior gaps to resolve with the affected screen

- Board uses a `cards` query key; the newer views invalidate `issues` keys. Establish one issue cache policy before relying on optimistic cross-view updates.
- Issue description/title drafts are reset by an effect on `issue`. A refetch after a property update can overwrite local edits; retain drafts by issue identity and dirty state.
- Documents have the same refetch-versus-draft risk. A save response must not replace text typed after submission.
- The current sub-issue count treats matching the parent's status as completion. Status records have no completion category. Show counts/status distributions until a real completion mapping exists; never infer completion from a name, color, or last column.
- The panel route stores `backgroundLocation` in history state. Verify refresh behavior explicitly; do not assume it disappears on reload.
- Relation and cycle APIs exist, but management UI is incomplete. Adding their scoped controls is UI completion, not evidence that the present product already exposes them.
- Retest the existing Tiptap fixes: one Link extension, no update loop, and no change event caused solely by read-only synchronization.

These are implementation work items, not claims that a browser regression test has already passed.

## 4. Target design system

### Visual direction

Use a nearly black outer frame, a slightly lighter work surface, and modest elevation for menus and dialogs. Main content gets the strongest text contrast. Navigation, metadata, and supporting actions use quieter but readable tones.

Use spacing and alignment to group related content. Reserve borders for boundaries that clarify interaction. Use status and label colors in small marks rather than coloring whole work areas. Keep primary actions identifiable without repeating bright buttons across the same screen.

### Starting color tokens

The following are proposed dark-mode starting values. Validate their actual rendered combinations before freezing them; opacity, selected backgrounds, and portal surfaces affect contrast.

| Role | Starting value | Use |
| --- | --- | --- |
| `app-bg` | `#0A0A0A` | Outer background; retains current black identity |
| `chrome` | `#101010` | Sidebar and surrounding frame |
| `surface-primary` | `#161615` | Main content inset |
| `surface-secondary` | `#1C1C1B` | Quiet grouped content |
| `surface-elevated` | `#242423` | Popovers, menus, dialogs |
| `surface-hover` | `#222221` | Hover over primary content |
| `surface-active` | `#2B2B29` | Persistent selection, distinct from hover |
| `text-primary` | `#EEEEEC` | Titles and working content |
| `text-secondary` | `#B5B5AF` | Navigation and supporting text |
| `text-tertiary` | `#96968F` | Metadata; do not reduce using extra opacity |
| `border-subtle` | `#2B2B29` | Decorative surface separation |
| `border-strong` | `#70706A` | Boundaries needed to identify controls |
| `accent` | `#8E96FF` | Limited emphasis, links, focus |
| `accent-solid` / `text-on-accent` | `#8E96FF` / `#101010` | Primary filled control with dark text |
| Semantic colors | Dedicated success/warning/error/info pairs | Text/icon plus meaning; never color alone |

The accent is a proposal for Gikan, not an extracted Linear brand value. Keep project/status/label colors stored in data, and adapt their rendering to the surface.

Map existing aliases such as `bg-primary`, `bg-secondary`, `text-primary`, `text-tertiary`, `ring-secondary`, and `outline-focus-ring` to the approved roles. Do not globally shrink existing `text-sm`/`text-md` values without reviewing their consumers. Add explicit UI density tokens and migrate deliberately.

Light mode gets corresponding semantic surfaces and readable text; do not reuse dark hex values or simply invert colors. Preserve stored theme choices and avoid a first-paint flash.

### Typography, sizing, and motion

| Element | Proposed default |
| --- | --- |
| UI/navigation | Geist, 13px / 18px, weight 400–500 |
| Metadata | 12px / 16px; 11px only for nonessential compact hints |
| Section heading | 14px / 20px, weight 500–600 |
| Page title | 20–24px / 28–32px |
| Issue title | 24px / 32px, multiline, weight 600 |
| Editor/document body | 15px / 24px; approximately 68–76 characters per line |
| Identifiers/code | Geist Mono, 12–13px; identifiers are metadata, not blue headings |
| Sidebar | 232px initial width; 220–260px calibration range |
| Location bar / view bar | 44px / 40px; tokenized and consistent |
| Sidebar row / issue row | 30px / 36px desktop; taller when content wraps |
| Controls | 24px compact, 28px standard, 32px prominent desktop; 40px form fields |
| Touch interactions | At least 44px target area as a Gikan design target |
| Icons | 14–16px, consistent weight; larger hit target than glyph |
| Spacing | 4, 8, 12, 16, 24, 32px; 2px only for optical alignment |
| Radius | 4px small, 6px controls, 8px panels, 10px dialogs |
| Shadow | None on rows/navigation; restrained elevation only on floating layers |
| Motion | 100ms hover, 140ms popover, up to 160ms panel; respect reduced motion |
| Layer order | Content 0, sticky 10, panel 30, dialog 40, nested popover 50, tooltip 60 |

Document tokens for code highlighting, selection, caret, error text, disabled controls, and drag overlays as well as the common surfaces. Keep portal components in the same theme context.

### Icon system and catalog

Adopt `lucide-react` for navigation, actions, properties, editor controls, settings, and feedback. Lucide exposes individually importable SVG components with configurable size, color, and stroke width. Use explicit imports for fixed interface icons so unused icons can be tree-shaken. [Official Lucide React documentation](https://lucide.dev/guide/react).

- Create a semantic icon registry: one consistent choice per destination/action, shared across sidebar, headers, menus, and keyboard hints. Review the complete mapping during foundations rather than reusing a few generic glyphs everywhere.
- Start with 14–16px interface icons and a consistent stroke weight, calibrated visually at actual size. Allow larger icons for project selection and empty states; a small navigation glyph does not imply a small click target.
- Expand the project icon picker substantially beyond the current selection, with searchable names/keywords, useful categories, selected state, and keyboard navigation. Expose a broad catalog rather than another tiny hard-coded list.
- Load the larger picker catalog on demand and paginate or virtualize results as needed; do not eagerly include the entire icon collection in the initial application bundle.
- Keep persisted project icon identifiers compatible through an explicit legacy mapping and fallback. Opening or editing a project must not silently replace its saved icon.
- Hide decorative glyphs from assistive technology; give icon-only controls accessible names and useful tooltips. Status and priority remain understandable without color alone.
- Migrate the existing interface icons screen by screen, then remove unused icon packages after an import audit. Avoid arbitrary mixing of icon families; deliberate exceptions such as brand logos or file-type artwork must have a documented role.

### UI library selection policy

The target design and interaction requirements determine the tools, not the current dependency list. Installing new UI libraries or replacing existing components is explicitly within the implementation scope. Existing components are candidates for reuse, not constraints on layout, appearance, or behavior.

During phase 1, evaluate alternatives such as Radix UI, Base UI, or shadcn/ui alongside the current primitives. These are evaluation candidates, not a decision to install them all. Validate current documentation, compatibility, licensing, maintenance, and bundle impact before selecting packages. Also allow focused libraries for command menus, pickers, virtualization, and motion when they solve a demonstrated requirement.

Prototype a nested dialog/popover, a searchable property picker, the command menu, and a mobile sheet against the proposed tokens. Compare keyboard/focus behavior, screen-reader support, styling freedom, touch behavior, React compatibility, implementation effort, and performance. Record the chosen foundation and the migration rationale before propagating it across screens.

Prefer one coherent primitive foundation for overlapping controls, with focused additions where useful. Do not ship several competing dialog/menu systems without a specific reason. Preserve behavior and data contracts during replacements, test accessibility again, and remove superseded dependencies once their consumers have migrated. The implementation may install or replace packages when that materially improves the target experience; the current product uses React Aria primitives, Tiptap, and Lucide as its active foundations.

### Accessibility constraints

Target at least 4.5:1 for normal informative text, including inactive navigation destinations and placeholder text. The lower contrast of the shell must not make text unreadable. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

Use 24×24 CSS pixels as the baseline minimum pointer target, with larger touch targets; exceptions in the standard are not a reason to make routine controls tiny. [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

All controls need visible keyboard focus, accessible names, and status/priority meaning beyond color. Preserve or improve focus management and dismissal behavior whether retaining React Aria or replacing it. Validate screen-reader reading order, zoom at 200%, reduced motion, and keyboard-only operation.

## 5. Target application architecture

Keep one shell mounted across authenticated routes. It owns viewport height and the main content inset; route components fill the available area.

```text
AppShell
├── AppSidebar / MobileNavigationDrawer
│   ├── Gikan identity + Search + New issue
│   ├── Projects index
│   ├── Project groups and current-project links
│   └── Account menu
├── ContentInset
│   ├── LocationBar: location, breadcrumbs, contextual actions
│   ├── ViewBar: project tabs and view-specific controls
│   └── RouteContent: one explicit scroll owner
│       ├── ProjectIndex / ProjectOverview
│       ├── IssueList / IssueBoard
│       ├── IssueDetail: IssueMain + IssueProperties
│       └── ProjectDocument
└── OverlayHost
    ├── IssuePanel: same IssueDetail body
    ├── CommandMenu / QuickCreate / SettingsDialog
    └── ConfirmDialog / contextual popovers / feedback
```

This tree is the proposed Gikan composition, not a diagram of Linear's internals.

### Shell and scroll contract

- Root uses `h-dvh`, `min-h-0`, `min-w-0`, and controlled overflow. Remove page-level viewport heights inside the authenticated shell.
- Desktop content has a 4–6px outer inset and small radius; sidebar remains part of the surrounding chrome.
- Sidebar and route body scroll independently. Location and view bars remain visible.
- Lists and Documents have one vertical scroll container each. The Board owns horizontal scrolling and each column owns its vertical issue scroll; do not wrap it in another horizontal scroller.
- Issue main content scrolls; the properties rail remains visible when space allows. The issue panel manages its own scrolling.
- Popovers render through the overlay system and avoid clipping by the inset. Small windows and the virtual keyboard must not hide submit/save controls.
- Only one `main` landmark per route composition; nested detail surfaces use sections/regions.

### Navigation and routing contract

Preserve `/`, `/login`, `/register`, project Overview, Issues, Board, Documents, issue detail URLs, and the `/page` redirect. No route rewrite or entity migration is required for the visual system.

Keep Overview, Issues, Board, and Documents as visible project destinations. Issues and Board use the same work-view controls and data. Project settings remain accessible from the project header; account settings remain in the account menu.

When opening an issue from a collection, preserve filters, sorting, focused row, and scroll. Click opens the editable issue panel and updates the URL. “Open full page” removes the background state. Direct navigation/new tab/reload renders the full page; implement and test reload handling explicitly. Closing a panel returns to the captured origin, while closing a directly loaded page has a safe project-issues fallback.

An open picker consumes Escape before its parent panel. Dialogs trap focus and make their background inert. The desktop issue panel is a labeled nonmodal region with explicit focus entry/return; the mobile full-screen sheet is modal. Losing membership or authentication must close protected overlays as well as their underlying route.

### Component ownership

- `components/layout/`: shell, sidebar, content inset, location/view bars, responsive navigation.
- `components/base/`: implement the chosen Button, IconButton, Input, Select/Combobox, Menu, Tooltip, Avatar, Badge, Tabs, and Checkbox primitives; reuse, replace, or install foundations according to the phase-1 evaluation.
- `components/overlay/`: one consistent dialog/sheet, confirmation, command, and entity context-menu system.
- `components/feedback/`: skeletons, empty state, inline error/retry, mutation and save status.
- `features/issues/`: issue row/tile, detail body, properties, quick create, activity, comments, parent/relations controls, canonical query keys.
- `features/projects/`: project rows, overview sections, navigation, project creation and settings.
- Shared rich-text presentation: one extension configuration, one renderer, and scoped editor variants for description, comment, and document.

Use composition rather than a single configurable component handling every screen. Keep the existing folder conventions; retire duplicate wrappers once consumers have migrated.

## 6. Screen-by-screen redesign specification

### 6.1 Global navigation and search

Create a compact identity row with Search and New issue actions. Project groups show only real destinations; expand the current project and persist collapse preference locally. A compact account menu replaces the framed account card.

Evolve `ProjectSearchModal` into a command menu: projects, current-project issues, and available commands in labeled groups. Use arrow selection, Enter, Escape, loading, no-results, and unavailable-action states. Initially search the existing project collection and the active project's issues; do not label this as workspace-wide or full-text search. A future global issue search requires a dedicated API, not one request per project.

### 6.2 Project index and creation

Replace the large tile grid with a compact project list: icon, name, key, short description, repository action, and updated metadata where available. Avoid fetching every project's issues just to decorate the index with counts.

Keep one clear New project action. Redesign creation around name, optional issue key, description, repository URL, and icon picker. Show key-format/uniqueness failures inline, preserve inputs after errors, and focus the created project after success. Empty state offers creation with a short explanation.

### 6.3 Project Overview

Use a project title, concise description, repository/document resources, compact per-status counts, active cycle, and total estimate. Lay out facts in aligned rows instead of nested statistic cards. Do not invent project health, deadlines, velocity, or a completion percentage that the current model cannot support.

At large widths, use a quiet metadata rail; at smaller widths, place facts below the summary. Links into Issues and Board retain the project context and may preselect a status filter.

### 6.4 Issues list

Use a full-width working list with 36px desktop rows. Leading status icon, muted public ID, and title are the stable columns. Priority, assignee, label, cycle, and estimate follow with consistent alignment. Keep long titles readable through truncation plus full detail access.

Filter opens a searchable popover for existing status/priority/assignee/label/cycle fields. Applied filters become removable chips. Display controls ordering, grouping by status/assignee/cycle, and visible metadata. Group headers show counts and collapse without losing selection.

Store filter/sort/group state in URL parameters so opening/closing a panel and browser navigation preserve context. Keep purely visual property visibility in scoped local preferences; do not introduce saved-view entities. Define a deterministic fallback for invalid query parameters.

Rows support keyboard focus and arrow navigation, Enter to open the panel, and an explicit link/open action for a full page or new tab. Mobile keeps ID/title/status visible and moves secondary properties to a second line or detail view. No body-wide horizontal scroll.

### 6.5 Board

Use restrained column headers with status marker, title, count, and creation/overflow actions. Tiles show public ID, title, compact priority/label information, assignee avatar, and estimate when enabled. Default to neutral surfaces; status color belongs primarily to its marker.

Preserve configured columns, ordering, and drag positions. Keep the existing pointer drag behavior, add keyboard or property-picker equivalents, distinguish click from drag, show insertion feedback, and roll back failed moves visibly.

Use the same quick-create component as the list, prefilled with the column's status. Keep the board grouped by status initially because cross-column movement already has that meaning. If sorting is not manual, disable manual reordering or explicitly switch to manual before a move; never silently corrupt ordering.

### 6.6 Issue page and editable panel

Share one detail body between full page and panel. Put the identifier and breadcrumb in the location area; show copy link, open full page, and overflow actions consistently.

The main column contains a multiline inline title, description, compact sub-issue and relation sections, and activity/comments. A 240–280px properties rail contains status, priority, assignee, label, cycle, estimate, parent, and read-only project/creator/timestamps. Property pickers show current value, search where useful, clear/unassigned options, pending feedback, and errors.

Panel width starts around 720px on a sufficiently wide desktop; responsive layout depends on the panel's available width, not just the viewport. Collapse properties into an accessible disclosure when the main text column would become cramped. On mobile use the full-screen sheet.

Add focused same-project parent/relation pickers backed by existing endpoints. Show related issues as navigable links with readable relationship direction. Sub-issues show counts and statuses; a completion progress bar remains blocked on a reliable completion definition.

Present activity and comments in a coherent timeline, with actor, readable before/after values, timestamps, and author-only comment actions. Preserve backend activity immutability. Put Delete in overflow, require confirmation, and explain the existing sub-issue restriction when deletion is rejected.

### 6.7 Rich text and Documents

Define editor variants: minimal comment composer, inline issue description, and full document canvas. Share JSON persistence and read-only styles. Read-only content must remain selectable and links navigable, while editing and checklist changes are disabled.

Provide contextual formatting with an accessible toolbar fallback. Add slash formatting for supported blocks and a link popover replacing `window.prompt`. Reference suggestions use the active project's permitted users/issues plus available projects, clearly labeled by type. Support keyboard selection, asynchronous data updates, and safe text rendering; do not interpolate user names into HTML.

Documents become a readable canvas with project context and a quiet save indicator. Keep one document; no fake file tree or multiple-document controls. Explicit Save and Cmd/Ctrl+S remain available. Add debounced autosave for descriptions/documents only after draft protection and ordered saves exist. Comments require explicit submission; Enter inserts a newline and Cmd/Ctrl+Enter submits.

Save states: Saved, Unsaved changes, Saving, Save failed with retry. Preserve edits on errors, refetches, route changes, and panel-to-page transitions. Revalidate Tiptap normalization of empty documents, undo/redo, focus, selection, paste, code blocks, checklist rendering, and read-only mode. Code uses the dark surface system and legible syntax colors; no legacy CodeMirror surface is carried into the new document UI.

### 6.8 Settings and administration

Use one settings layout with a section navigation rail and consistent full-width content region. On mobile it becomes a full-screen sheet with an accessible section selector. Start with a wide dialog rather than inventing new settings routes.

| Section | Content and behavior |
| --- | --- |
| Project General | Name, key, description, repository, icon; explain key locking; form uses the same width as every other section. |
| Statuses | Existing Columns data, rename/color/reorder/create/delete; retain restrictions on deleting a populated status. |
| Members | Invite by username, roles, membership rows, remove confirmation, readable permission failures. |
| Labels | Existing Categories data and single-label issue behavior; name/color/create/delete, respecting current ownership rules. |
| Cycles | Complete management UI for the existing API: name, period, status, creation/update/delete; preserve owner permissions. |
| Account | Name/avatar editing, username/email display, theme preference using the existing provider, save feedback. |
| Administration | Existing admin-only database backup download with pending/failure feedback; do not claim restore UI exists. |

Use aligned label/control columns on desktop, stacked fields on mobile, short helper text, and consistent save placement. Color and icon pickers use the same popover styling. Avoid stacked dialogs when a property picker can handle the action locally.

### 6.9 Login, registration, and recovery

Use the same surfaces, type scale, inputs, focus, and buttons as the authenticated app. Preserve all registration fields and the special-code flow. Support password managers, keyboard submission, validation messages, loading, and session-expiry feedback.

Redesign 404, forbidden, deleted issue, unavailable project, network error, and initial authentication loading states. Offer the appropriate retry/back/projects action; distinguish lack of access from an empty collection without exposing protected information.

### 6.10 Menus, overlays, and feedback

Standardize quick create, project creation, confirmations, dropdowns, filters, display options, property pickers, tooltip placement, and context menus. Items are 28–32px high on desktop; keep adequate touch targets.

Use entity context menus on issue/project rows and tiles. Preserve the native menu for links, text selections, inputs, and Tiptap editing. Keep copy link/identifier/title actions consistent across entry points.

Loading should retain the surrounding layout with matching skeletons. Empty states distinguish no data from no filter results. Failures keep the user's inputs and selection. Avoid repeated toast notifications for routine autosaves; use inline save status.

## 7. Interaction and responsive contracts

### Keyboard behavior

| Context | Behavior |
| --- | --- |
| Application navigation | Cmd/Ctrl+K opens commands outside rich-text editing; provide a visible trigger everywhere. |
| Rich-text editor | Cmd/Ctrl+K edits a link; do not steal formatting shortcuts for global navigation. |
| List/menu | Up/Down moves focused item; Enter activates it; scrolling follows focus. |
| Nested overlays | Escape closes only the topmost layer, then restores focus to its trigger. |
| Documents/descriptions | Cmd/Ctrl+S saves dirty content and prevents browser Save Page. |
| Comment composer | Cmd/Ctrl+Enter submits; plain Enter remains a newline. |
| Global quick create | Optional `C` outside inputs/editors, with visible equivalent and a project picker when context is missing. |

Space keeps its normal role for focused buttons and checkboxes. A Linear-style hold-to-preview mode is a separate future enhancement, not required for the current editable panel. Do not intercept browser find, history, or typing shortcuts without a scoped reason.

### Responsive behavior

- At 1280px and above: sidebar, content inset, full view controls, and a properties rail where the content container is wide enough.
- Between 768px and 1279px: collapsible sidebar; combine secondary actions under overflow; keep the title and primary action visible.
- Below 768px: sidebar drawer, full-width content surface, issue/settings sheets, simplified rows, and popovers constrained to the viewport.
- At every size: one understandable scroll path, multiline titles, no clipped actions, and working virtual-keyboard behavior.
- Test at 360, 390, 768, 1024, 1440, and 1920px widths, including short-height windows. Container size determines detail layout when a panel is open.

## 8. Data and implementation guardrails

1. Establish canonical issue queries/mutations for list, board, panel, full page, and overview. Optimistic changes update relevant views and restore prior state on failure; invalidate activity and parent detail when needed.
2. Keep editor drafts keyed by entity and field. Refetch updates clean fields only. Serialize/debounce saves and ignore stale responses for newer drafts. Do not imply multi-user conflict resolution without server version support.
3. Use existing endpoints and permissions. Do not change hard deletion, issue numbering, key immutability, or membership rules as an incidental styling change.
4. Confirm exposed relation directions and lifecycle responses before building UI around them. UI copy cannot compensate for incorrect API semantics.
5. Retire `BoardCard`, `CardModal`, `cards` query names, and obsolete adapters as each consumer migrates. The same entity should not have two incompatible frontend representations.
6. Preserve `categoryId`/`columnId` API names while standardizing visible copy to Label/Status. Avoid an unnecessary database rename.
7. Remove unreachable `ProjectNotesPage` and unused CodeMirror/Markdown dependencies only after an import audit. Preserve legacy content in storage and keep compatibility redirects tested.
8. Keep the latest Tiptap loop/extension fixes intact. No editor recreation on ordinary keystrokes and no duplicate extension names.
9. Visual changes need no database migration. If a model gap requires one, separate it from the visual rollout and test it against an isolated PostgreSQL database. Typecheck/build are not migration validation.
10. Add automated tests where behavior is at risk: drafts, query synchronization, route/panel history, permission failures, editor update loops. Use visual review for routine reversible styling.

## 9. Implementation phases and review gates

Work in reviewable vertical slices. Tokens and primitives come first, then every screen migrates. Do not mark a phase complete based only on compilation.

| Phase | Deliverables | Exit gate |
| --- | --- | --- |
| 0 — Baseline and reference | Capture current routes/overlays at desktop and mobile; inventory reachable components, roles, and workflows. Build representative seed data and a screen/state checklist. | Current behavior and screenshots recorded, including known gaps; no claim that missing features already work. |
| 1 — Foundations | Evaluate and select UI libraries with interaction prototypes; record dependency and migration decisions. Finalize tokens, type, density, states, radius, motion, and layers. Adopt Lucide, define semantic icon mappings and the expanded picker strategy. Build a development-only component review surface. | Library choice is justified by design and behavior, not existing installation; contrast, focus, icon consistency, and bundle strategy reviewed. |
| 2 — Shell and navigation | Implement sidebar/content inset, location/view bars, responsive drawer, account menu, and scroll contracts. | Existing routes work inside the shell; long names and narrow windows fit; no double headers or unintended document scrolling. |
| 3 — Primitives and commands | Migrate common controls, dialogs, pickers, confirmations, command/search navigation, skeletons, and errors. | Keyboard/dismissal/return-focus behavior validated, including nested popovers and editor shortcuts. |
| 4 — Issues and Board | Unify issue cache/model, redesign list, filters/display, grouping, board tiles, and shared quick create; retire card adapters. | Same issue values appear immediately in both views; drag rollback and keyboard alternatives work; public IDs are visible. |
| 5 — Issue detail and panel | Build shared detail body/properties rail, navigation, draft protection, activity/comments, relations/parent controls, delete confirmation. | Panel/full-page parity, reload/back behavior, permissions, and draft preservation pass browser checks. |
| 6 — Editor and Documents | Contextual formatting, link/reference pickers, renderer variants, document canvas, save coordinator and save states. | Empty/long/code/checklist documents round-trip; no console loops; rapid typing during saves is preserved. |
| 7 — Projects and all settings | Project index/create/overview, General/Statuses/Members/Labels/Cycles, account/theme/admin backup. | All existing actions remain accessible; General fills the content region; permission states match the API. |
| 8 — Auth and remaining states | Login, registration, auth loading, 404/forbidden/offline errors, remaining overlays and copy. | No reachable screen or state retains the former visual system. |
| 9 — Visual QA and release | Compare screenshots, review responsive/keyboard use, remove unused styles/dependencies, complete automated checks and staging smoke test. | Acceptance checklist complete; no outstanding blocking visual or data-loss regression. |

Use a temporary development/staging switch only if comparing old/new shell behavior is needed. Keep it internal and remove it after acceptance. Do not maintain two production designs permanently.

## 10. Validation and acceptance

### Required test data

Use an isolated development/staging environment with empty and populated projects, long names and issue titles, varied statuses/colors, missing assignees, many labels, cycles, estimates, parents/children, bidirectional relations, and long activity/comment histories. Include Unicode text, multiline titles, empty documents, code blocks, checklists, and link/mention content.

Exercise owner, ordinary member, comment author, admin, unauthenticated, and nonmember scenarios. Simulate slow and failing requests while edits are in progress.

### Completion checklist

- [ ] Every routed screen, reachable settings section, modal, popover, menu, tooltip, and error/empty/loading state uses the new system.
- [ ] Dark mode remains near-black and comfortable; supported light/system modes are coherent.
- [ ] No unintended body overflow, clipped controls, duplicate scrollbars, or panel content below the virtual keyboard.
- [ ] Same header positions, spacing, icon scale, focus styling, and feedback vocabulary throughout the application.
- [ ] Lucide is the primary interface icon family; the expanded project picker is searchable and keyboard accessible, existing saved icons resolve correctly, and its full catalog does not inflate initial loading.
- [ ] UI dependencies follow the recorded foundation decision; replacements preserve accessibility and obsolete competing implementations are removed.
- [ ] Board tiles and list rows show public identifiers; status/priority are understandable without color alone.
- [ ] Filters, sort, focused row, and scroll survive issue-panel navigation; direct links and refresh show full pages.
- [ ] Issue/property mutations update list, board, detail, overview, and activity consistently, with visible failure recovery.
- [ ] Description/document/comment drafts survive unrelated updates and failed saves; closing or leaving dirty content offers a clear save/discard path.
- [ ] Tiptap has no duplicate extensions or React update loops; read-only checklists cannot mutate content.
- [ ] Keyboard flow, focus restoration, nested Escape, reduced motion, screen-reader labels, contrast, and 200% zoom are verified.
- [ ] Existing auth, membership, ownership, comment authorship, status restrictions, and hard-delete rules remain enforced.
- [ ] General settings uses the same available content width as other sections at all target sizes.
- [ ] No placeholder features, fabricated metrics, fake completion percentages, or decorative actions without behavior.
- [ ] Legacy card names and obsolete editor surfaces are removed from active product paths; compatibility links still work.
- [ ] No app-origin console errors during the core workflows; browser-extension errors are separated during QA.
- [ ] Build and typecheck pass; relevant behavioral tests and browser smoke tests pass with recorded evidence.

Required commands at the integration gate:

```bash
pnpm -r typecheck
pnpm build
git diff --check
```

Add targeted browser/component tests during implementation; the repository does not currently provide a dedicated redesign test suite. Record the actual commands used, screenshot locations, tested viewport/theme/role combinations, and remaining issues per phase. Check the production bundle and interaction responsiveness against the phase-0 baseline; lazy-load heavy editing screens if measurement shows a regression.

Deploy only after reviewing the built application in staging. Keep a known-good frontend/API image for rollback and avoid coupling the visual launch to unrelated schema work.

## 11. Definition of done

The redesign is complete when the entire reachable application presents one consistent interaction and visual system, retains existing data and permissions, and passes the screen/state checklist in a real browser. A successful build or a redesigned Issues page alone does not complete this plan.

The first implementation slice is phase 0 followed by tokens, shared primitives, and the shell. Use Projects, Issues, Board, full issue/panel, Documents, Settings, and Login as the reference screens before propagating the design everywhere.
