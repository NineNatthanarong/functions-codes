---
name: functions.codes
description: A private high-rise of client-side tools — dusk lobby, lit offices.
colors:
  tower: "#0c1222"
  tower-mid: "#161e33"
  ink: "#14213d"
  ink-2: "#0a0d14"
  mist: "#c9d1e0"
  stone: "#eef1f5"
  paper: "#ffffff"
  line: "#d5dce6"
  line-strong: "#b7c0ce"
  muted: "#4a5568"
  brass: "#fca311"
  brass-deep: "#d98a00"
  brass-soft: "#fde7c2"
  lamp: "#ffd27a"
typography:
  display:
    fontFamily: "Inter, IBM Plex Sans Thai, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 4.75rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Inter, IBM Plex Sans Thai, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Inter, IBM Plex Sans Thai, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, IBM Plex Sans Thai, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.011em"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.04em"
rounded:
  sm: "0px"
  md: "0px"
  lg: "0px"
  pill: "0px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "32px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.brass-deep}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
  input-search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "56px"
    padding: "0 20px"
  elevator-button:
    backgroundColor: "{colors.tower-mid}"
    textColor: "{colors.mist}"
    rounded: "{rounded.pill}"
    size: "44px"
  elevator-button-active:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    size: "44px"
  directory-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px 20px"
---

# Design System: functions.codes

## 1. Overview

**Creative North Star: "The Private Tower"**

A dusk high-rise drawn in pixels: 4px window grids, hard shadows, a brass elevator, a concierge desk. Tool pages are the offices upstairs with the lights on. Navy is the building. Brass is the lamp. Files stay in the briefcase (the browser).

**The Readable Pixel Rule.** Pixel is décor — skyline, frames, lamps, elevator. Type is never bitmap. Headings, body, forms, and Thai all use Inter + IBM Plex Sans Thai at ≥15px with ≥4.5:1 contrast. No Press Start, no 8px caps, no `image-rendering: pixelated` on text.

The system rejects cream-paper AI defaults, identical tool-card grids, WeWork pastel, neon cyberpunk, bounce, and unreadable pixel fonts.

**Key Characteristics:**
- Pixel architecture, human type
- Committed navy in the lobby; restrained stone in the offices
- One signature motion: the elevator ride
- Directory board, not a card grid
- Radius 0, hard 4px shadows, no blur
- Reduced-motion alternatives are designed, not stripped

## 2. Colors

Cool stone and tower navy. Brass is the only warm note — lamps, occupancy, primary actions.

### Primary
- **Tower Night** (#0c1222): Lobby atrium, footer, security desk, elevator car. The building after hours.
- **Ink Navy** (#14213d): Body text on stone, tool chrome, plaques.

### Secondary
- **Tungsten Brass** (#fca311): Lamps, active elevator floor, primary buttons, occupancy lights. On work floors it stays ≤10%. In the lobby it is allowed to read as lighting.

### Neutral
- **Cool Stone** (#eef1f5): Office floor / page background. Chroma toward navy, never toward cream.
- **Paper** (#ffffff): Desks, inputs, directory rows.
- **Muted Ink** (#4a5568): Secondary text on paper. Placeholders use this, not a lighter gray.
- **Lobby Mist** (#c9d1e0): Secondary text on tower night. Never use muted ink on the dark lobby — it will fail contrast.

### Named Rules
**The Cool Stone Rule.** Body background is cool, slightly navy-tinted stone. Cream, sand, bone, linen, parchment, ivory are forbidden.

**The Brass Lamp Rule.** Brass is light, not paint. It marks the current floor, the primary action, and occupancy. It is not a wash, a gradient fill, or a decorative stripe.

**The Two-Atmosphere Rule.** Lobby is dusk (tower). Offices are lit (stone + paper). Do not dark-mode image, color, or PDF tools.

## 3. Typography

**Display Font:** Inter (IBM Plex Sans Thai for Thai)
**Body Font:** Inter (IBM Plex Sans Thai for Thai)
**Label/Mono Font:** JetBrains Mono — floor IDs, room codes, LED, kbd

**Character:** One neo-grotesk family, Thai-capable, with mono as the building's signage system. No display serif in UI labels.

### Hierarchy
- **Display** (800, clamp 2.25rem–4.75rem, 1.02, -0.035em): Lobby headline only. Cap at 4.75rem. `text-wrap: balance`.
- **Headline** (700, ~2–2.75rem): Tool page titles, security desk.
- **Title** (600, 17–18px): Directory names, section titles.
- **Body** (400, 15px, 1.55): Leads, tool subtitles. Max ~70ch on prose.
- **Label** (500, 11px, mono, slight tracking): Floor IDs and room codes. Mixed case preferred; full uppercase only on the elevator LED.

### Named Rules
**The Signage Rule.** JetBrains Mono is for things that would be engraved or lit in a real building (L, 2.03, ⌘K). It is not a vibe overlay on paragraphs.

**The Heading Ceiling Rule.** No heading larger than 4.75rem. Letter-spacing never tighter than -0.04em.

## 4. Elevation

Tonal architecture first. Shadows are structural (desk lift, elevator depth), never colored glows.

### Shadow Vocabulary
- **Hairline** (`0 1px 0 rgba(12,18,34,0.04)`): directory rows at rest
- **Desk** (`0 8px 24px -8px rgba(12,18,34,0.14)`): reception search, concierge palette
- **Shaft** (`0 24px 60px -16px rgba(12,18,34,0.45)`): elevator car / doors

### Named Rules
**The No-Glow Rule.** No colored box-shadows, no neon, no ambient purple. Brass does not radiate.

## 5. Components

### Buttons
- **Shape:** Pill (999px) for actions; 10px for compact icon buttons.
- **Primary:** Brass on ink-2 text. Hover: brass-deep. Disabled: 40% opacity, no pointer.
- **Secondary:** Paper, 1px line-strong, ink text. Hover: ink border.
- **Focus:** 2px brass ring, 3px offset.

### Elevator
- Signature component. Vertical bank on desktop (sticky), horizontal button rail on mobile (sticky under nav).
- Circular 44px floor buttons. Active = brass lamp. Idle = tower-mid with mist number.
- LED at the top of the panel: tabular floor id + floor name.
- Doors overlay the directory only. Content behind the doors is already the destination list (never `opacity: 0` gated). Reduced motion: instant floor change, doors stay open.

### Directory
- Not a card grid. Rows like a lobby directory: room code, name, one-line job, occupancy lamp.
- On a specific floor, the first room may be a wider suite banner. On Lobby (all), rooms group under floor headers.
- Hover: paper stays paper; lamp brightens; name does not invert to white-on-navy.

### Inputs / Fields
- Paper field, 10–16px radius, line border. Focus: brass border + 2px brass/15% ring.
- Placeholder uses muted ink (#4a5568), never gray-on-white wash.

### Navigation
- Over the lobby at rest: transparent, mist/white type.
- Scrolled or on a tool page: stone bar, ink type, 1px line.
- Center readout is the current floor/room plaque, not a random trio of tool links.
- Command palette is the concierge desk: paper panel, room codes in rows, tower-night backdrop.

### Tool office
- Floor plaque + room code above the title. Back control reads as return to Lobby.
- Workspace is paper on stone. Related tools are “rooms on this floor.”

## 6. Do's and Don'ts

### Do:
- **Do** treat the elevator as the only signature gimmick and keep tool interiors quiet.
- **Do** use Cool Stone (#eef1f5) for office floors and Tower Night (#0c1222) for the lobby.
- **Do** ship a static, high-contrast lobby when `prefers-reduced-motion: reduce`.
- **Do** keep directory rows as a list with room codes — wayfinding, not a marketplace.
- **Do** write Thai first, then English, in the same dry concierge voice.

### Don't:
- **Don't** use identical icon + heading + description card grids.
- **Don't** use cream / sand / beige / bone / linen / parchment / ivory body backgrounds.
- **Don't** decorate with WeWork millennial pastel plants or cyberpunk neon Tokyo.
- **Don't** use gradient text, side-stripe borders, or glassmorphism as default chrome.
- **Don't** put tiny uppercase tracked eyebrows on every section.
- **Don't** number sections 01 / 02 / 03 unless the thing is actually a sequence the user must follow.
- **Don't** bounce or elastic-ease. No page-load choreography inside a tool.
- **Don't** delay opening a tool until an animation finishes.
- **Don't** dark-mode canvases where people judge color, crop, or type.
