# AGENTS.md

This repo is a very small static personal site.

## Site structure

- `/` is the homepage.
- `/links` is the links page.
- Root homepage source: `index.html`
- Links page source: `links/index.html`
- Link data source: `links.js`
- Custom domain is configured via `CNAME`.

## Current design intent

- Keep the site extremely minimal, text-first, and fast.
- White background, black or near-black text.
- No cards, no colorful buttons, no decorative graphics, no heavy branding.
- Avoid startup-style hero sections and unnecessary animation.
- Preserve the quiet, understated, literate feel.

## Homepage rules

- The homepage should stay minimal.
- Current intent: show only `angad gogia` in lowercase.
- Keep the homepage visually sparse.
- Do not add extra copy, lists, or sections unless explicitly asked.

## Links page rules

- The links page is the main curated page.
- Add or remove links by editing `links.js`.
- Keep the rendering logic simple; do not introduce frameworks unless explicitly requested.
- Prefer the existing plain list presentation.
- Do not add categories or subsections unless explicitly requested.

## Link formatting rules

- Preserve the current manual ordering unless the user explicitly asks to reorder.
- Titles should generally use the site's existing capitalization style:
  sentence case by default, while preserving proper nouns, official titles, and user-specified capitalization.
- Notes should stay short and understated.
- Notes currently follow this style:
  `, a post by ...`
  `, an essay by ...`
  `, a clip on YouTube.`
- If the user gives an exact title, use it.
- When possible, use the actual page/video title rather than inventing one.
- Remove obvious tracking/referrer parameters from pasted URLs when possible.

## Working style

- Do not work directly on `main` for exploratory edits if a branch can be used first.
- Make small, targeted changes.
- Do not introduce complexity unless the user asks for it.
- If the user asks to publish, merge into `main` and push.
- If the user asks to clean up branches, delete all non-`main` branches.

## Things to avoid

- Do not redesign the site without being asked.
- Do not add large headers, bios, navigation, or extra sections to the homepage.
- Do not reorganize the links into themes or clusters unless explicitly requested.
- Do not switch to a framework or build system unless explicitly requested.
