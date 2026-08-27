import './style.css';
import {
  checkCommand,
  checkHotspot,
  checkOrdered,
  makeId,
  newDrill,
  practiceOrder,
  starterDrills,
  validateDrill,
  type Drill,
  type DrillKind,
  type HotspotDrill
} from './lib';

type View = 'home' | 'edit' | 'play' | 'privacy' | 'terms';
type Feedback = { tone: 'success' | 'error' | 'info'; message: string } | null;
type Run = { drillId: string; attempts: number; completedAt: string };

const mount = document.querySelector<HTMLDivElement>('#app');
if (!mount) throw new Error('App mount is missing');
const app: HTMLDivElement = mount;

let library = loadDrills();
let runs = loadRuns();
let view: View = routeView();
let draft: Drill | null = null;
let active: Drill | null = null;
let playItems: string[] = [];
let attemptCount = 0;
let feedback: Feedback = null;
let hotspotCursor = { x: 50, y: 50 };
let completed = false;

render();
bindGlobalEvents();

function render(): void {
  const main = view === 'home' ? homeView() : view === 'edit' ? editorView() : view === 'play' ? playerView() : legalView(view);
  app.innerHTML = `${headerView()}${main}${footerView()}<div class="toast-region" id="toast" aria-live="polite"></div>`;
  document.title = titleForView();
}

function headerView(): string {
  return `<header class="site-header">
    <a class="brand" href="/" data-nav="home" aria-label="Skill Drill Studio home">
      <svg viewBox="0 0 36 36" aria-hidden="true"><path d="m4 28 9-17 7 11 4-7 8 13"/><circle cx="13" cy="11" r="2.4"/></svg>
      <span>Skill Drill <em>Studio</em></span>
    </a>
    <nav aria-label="Main navigation">
      <a href="/#examples" data-nav="home">Examples</a>
      <button class="quiet-button" type="button" data-import-trigger>Import JSON</button>
      <button class="primary small" type="button" data-new="ordered">Build a drill</button>
    </nav>
    <label class="visually-hidden" for="import-file">Import a drill JSON file</label><input class="visually-hidden" id="import-file" type="file" accept="application/json,.json" tabindex="-1" />
  </header>`;
}

function homeView(): string {
  return `<main id="main">
    <section class="hero" aria-labelledby="hero-title">
      <picture class="hero-art">
        <source media="(max-width: 700px)" srcset="/assets/night-workshop-800.webp" />
        <img src="/assets/night-workshop-1280.webp" width="1280" height="853" alt="A blue-hour cliffside observatory with three warm work stations connected by a lit path." fetchpriority="high" />
      </picture>
      <div class="hero-shade"></div>
      <div class="hero-copy">
        <p class="eyebrow"><span></span> Practice, made active</p>
        <h1 id="hero-title">Build the path.<br />Then walk it.</h1>
        <p>Turn one small procedural skill into a short browser drill. Immediate, deterministic feedback—without accounts, setup, or executing a single command.</p>
        <div class="hero-actions">
          <button class="primary" type="button" data-scroll="types">Make your first drill <span aria-hidden="true">→</span></button>
          <button class="secondary" type="button" data-play="sample-command">Try a 30-second drill</button>
        </div>
        <p class="local-note"><span aria-hidden="true">⌂</span> Everything stays in this browser until you export it.</p>
      </div>
      <ol class="trail" aria-label="Four steps to share a drill">
        <li><b>01</b> Choose</li><li><b>02</b> Make</li><li><b>03</b> Test</li><li><b>04</b> Share</li>
      </ol>
    </section>

    <section class="types section-shell" id="types" aria-labelledby="types-title">
      <div class="section-intro"><p class="eyebrow"><span></span> Three focused formats</p><h2 id="types-title">What should they practise?</h2><p>Choose the shape that matches the action. You can test it as a learner before sharing.</p></div>
      <div class="type-grid">
        ${typeCard('ordered', 'Route', 'Ordered steps', 'Put a process, sequence, or safety check in the right order.', routeIcon())}
        ${typeCard('command', 'Terminal', 'Exact command', 'Recall an exact command, formula, shortcut, or line of syntax.', commandIcon())}
        ${typeCard('hotspot', 'Field map', 'Image hotspot', 'Find the right control, region, tool, or part of an image.', hotspotIcon())}
      </div>
    </section>

    <section class="examples section-shell" id="examples" aria-labelledby="examples-title">
      <div class="section-intro row"><div><p class="eyebrow"><span></span> Ready for a test walk</p><h2 id="examples-title">Your drill shelf</h2></div><p>${library.length ? `${library.length} locally saved ${library.length === 1 ? 'drill' : 'drills'}` : 'Start from scratch or import a JSON file.'}</p></div>
      ${shelfView()}
    </section>

    <section class="promise section-shell" aria-label="Product promises">
      <p class="quote">“Small enough to make before class.<br />Clear enough to repeat until it sticks.”</p>
      <ul><li><strong>No command execution</strong><span>Answers are compared as plain text.</span></li><li><strong>Portable by design</strong><span>One JSON file. No account required.</span></li><li><strong>Built for every route</strong><span>Keyboard, touch, and screen reader paths.</span></li></ul>
    </section>
  </main>`;
}

function typeCard(kind: DrillKind, label: string, title: string, body: string, icon: string): string {
  return `<article class="type-card"><div class="type-art ${kind}">${icon}<span>${label}</span></div><h3>${title}</h3><p>${body}</p><button class="text-action" type="button" data-new="${kind}">Build this drill <span aria-hidden="true">→</span></button></article>`;
}

function shelfView(): string {
  const all = [...library, ...starterDrills];
  return `<div class="shelf">${all.map((drill) => `<article class="shelf-item">
    <div class="shelf-mark ${drill.kind}" aria-hidden="true">${drill.kind === 'ordered' ? '01↕' : drill.kind === 'command' ? '>_' : '⌖'}</div>
    <div><p class="meta">${labelKind(drill.kind)}${drill.id.startsWith('sample-') ? ' · Example' : ''}</p><h3>${escapeHtml(drill.title)}</h3><p>${escapeHtml(drill.instructions)}</p>
      <div class="item-actions"><button class="secondary small" type="button" data-play="${escapeAttr(drill.id)}">Practise</button>${!drill.id.startsWith('sample-') ? `<button class="quiet-button" type="button" data-edit="${escapeAttr(drill.id)}">Edit</button><button class="quiet-button" type="button" data-export="${escapeAttr(drill.id)}">Export</button><button class="danger-button" type="button" data-delete="${escapeAttr(drill.id)}">Delete</button>` : ''}</div>
    </div></article>`).join('')}</div>`;
}

function editorView(): string {
  if (!draft) return emptyView('No drill is open', 'Choose a format to begin.', 'Choose a format');
  return `<main id="main" class="studio-main">
    <div class="studio-heading"><div><p class="eyebrow"><span></span> Make the route</p><h1>${draft.title ? `Editing “${escapeHtml(draft.title)}”` : `New ${labelKind(draft.kind).toLowerCase()} drill`}</h1><p>Plain text only. Your work saves to this browser when you choose “Save & test”.</p></div><button class="quiet-button" type="button" data-nav="home">Close editor</button></div>
    <ol class="progress" aria-label="Authoring progress"><li class="done"><b>1</b> Choose</li><li class="current" aria-current="step"><b>2</b> Make</li><li><b>3</b> Test</li><li><b>4</b> Share</li></ol>
    <form id="drill-form" class="editor" novalidate>
      <div class="form-panel">
        <div class="panel-heading"><div><p class="meta">Drill basics</p><h2>Set the scene</h2></div><span class="autosave-note">Local only</span></div>
        <label for="title">Drill title <span aria-hidden="true">*</span></label><input id="title" name="title" maxlength="120" required value="${escapeAttr(draft.title)}" placeholder="e.g. Restart the field radio" />
        <label for="instructions">Learner instructions <span aria-hidden="true">*</span></label><textarea id="instructions" name="instructions" maxlength="500" required placeholder="Tell the learner what to do in one clear sentence.">${escapeHtml(draft.instructions)}</textarea>
      </div>
      ${kindFields(draft)}
      <div class="form-error" id="form-error" role="alert"></div>
      <div class="editor-actions"><button class="secondary" type="button" data-nav="home">Cancel</button><button class="primary" type="submit">Save & test <span aria-hidden="true">→</span></button></div>
    </form>
  </main>`;
}

function kindFields(drill: Drill): string {
  if (drill.kind === 'ordered') return `<fieldset class="form-panel"><legend><span class="meta">Correct route</span><strong>Add steps in the right order</strong></legend><p class="field-help">Learners receive these shuffled. Use the arrow buttons to adjust your answer key.</p><div id="step-list">${drill.items.map((item, index) => stepField(item, index, drill.items.length)).join('')}</div><button class="secondary small" type="button" data-add-step>+ Add a step</button></fieldset>`;
  if (drill.kind === 'command') return `<div class="form-panel"><div class="panel-heading"><div><p class="meta">Exact response</p><h2>Write the prompt and answer</h2></div><span class="terminal-symbol" aria-hidden="true">&gt;_</span></div><label for="prompt">Prompt <span aria-hidden="true">*</span></label><textarea id="prompt" name="prompt" maxlength="500" required placeholder="e.g. Create a folder named field-notes">${escapeHtml(drill.prompt)}</textarea><label for="answer">Exact accepted answer <span aria-hidden="true">*</span></label><input class="code-input" id="answer" name="answer" maxlength="500" required value="${escapeAttr(drill.answer)}" autocomplete="off" spellcheck="false" /><label class="check-row"><input name="caseSensitive" type="checkbox" ${drill.caseSensitive ? 'checked' : ''} /><span>Require matching uppercase and lowercase letters</span></label><p class="safety-note"><span aria-hidden="true">◇</span> Learner input is compared as text and is never executed.</p></div>`;
  return `<div class="form-panel"><div class="panel-heading"><div><p class="meta">Target image</p><h2>Mark the right place</h2></div><span class="target-symbol" aria-hidden="true">⌖</span></div><p class="field-help">Upload a PNG, JPEG, or WebP under 2 MB, or use the sample. Select the image to place the target.</p><label class="file-button" for="image-upload">Choose an image</label><input class="visually-hidden" id="image-upload" name="image-upload" type="file" accept="image/png,image/jpeg,image/webp" /><label for="imageAlt">Image description <span aria-hidden="true">*</span></label><input id="imageAlt" name="imageAlt" maxlength="300" required value="${escapeAttr(drill.imageAlt)}" /><div class="author-hotspot"><button class="hotspot-canvas" type="button" data-author-hotspot aria-label="Place target on image"><img src="${escapeAttr(drill.image)}" alt="${escapeAttr(drill.imageAlt)}" /><span class="target-ring" style="left:${drill.target.x}%;top:${drill.target.y}%;width:${drill.target.radius * 2}%;aspect-ratio:1" aria-hidden="true"></span></button></div><label for="radius">Target size: <output id="radius-output">${drill.target.radius}%</output></label><input id="radius" name="radius" type="range" min="3" max="30" value="${drill.target.radius}" /></div>`;
}

function stepField(item: string, index: number, total: number): string {
  return `<div class="step-row"><span class="step-number">${index + 1}</span><label class="visually-hidden" for="step-${index}">Step ${index + 1}</label><input id="step-${index}" name="steps" maxlength="240" required value="${escapeAttr(item)}" placeholder="Step ${index + 1}"/><button type="button" class="icon-button" data-step-up="${index}" aria-label="Move step ${index + 1} up" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" class="icon-button" data-step-down="${index}" aria-label="Move step ${index + 1} down" ${index === total - 1 ? 'disabled' : ''}>↓</button><button type="button" class="icon-button remove" data-step-remove="${index}" aria-label="Remove step ${index + 1}" ${total <= 2 ? 'disabled' : ''}>×</button></div>`;
}

function playerView(): string {
  if (!active) return emptyView('No drill is open', 'Choose a saved or example drill to practise.', 'Browse drills');
  const runNumber = runs.filter((run) => run.drillId === active!.id).length + (completed ? 0 : 1);
  return `<main id="main" class="player-main">
    <div class="player-top"><button class="quiet-button back" type="button" data-nav="home">← Back to studio</button><p>Run ${runNumber} <span aria-hidden="true">·</span> ${labelKind(active.kind)}</p></div>
    <article class="drill-stage">
      <div class="stage-heading"><p class="eyebrow"><span></span> Test walk</p><h1>${escapeHtml(active.title)}</h1><p>${escapeHtml(active.instructions)}</p></div>
      ${completed ? completionView(active) : playControl(active)}
      <div class="feedback ${feedback?.tone ?? ''}" id="feedback" aria-live="assertive">${feedback ? `<span aria-hidden="true">${feedback.tone === 'success' ? '✓' : feedback.tone === 'error' ? '!' : 'i'}</span><p>${escapeHtml(feedback.message)}</p>` : ''}</div>
    </article>
    <aside class="privacy-strip"><span aria-hidden="true">◇</span><div><strong>Safe practice space</strong><p>Answers are checked in your browser. Commands are never run or sent anywhere.</p></div></aside>
  </main>`;
}

function playControl(drill: Drill): string {
  if (drill.kind === 'ordered') return `<section class="play-control" aria-labelledby="task-title"><div class="task-heading"><h2 id="task-title">Arrange the steps</h2><p>Use the arrow buttons to put them in the correct order.</p></div><ol class="order-list">${playItems.map((item, index) => `<li><span>${escapeHtml(item)}</span><button type="button" class="icon-button" data-play-up="${index}" aria-label="Move ${escapeAttr(item)} up" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" class="icon-button" data-play-down="${index}" aria-label="Move ${escapeAttr(item)} down" ${index === playItems.length - 1 ? 'disabled' : ''}>↓</button></li>`).join('')}</ol><button class="primary wide" type="button" data-check-order>Check my route</button>`;
  if (drill.kind === 'command') return `<form id="command-form" class="play-control"><div class="task-heading"><h2>${escapeHtml(drill.prompt)}</h2><p>Enter one exact answer. Spaces and ${drill.caseSensitive ? 'letter case' : 'wording'} matter.</p></div><label for="command-attempt">Your answer</label><div class="command-entry"><span aria-hidden="true">$</span><input class="code-input" id="command-attempt" name="attempt" required autocomplete="off" autocapitalize="none" spellcheck="false" autofocus /></div><button class="primary wide" type="submit">Check command</button></form>`;
  return `<section class="play-control"><div class="task-heading"><h2>Choose the target</h2><p>Select the image, or use arrow keys to move the crosshair and Enter to check.</p></div><button class="hotspot-canvas playable" type="button" data-play-hotspot aria-label="Interactive image: ${escapeAttr(drill.imageAlt)}. Use arrow keys to move the crosshair, then press Enter."><img src="${escapeAttr(drill.image)}" alt="${escapeAttr(drill.imageAlt)}" /><span class="cursor" style="left:${hotspotCursor.x}%;top:${hotspotCursor.y}%" aria-hidden="true"></span></button><p class="keyboard-help">Keyboard: arrow keys move by 5%; Shift + arrow moves by 1%.</p></section>`;
}

function completionView(drill: Drill): string {
  const drillRuns = runs.filter((run) => run.drillId === drill.id);
  const latest = drillRuns.at(-1);
  const first = drillRuns[0];
  const improvement = drillRuns.length >= 3 && first && latest ? first.attempts - latest.attempts : null;
  return `<section class="completion"><div class="success-orbit" aria-hidden="true">✓</div><p class="meta">Route complete</p><h2>You found the path.</h2><p>Completed in <strong>${latest?.attempts ?? attemptCount} ${latest?.attempts === 1 ? 'attempt' : 'attempts'}</strong>.</p>${improvement !== null ? `<p class="improvement">${improvement > 0 ? `Your third run used ${improvement} fewer ${improvement === 1 ? 'attempt' : 'attempts'} than your first.` : improvement === 0 ? 'Your first and third runs used the same number of attempts.' : 'Repeat once more and aim for a cleaner route.'}</p>` : `<p class="muted">Complete three runs to compare your first and third attempts.</p>`}<div class="completion-actions"><button class="primary" type="button" data-restart>Walk it again</button><button class="secondary" type="button" data-export="${escapeAttr(drill.id)}">Export drill</button>${library.some((item) => item.id === drill.id) ? `<button class="quiet-button" type="button" data-edit="${escapeAttr(drill.id)}">Edit drill</button>` : ''}</div></section>`;
}

function legalView(which: 'privacy' | 'terms'): string {
  const privacy = which === 'privacy';
  return `<main id="main" class="legal section-shell"><p class="eyebrow"><span></span> Field notes</p><h1>${privacy ? 'Privacy' : 'Terms of use'}</h1><p class="lede">Effective 27 August 2026</p>${privacy ? `<h2>Your drills stay with you</h2><p>Skill Drill Studio has no accounts, analytics, advertising, or tracking. Drills and practice run counts are stored only in your browser using local storage. Uploaded images are converted to a local data URL and are not sent to us.</p><h2>What leaves your device</h2><p>Nothing is transmitted by the app. When you export or share a JSON file, you choose where that copy goes. Clearing site data in your browser removes locally saved drills and run history.</p><h2>Hosting logs</h2><p>Our static hosting provider may process short-lived request logs for security and reliability. We do not use them to profile learners.</p>` : `<h2>A practical, free tool</h2><p>You may use Skill Drill Studio to create and share drills. The software is provided as-is, without warranties. Keep a copy of important JSON files because browser storage can be cleared.</p><h2>Safe and lawful content</h2><p>Only upload images and write material you have permission to use. Do not use the tool to distribute unlawful or harmful content. Learner-entered commands are compared as text and never executed.</p><h2>Your work</h2><p>You keep ownership of the drill content you author. The application source is available under the MIT License.</p>`}<p><a href="/" data-nav="home">Return to the studio</a></p></main>`;
}

function footerView(): string {
  return `<footer><div><a class="brand footer-brand" href="/" data-nav="home">Skill Drill Studio</a><p>Short, repeatable practice for procedural skills.</p></div><nav aria-label="Legal"><a href="/privacy" data-nav="privacy">Privacy</a><a href="/terms" data-nav="terms">Terms</a><a href="https://github.com/B-Divyesh/sf-skill-drill-studio" rel="noreferrer">Source</a></nav><p class="art-credit">Night workshop artwork generated for this product · No tracking</p></footer>`;
}

function bindGlobalEvents(): void {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const nav = target.closest<HTMLElement>('[data-nav]');
    if (nav) { event.preventDefault(); navigate(nav.dataset.nav as View); return; }
    const create = target.closest<HTMLElement>('[data-new]');
    if (create) { startNew(create.dataset.new as DrillKind); return; }
    const play = target.closest<HTMLElement>('[data-play]');
    if (play) { startPlay(play.dataset.play ?? ''); return; }
    const edit = target.closest<HTMLElement>('[data-edit]');
    if (edit) { startEdit(edit.dataset.edit ?? ''); return; }
    const exportButton = target.closest<HTMLElement>('[data-export]');
    if (exportButton) { exportDrill(exportButton.dataset.export ?? ''); return; }
    const remove = target.closest<HTMLElement>('[data-delete]');
    if (remove) { deleteDrill(remove.dataset.delete ?? ''); return; }
    if (target.closest('[data-import-trigger]')) { document.querySelector<HTMLInputElement>('#import-file')?.click(); return; }
    if (target.closest('[data-scroll="types"]')) { document.querySelector('#types')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' }); return; }
    if (target.closest('[data-add-step]')) { syncDraft(); if (draft?.kind === 'ordered' && draft.items.length < 12) draft.items.push(''); renderEditorKeepingFocus('steps'); return; }
    const stepUp = target.closest<HTMLElement>('[data-step-up]');
    if (stepUp) { moveDraftStep(Number(stepUp.dataset.stepUp), -1); return; }
    const stepDown = target.closest<HTMLElement>('[data-step-down]');
    if (stepDown) { moveDraftStep(Number(stepDown.dataset.stepDown), 1); return; }
    const stepRemove = target.closest<HTMLElement>('[data-step-remove]');
    if (stepRemove) { removeDraftStep(Number(stepRemove.dataset.stepRemove)); return; }
    const playUp = target.closest<HTMLElement>('[data-play-up]');
    if (playUp) { movePlayStep(Number(playUp.dataset.playUp), -1); return; }
    const playDown = target.closest<HTMLElement>('[data-play-down]');
    if (playDown) { movePlayStep(Number(playDown.dataset.playDown), 1); return; }
    if (target.closest('[data-check-order]')) { submitOrder(); return; }
    if (target.closest('[data-restart]')) { restartPlay(); return; }
    const authorHotspot = target.closest<HTMLElement>('[data-author-hotspot]');
    if (authorHotspot && event instanceof MouseEvent) placeAuthorHotspot(authorHotspot, event);
    const playHotspot = target.closest<HTMLElement>('[data-play-hotspot]');
    if (playHotspot && event instanceof MouseEvent) submitHotspotFromPointer(playHotspot, event);
  });

  document.addEventListener('submit', (event) => {
    event.preventDefault();
    if ((event.target as HTMLFormElement).id === 'drill-form') saveAndTest();
    if ((event.target as HTMLFormElement).id === 'command-form') submitCommand(event.target as HTMLFormElement);
  });

  document.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    if (input.id === 'import-file' && input.files?.[0]) importDrill(input.files[0]);
    if (input.id === 'image-upload' && input.files?.[0]) loadHotspotImage(input.files[0]);
  });

  document.addEventListener('input', (event) => {
    const input = event.target as HTMLInputElement;
    if (input.id === 'radius' && draft?.kind === 'hotspot') {
      draft.target.radius = Number(input.value);
      const output = document.querySelector<HTMLOutputElement>('#radius-output');
      const ring = document.querySelector<HTMLElement>('.target-ring');
      if (output) output.value = `${input.value}%`;
      if (ring) ring.style.width = `${Number(input.value) * 2}%`;
    }
  });

  document.addEventListener('keydown', (event) => {
    const canvas = (event.target as HTMLElement).closest<HTMLElement>('[data-play-hotspot]');
    if (!canvas || !active || active.kind !== 'hotspot') return;
    const step = event.shiftKey ? 1 : 5;
    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      if (event.key === 'ArrowLeft') hotspotCursor.x = Math.max(0, hotspotCursor.x - step);
      if (event.key === 'ArrowRight') hotspotCursor.x = Math.min(100, hotspotCursor.x + step);
      if (event.key === 'ArrowUp') hotspotCursor.y = Math.max(0, hotspotCursor.y - step);
      if (event.key === 'ArrowDown') hotspotCursor.y = Math.min(100, hotspotCursor.y + step);
      updateCursor();
    }
    if (event.key === 'Enter') { event.preventDefault(); submitHotspot(hotspotCursor.x, hotspotCursor.y); }
  });

  window.addEventListener('popstate', () => { view = routeView(); render(); });
  window.addEventListener('online', () => showToast('Back online. Your local drills are ready.'));
  window.addEventListener('offline', () => showToast('You’re offline. Saved drills still work here.'));
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}

function startNew(kind: DrillKind): void { draft = newDrill(kind); view = 'edit'; setPath('/studio'); render(); focusMain(); }
function startEdit(id: string): void { const found = findDrill(id); if (!found) return; draft = structuredClone(found); view = 'edit'; setPath('/studio'); render(); focusMain(); }
function startPlay(id: string): void { const found = findDrill(id); if (!found) return; active = structuredClone(found); restartPlay(); view = 'play'; setPath('/play'); render(); focusMain(); }

function restartPlay(): void {
  if (!active) return;
  const runIndex = runs.filter((run) => run.drillId === active!.id).length;
  playItems = active.kind === 'ordered' ? practiceOrder(active.items, runIndex) : [];
  attemptCount = 0; feedback = null; completed = false; hotspotCursor = { x: 50, y: 50 };
  if (view === 'play') { render(); focusMain(); }
}

function saveAndTest(): void {
  syncDraft();
  if (!draft) return;
  try {
    const clean = validateDrill(draft);
    const index = library.findIndex((item) => item.id === clean.id);
    if (index >= 0) library[index] = clean; else library.unshift(clean);
    persistDrills();
    active = structuredClone(clean);
    view = 'play'; setPath('/play'); restartPlay(); render(); focusMain();
  } catch (error) {
    const box = document.querySelector<HTMLElement>('#form-error');
    if (box) box.textContent = error instanceof Error ? error.message : 'Complete the required fields.';
    document.querySelector<HTMLElement>(':invalid')?.focus();
  }
}

function syncDraft(): void {
  const form = document.querySelector<HTMLFormElement>('#drill-form');
  if (!form || !draft) return;
  const data = new FormData(form);
  draft.title = String(data.get('title') ?? '');
  draft.instructions = String(data.get('instructions') ?? '');
  if (draft.kind === 'ordered') draft.items = data.getAll('steps').map(String);
  if (draft.kind === 'command') { draft.prompt = String(data.get('prompt') ?? ''); draft.answer = String(data.get('answer') ?? ''); draft.caseSensitive = data.has('caseSensitive'); }
  if (draft.kind === 'hotspot') { draft.imageAlt = String(data.get('imageAlt') ?? ''); draft.target.radius = Number(data.get('radius')); }
}

function moveDraftStep(index: number, direction: number): void { syncDraft(); if (!draft || draft.kind !== 'ordered') return; const next = index + direction; if (next < 0 || next >= draft.items.length) return; [draft.items[index], draft.items[next]] = [draft.items[next]!, draft.items[index]!]; renderEditorKeepingFocus(`step-${next}`); }
function removeDraftStep(index: number): void { syncDraft(); if (!draft || draft.kind !== 'ordered' || draft.items.length <= 2) return; draft.items.splice(index, 1); renderEditorKeepingFocus(`step-${Math.max(0, index - 1)}`); }
function renderEditorKeepingFocus(idOrName: string): void { render(); (document.getElementById(idOrName) ?? document.querySelector<HTMLElement>(`[name="${idOrName}"]`))?.focus(); }

function movePlayStep(index: number, direction: number): void { const next = index + direction; if (next < 0 || next >= playItems.length) return; [playItems[index], playItems[next]] = [playItems[next]!, playItems[index]!]; feedback = null; render(); document.querySelector<HTMLElement>(`[data-play-${direction < 0 ? 'up' : 'down'}="${next}"]`)?.focus(); }
function submitOrder(): void { if (!active || active.kind !== 'ordered') return; attemptCount += 1; if (checkOrdered(active.items, playItems)) completeRun(); else { const correct = active.items.filter((item, index) => item === playItems[index]).length; feedback = { tone: 'error', message: `Not yet. ${correct} of ${active.items.length} positions are correct. Adjust the route and try again.` }; render(); document.querySelector<HTMLElement>('[data-check-order]')?.focus(); } }
function submitCommand(form: HTMLFormElement): void { if (!active || active.kind !== 'command') return; const value = String(new FormData(form).get('attempt') ?? ''); attemptCount += 1; if (checkCommand(active, value)) completeRun(); else { feedback = { tone: 'error', message: `That is not an exact match. Check ${active.caseSensitive ? 'capitalization, spaces, and punctuation' : 'spaces and punctuation'}, then try again.` }; const field = form.querySelector<HTMLInputElement>('input'); if (field) { field.setAttribute('aria-invalid', 'true'); field.select(); } renderFeedback(); } }

function placeAuthorHotspot(canvas: HTMLElement, event: MouseEvent): void { syncDraft(); if (!draft || draft.kind !== 'hotspot') return; const point = relativePoint(canvas, event); draft.target.x = point.x; draft.target.y = point.y; const ring = canvas.querySelector<HTMLElement>('.target-ring'); if (ring) { ring.style.left = `${point.x}%`; ring.style.top = `${point.y}%`; } showToast(`Target placed at ${Math.round(point.x)}%, ${Math.round(point.y)}%.`); }
function submitHotspotFromPointer(canvas: HTMLElement, event: MouseEvent): void { const point = relativePoint(canvas, event); hotspotCursor = point; submitHotspot(point.x, point.y); }
function submitHotspot(x: number, y: number): void { if (!active || active.kind !== 'hotspot') return; attemptCount += 1; if (checkHotspot(active.target, x, y)) completeRun(); else { feedback = { tone: 'error', message: 'That is outside the target area. Look again and choose a different spot.' }; render(); document.querySelector<HTMLElement>('[data-play-hotspot]')?.focus(); } }

function completeRun(): void { if (!active) return; runs.push({ drillId: active.id, attempts: attemptCount, completedAt: new Date().toISOString() }); runs = runs.slice(-150); persistRuns(); completed = true; feedback = { tone: 'success', message: 'Correct. Route complete.' }; render(); document.querySelector<HTMLElement>('[data-restart]')?.focus(); }

function relativePoint(element: HTMLElement, event: MouseEvent): { x: number; y: number } { const rect = element.getBoundingClientRect(); return { x: clamp(((event.clientX - rect.left) / rect.width) * 100), y: clamp(((event.clientY - rect.top) / rect.height) * 100) }; }
function updateCursor(): void { const cursor = document.querySelector<HTMLElement>('.cursor'); if (cursor) { cursor.style.left = `${hotspotCursor.x}%`; cursor.style.top = `${hotspotCursor.y}%`; } }

async function loadHotspotImage(file: File): Promise<void> {
  if (!draft || draft.kind !== 'hotspot') return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2_000_000) { showFormError('Choose a PNG, JPEG, or WebP image smaller than 2 MB.'); return; }
  draft.image = await readAsDataUrl(file); draft.target = { x: 50, y: 50, radius: draft.target.radius }; syncDraft(); render(); document.querySelector<HTMLElement>('[data-author-hotspot]')?.focus();
}

async function importDrill(file: File): Promise<void> {
  try {
    if (file.size > 3_000_000) throw new Error('That file is too large. Choose a drill under 3 MB.');
    const drill = validateDrill(JSON.parse(await file.text()));
    drill.id = makeId();
    library.unshift(drill); persistDrills(); render(); showToast(`Imported “${drill.title}”.`);
  } catch (error) { showToast(error instanceof Error ? error.message : 'Could not read that JSON file.', true); }
}

function exportDrill(id: string): void {
  const drill = findDrill(id);
  if (!drill) return;
  const blob = new Blob([`${JSON.stringify(drill, null, 2)}\n`], { type: 'application/json' });
  const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = `${slugify(drill.title)}.skill-drill.json`; anchor.click(); URL.revokeObjectURL(anchor.href); showToast('JSON file exported.');
}

function deleteDrill(id: string): void { const drill = library.find((item) => item.id === id); if (!drill || !window.confirm(`Delete “${drill.title}” from this browser? This cannot be undone unless you exported a copy.`)) return; library = library.filter((item) => item.id !== id); persistDrills(); render(); showToast('Drill deleted.'); }

function navigate(next: View): void { view = next; if (next === 'home') setPath('/'); else setPath(`/${next}`); render(); focusMain(); }
function setPath(path: string): void { history.pushState({}, '', path); }
function routeView(): View { if (location.pathname === '/privacy') return 'privacy'; if (location.pathname === '/terms') return 'terms'; if (location.pathname === '/studio') return 'edit'; if (location.pathname === '/play') return 'play'; return 'home'; }
function focusMain(): void { const main = document.querySelector<HTMLElement>('main'); main?.setAttribute('tabindex', '-1'); main?.focus(); }

function loadDrills(): Drill[] { try { const parsed: unknown = JSON.parse(localStorage.getItem('skill-drill-library') ?? '[]'); return Array.isArray(parsed) ? parsed.flatMap((item) => { try { return [validateDrill(item)]; } catch { return []; } }) : []; } catch { return []; } }
function loadRuns(): Run[] { try { const value: unknown = JSON.parse(localStorage.getItem('skill-drill-runs') ?? '[]'); return Array.isArray(value) ? value.filter((run): run is Run => typeof run === 'object' && run !== null && typeof (run as Run).drillId === 'string' && typeof (run as Run).attempts === 'number') : []; } catch { return []; } }
function persistDrills(): void { try { localStorage.setItem('skill-drill-library', JSON.stringify(library)); } catch { showToast('Browser storage is full. Export this drill to keep a copy.', true); } }
function persistRuns(): void { try { localStorage.setItem('skill-drill-runs', JSON.stringify(runs)); } catch { /* Practice still works without history. */ } }
function findDrill(id: string): Drill | undefined { return library.find((item) => item.id === id) ?? starterDrills.find((item) => item.id === id); }

function renderFeedback(): void { const box = document.querySelector<HTMLElement>('#feedback'); if (box && feedback) { box.className = `feedback ${feedback.tone}`; box.innerHTML = `<span aria-hidden="true">!</span><p>${escapeHtml(feedback.message)}</p>`; } }
function showFormError(message: string): void { const box = document.querySelector<HTMLElement>('#form-error'); if (box) box.textContent = message; else showToast(message, true); }
function showToast(message: string, error = false): void { const box = document.querySelector<HTMLElement>('#toast'); if (!box) return; box.textContent = message; box.className = `toast-region visible${error ? ' error' : ''}`; window.setTimeout(() => box.classList.remove('visible'), 4000); }

function emptyView(title: string, body: string, action: string): string { return `<main id="main" class="empty"><h1>${title}</h1><p>${body}</p><button class="primary" type="button" data-nav="home">${action}</button></main>`; }
function titleForView(): string { if (view === 'edit') return 'Build a drill — Skill Drill Studio'; if (view === 'play') return `${active?.title ?? 'Practise'} — Skill Drill Studio`; if (view === 'privacy') return 'Privacy — Skill Drill Studio'; if (view === 'terms') return 'Terms — Skill Drill Studio'; return 'Skill Drill Studio — make practice active'; }
function labelKind(kind: DrillKind): string { return kind === 'ordered' ? 'Ordered steps' : kind === 'command' ? 'Exact command' : 'Image hotspot'; }
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]!); }
function escapeAttr(value: string): string { return escapeHtml(value).replace(/`/g, '&#096;'); }
function clamp(value: number): number { return Math.round(Math.max(0, Math.min(100, value)) * 10) / 10; }
function slugify(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'skill-drill'; }
function readAsDataUrl(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Could not read the image.')); reader.readAsDataURL(file); }); }
function reducedMotion(): boolean { return matchMedia('(prefers-reduced-motion: reduce)').matches; }

function routeIcon(): string { return `<svg viewBox="0 0 240 128" aria-hidden="true"><path d="M21 99c25-43 44-70 70-48s33 56 64 28 35-48 63-48"/><circle cx="21" cy="99" r="8"/><circle cx="91" cy="51" r="8"/><circle cx="155" cy="79" r="8"/><circle cx="218" cy="31" r="8"/></svg>`; }
function commandIcon(): string { return `<svg viewBox="0 0 240 128" aria-hidden="true"><rect x="20" y="18" width="200" height="92" rx="9"/><circle cx="40" cy="36" r="4"/><circle cx="54" cy="36" r="4"/><path d="m48 67 17 12-17 12M79 91h36M139 67h49"/></svg>`; }
function hotspotIcon(): string { return `<svg viewBox="0 0 240 128" aria-hidden="true"><path d="M20 101 66 38l36 42 31-27 34 26 22-38 31 60Z"/><circle cx="136" cy="62" r="21"/><path d="M136 28v17m0 34v17m-34-34h17m34 0h17"/></svg>`; }
