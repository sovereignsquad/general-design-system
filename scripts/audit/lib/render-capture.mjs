// The Phase-1 render classifier, shared verbatim (issue 583's architecture note: the
// covering-array runner changes WHICH cells run and in what order, never what a cell
// measures). Extracted from backward-trace.mjs when the runner became its second consumer —
// two copies of a classifier are two classifiers.

const TRACKED = [
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
  'padding-top', 'padding-left', 'row-gap', 'column-gap',
  'font-size', 'font-weight', 'letter-spacing',
  'color', 'background-color', 'border-top-color', 'border-top-width',
  'box-shadow', 'transition-duration', 'transition-timing-function',
  'outline-width', 'outline-color',
];

const absoluteUrlFor = (baseUrl, route) => `${baseUrl}${route}`;

/** Captures the theme's resolved token map + every element's tracked properties. */
const CAPTURE = `(() => {
  // 1. Resolve every custom property to COMPUTED form via a probe element, so
  //    '#7c3aed' and 'rgb(124, 58, 237)' compare equal, and '2rem' and '32px' do.
  const names = new Set();
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules } catch { continue }
    const walk = rs => { for (const r of rs) { if (r.style) for (const p of r.style) if (p.startsWith('--')) names.add(p); if (r.cssRules) walk(r.cssRules); } };
    walk(rules);
  }
  const inline = el => { if (el) for (const p of el.style) if (p.startsWith('--')) names.add(p); };
  inline(document.documentElement); inline(document.body);
  document.querySelectorAll('[style*="--"]').forEach(inline);

  const probe = document.createElement('div');
  probe.style.position = 'absolute'; probe.style.visibility = 'hidden';
  document.body.appendChild(probe);

  const tokenIndex = {};   // computedValue -> [tokenName]
  const tokenValues = {};  // tokenName -> computedValue
  // Probe EVERY category a token could belong to. A token only indexes into the
  // categories where it actually resolves, so a colour token never pollutes the
  // duration index and vice versa.
  const PROBES = [
    ['color', 'color'], ['paddingTop', 'paddingTop'], ['transitionDuration', 'transitionDuration'],
    ['transitionTimingFunction', 'transitionTimingFunction'], ['boxShadow', 'boxShadow'],
    ['fontWeight', 'fontWeight'], ['letterSpacing', 'letterSpacing'], ['borderTopWidth', 'borderTopWidth'],
    // TRACKED below also checks font-size, the four border-*-radius corners, and
    // row-gap/column-gap, none of which shared a value space with any probe above — a
    // font-size-only token, a radius-only token, or a gap-only token could never appear in
    // the index (issue 625/627: the same instrument-gap class as the theme-matrix oracle,
    // found in this "already-complete" classifier while investigating why #627's Phase 1
    // re-run ran hot). borderTopLeftRadius and rowGap stand in for all four radius corners
    // and both gap axes: the match is on the resolved VALUE string, not the property name,
    // so one length-valued probe per category covers every property that shares its value
    // space.
    ['fontSize', 'fontSize'], ['borderTopLeftRadius', 'borderTopLeftRadius'], ['rowGap', 'rowGap'],
  ];
  const INERT = new Set(['0px', 'rgba(0, 0, 0, 0)', 'none', 'normal', '0s', 'auto', '400', '']);
  for (const name of names) {
    const declared = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const cands = [declared];
    for (const [set, read] of PROBES) {
      probe.style[set] = '';
      probe.style[set] = 'var(' + name + ')';
      const got = getComputedStyle(probe)[read];
      probe.style[set] = '';
      if (got) cands.push(String(got).trim());
    }
    for (const cand of cands) {
      if (!cand || INERT.has(cand)) continue;
      (tokenIndex[cand] ||= []).push(name);
    }
    tokenValues[name] = declared;
  }
  probe.remove();

  // 2. Sweep every visible element.
  const TRACKED = ${JSON.stringify(TRACKED)};
  const UA_DEFAULTS = new Set(['0px','normal','none','auto','rgba(0, 0, 0, 0)','0s','currentcolor','medium','400','0s, 0s','0px 0px 0px 0px']);
  const observations = [];
  const els = [...document.querySelectorAll('*')];
  for (const el of els) {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    for (const prop of TRACKED) {
      const value = cs.getPropertyValue(prop);
      if (!value) continue;
      if (UA_DEFAULTS.has(value.trim().toLowerCase())) continue;
      // outline-width/-color are INERT while outline-style is none: the UA default width
      // ('medium', computing to 3px) sits on every unfocused element painting nothing, and
      // counting it accused 1,800+ elements per page of an untraceable design value that does
      // not exist (issue 625's first-cell analysis — the verification-layer defect class, again).
      if ((prop === 'outline-width' || prop === 'outline-color') && cs.getPropertyValue('outline-style') === 'none') continue;
      // Mantine's ScrollArea ships its own static scrollbar geometry/transition in
      // ScrollArea.css ('padding: calc(--scrollarea-scrollbar-size / 5)', 'transition:
      // ... 150ms ease') as a literal in Mantine's shipped stylesheet — GDS's theme has no
      // ScrollArea component override at all, so there is no token for these to trace to,
      // and none should be invented: this is browser-chrome geometry, not a design decision
      // (issue 625). Scoped to the two ScrollArea internal classes, not a blanket exemption
      // for padding/transition anywhere else.
      if (
        (prop === 'padding-top' || prop === 'padding-left' || prop === 'transition-duration' || prop === 'transition-timing-function')
        && typeof el.className === 'string' && /\\bmantine-ScrollArea-(scrollbar|thumb)\\b/.test(el.className)
      ) continue;
      // Multi-value shorthands compute as comma lists ('0.12s, 0.12s'). Match each
      // part: a value is token-derived only if EVERY part resolves to a token.
      const parts = value.trim().includes(',') && /^[^(]*$|s,|ease|cubic/.test(value)
        ? value.split(',').map(x => x.trim()).filter(Boolean)
        : [value.trim()];
      const partHits = parts.map(p => tokenIndex[p]);
      const hit = partHits.every(Boolean) ? partHits[0] : undefined;
      observations.push({
        prop,
        value: value.trim(),
        provenance: hit ? 'token' : 'literal',
        token: hit ? hit[0] : undefined,
        sel: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).slice(0,2).join('.') : ''),
      });
    }
  }
  return { tokenCount: Object.keys(tokenValues).length, observations };
})()`;



/**
 * Chunked execution of the SAME classifier, for pages whose full sweep kills the renderer.
 *
 * Found by the covering array (issue 583): `/api` — excluded from Phase 1's four routes — dies
 * under the monolithic CAPTURE regardless of theme, locale, or emulation; the tab OOMs holding
 * every element's observations at once. The prep step builds the token index exactly as
 * CAPTURE does and parks it on the page; each sweep call then classifies one element slice
 * with the same TRACKED list, the same UA-defaults filter, and the same provenance rule, so a
 * chunked capture and a monolithic capture measure identically — only the transport differs.
 */
export const CAPTURE_PREP = `(() => {
  const names = new Set();
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules } catch { continue }
    const walk = rs => { for (const r of rs) { if (r.style) for (const p of r.style) if (p.startsWith('--')) names.add(p); if (r.cssRules) walk(r.cssRules); } };
    walk(rules);
  }
  const inline = el => { if (el) for (const p of el.style) if (p.startsWith('--')) names.add(p); };
  inline(document.documentElement); inline(document.body);
  document.querySelectorAll('[style*="--"]').forEach(inline);
  const probe = document.createElement('div');
  probe.style.position = 'absolute'; probe.style.visibility = 'hidden';
  document.body.appendChild(probe);
  const tokenIndex = {}; const tokenValues = {};
  const PROBES = [
    ['color', 'color'], ['paddingTop', 'paddingTop'], ['transitionDuration', 'transitionDuration'],
    ['transitionTimingFunction', 'transitionTimingFunction'], ['boxShadow', 'boxShadow'],
    ['fontWeight', 'fontWeight'], ['letterSpacing', 'letterSpacing'], ['borderTopWidth', 'borderTopWidth'],
    // TRACKED below also checks font-size, the four border-*-radius corners, and
    // row-gap/column-gap, none of which shared a value space with any probe above — a
    // font-size-only token, a radius-only token, or a gap-only token could never appear in
    // the index (issue 625/627: the same instrument-gap class as the theme-matrix oracle,
    // found in this "already-complete" classifier while investigating why #627's Phase 1
    // re-run ran hot). borderTopLeftRadius and rowGap stand in for all four radius corners
    // and both gap axes: the match is on the resolved VALUE string, not the property name,
    // so one length-valued probe per category covers every property that shares its value
    // space.
    ['fontSize', 'fontSize'], ['borderTopLeftRadius', 'borderTopLeftRadius'], ['rowGap', 'rowGap'],
  ];
  const INERT = new Set(['0px', 'rgba(0, 0, 0, 0)', 'none', 'normal', '0s', 'auto', '400', '']);
  for (const name of names) {
    const declared = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const cands = [declared];
    for (const [set, read] of PROBES) {
      probe.style[set] = ''; probe.style[set] = 'var(' + name + ')';
      const got = getComputedStyle(probe)[read]; probe.style[set] = '';
      if (got) cands.push(String(got).trim());
    }
    for (const cand of cands) { if (!cand || INERT.has(cand)) continue; (tokenIndex[cand] ||= []).push(name); }
    tokenValues[name] = declared;
  }
  probe.remove();
  window.__gdsAuditTokenIndex = tokenIndex;
  window.__gdsAuditEls = document.querySelectorAll('*').length;
  return { tokenCount: Object.keys(tokenValues).length, elements: window.__gdsAuditEls };
})()`;

export const captureSweepChunk = (start, end) => `(() => {
  const tokenIndex = window.__gdsAuditTokenIndex || {};
  const TRACKED = ${JSON.stringify(TRACKED)};
  const UA_DEFAULTS = new Set(['0px','normal','none','auto','rgba(0, 0, 0, 0)','0s','currentcolor','medium','400','0s, 0s','0px 0px 0px 0px']);
  let total = 0; let literal = 0;
  const els = [...document.querySelectorAll('*')].slice(${start}, ${end});
  for (const el of els) {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    for (const prop of TRACKED) {
      const value = cs.getPropertyValue(prop);
      if (!value) continue;
      if (UA_DEFAULTS.has(value.trim().toLowerCase())) continue;
      // Same inert-outline rule as CAPTURE — the two forms must classify identically.
      if ((prop === 'outline-width' || prop === 'outline-color') && cs.getPropertyValue('outline-style') === 'none') continue;
      // Same Mantine ScrollArea internal-geometry exemption as CAPTURE (issue 625) — see there.
      if (
        (prop === 'padding-top' || prop === 'padding-left' || prop === 'transition-duration' || prop === 'transition-timing-function')
        && typeof el.className === 'string' && /\\bmantine-ScrollArea-(scrollbar|thumb)\\b/.test(el.className)
      ) continue;
      const parts = value.trim().includes(',') && /^[^(]*$|s,|ease|cubic/.test(value)
        ? value.split(',').map(x => x.trim()).filter(Boolean)
        : [value.trim()];
      const partHits = parts.map(p => tokenIndex[p]);
      const hit = partHits.every(Boolean) ? partHits[0] : undefined;
      total += 1; if (!hit) literal += 1;
    }
  }
  return { total, literal };
})()`;

export { TRACKED, CAPTURE, absoluteUrlFor };
