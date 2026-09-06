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
  type DrillKind
} from './lib';

type View = 'home' | 'edit' | 'play' | 'privacy' | 'terms' | 'notFound';
type Feedback = { tone: 'success' | 'error' | 'info'; message: string } | null;
type Run = { drillId: string; attempts: number; completedAt: string };

const PRODUCT_ORIGIN = 'https://skill-drill-studio.sociobot.in';
const REAL_LIBRARY_KEY = 'skill-drill-library';
const REAL_RUNS_KEY = 'skill-drill-runs';
const DEMO_LIBRARY_KEY = 'demo:skill-drill-library';
const DEMO_RUNS_KEY = 'demo:skill-drill-runs';

const mount = document.querySelector<HTMLDivElement>('#app');
if (!mount) throw new Error('App mount is missing');
const app: HTMLDivElement = mount;

let demoMode = isDemoLocation();
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
  const main = view === 'home'
    ? homeView()
    : view === 'edit'
      ? editorView()
      : view === 'play'
        ? playerView()
        : view === 'notFound'
          ? notFoundView()
          : legalView(view);
  app.innerHTML = `${demoMode ? demoBannerView() : ''}${headerView()}${main}${footerView()}<div class="toast-region" id="toast" aria-live="polite"></div><div class="visually-hidden" id="route-announcer" aria-live="polite"></div>`;
  updateMetadata();
}

function demoBannerView(): string {
  return `<aside class="demo-banner" aria-label="Demo mode">
    <strong>Demo — sample data, nothing is saved</strong>
    <span>Your saved drills stay separate.</span>
    <div><button type="button" data-reset-demo>Reset demo</button><button type="button" data-start-real>Start for real</button></div>
  </aside>`;
}

function headerView(): string {
  const homePath = demoMode ? '/demo' : '/';
  return `<header class="site-header">
    <a class="brand" href="${homePath}" data-nav="home" aria-label="Skill Drill Studio home">
      <svg viewBox="0 0 36 36" aria-hidden="true"><path d="m4 28 9-17 7 11 4-7 8 13"/><circle cx="13" cy="11" r="2.4"/></svg>
      <span>Skill Drill <em>Studio</em></span>
    </a>
    <nav aria-label="Main navigation">
      <a href="/demo" data-enter-demo ${demoMode ? 'aria-current="page"' : ''}>Demo</a>
      <a href="${demoMode ? '/demo/privacy' : '/privacy'}" data-nav="privacy">Privacy</a>
      <button class="primary small" type="button" data-new="ordered">Create a drill</button>
    </nav>
  </header>`;
}

function homeView(): string {
  return demoMode ? demoHomeView() : landingView();
}

function landingView(): string {
  return `<main id="main">
    <section class="hero" aria-labelledby="hero-title">
      <picture class="hero-art">
        <source media="(max-width: 700px)" srcset="/assets/night-workshop-800.webp" />
        <img src="/assets/night-workshop-1280.webp" width="1280" height="853" alt="" fetchpriority="high" />
      </picture>
      <div class="hero-shade"></div>
      <div class="hero-copy">
        <p class="eyebrow"><span></span> Browser drill builder</p>
        <h1 id="hero-title">Create short browser practice drills</h1>
        <p>For teachers, instructors, and self-learners who need repeatable practice with clear feedback.</p>
        <div class="hero-actions">
          <a class="primary" href="/demo" data-enter-demo>Try it with sample data</a>
          <button class="secondary" type="button" data-new="ordered">Create an ordered drill</button>
        </div>
        <p class="action-note">The demo opens three ready-made drills in a separate workspace.</p>
        <ul class="hero-facts" aria-label="Product facts">
          <li><span aria-hidden="true">✓</span> Free to use. No account needed.</li>
          <li><span aria-hidden="true">✓</span> Drills stay in your browser.</li>
          <li><span aria-hidden="true">✓</span> Command answers are checked as text, never run.</li>
        </ul>
      </div>
    </section>

    <section class="types section-shell" id="types" aria-labelledby="types-title">
      <div class="section-intro"><p class="eyebrow"><span></span> Choose a format</p><h2 id="types-title">Build the action learners must repeat</h2><p>Test each drill before you share it.</p></div>
      <div class="type-grid">
        ${typeCard('ordered', 'Ordered steps', 'Put a process, sequence, or safety check in the correct order.', routeIcon())}
        ${typeCard('command', 'Exact command', 'Recall a command, formula, shortcut, or line of syntax.', commandIcon())}
        ${typeCard('hotspot', 'Image hotspot', 'Find a control, region, tool, or part of an image.', hotspotIcon())}
      </div>
    </section>

    <section class="examples section-shell" id="examples" aria-labelledby="examples-title">
      <div class="section-intro row"><div><p class="eyebrow"><span></span> Ready to practise</p><h2 id="examples-title">Saved and sample drills</h2></div><div class="shelf-tools"><p>${library.length ? `${library.length} saved ${library.length === 1 ? 'drill' : 'drills'} in this browser.` : 'Create a drill or import a JSON file.'}</p><button class="secondary small" type="button" data-import-trigger>Import JSON</button></div></div>
      ${importInputView()}
      ${shelfView()}
    </section>

    <section class="how section-shell" aria-labelledby="how-title">
      <div class="section-intro"><p class="eyebrow"><span></span> Three steps</p><h2 id="how-title">How it works</h2></div>
      <ol><li><b>1</b><div><h3>Create the answer</h3><p>Choose a format and add the correct response.</p></div></li><li><b>2</b><div><h3>Test the drill</h3><p>Use the learner view and check the feedback.</p></div></li><li><b>3</b><div><h3>Share the file</h3><p>Export one JSON file for another browser to import.</p></div></li></ol>
    </section>

    <section class="limits section-shell" aria-labelledby="limits-title">
      <div><p class="eyebrow"><span></span> Clear limits</p><h2 id="limits-title">What it does not do</h2><p>It does not run commands, create student profiles, or send drills to a server.</p></div>
      <ul><li><strong>Private by default</strong><span>Drills and practice history stay in your browser.</span></li><li><strong>No tracking</strong><span>There are no analytics, ads, or tracking tools.</span></li><li><strong>Portable files</strong><span>Export and import one validated JSON file.</span></li></ul>
    </section>
  </main>`;
}

function demoHomeView(): string {
  return `<main id="main" class="demo-main">
    <section class="demo-intro section-shell" aria-labelledby="demo-title">
      <div><p class="eyebrow"><span></span> Sample workspace</p><h1 id="demo-title">Try three sample drills</h1><p>Practice each format, edit its answer, or export its JSON file. Your saved drills stay unchanged.</p><button class="primary" type="button" data-play="demo-command">Practise the command sample</button></div>
      <dl class="demo-summary"><div><dt>Sample drills</dt><dd>3</dd></div><div><dt>Drill formats</dt><dd>3</dd></div><div><dt>Completed sample runs</dt><dd>${runs.length}</dd></div></dl>
    </section>
    <section class="examples section-shell demo-shelf" aria-labelledby="demo-samples-title">
      <div class="section-intro row"><div><p class="eyebrow"><span></span> Sample data</p><h2 id="demo-samples-title">Ready-made drills</h2></div><p>Reset the demo at any time.</p></div>
      ${shelfView()}
    </section>
  </main>`;
}

function typeCard(kind: DrillKind, title: string, body: string, icon: string): string {
  return `<article class="type-card"><div class="type-art ${kind}">${icon}<span>${title}</span></div><h3>${title}</h3><p>${body}</p><button class="text-action" type="button" data-new="${kind}">Create this drill <span aria-hidden="true">→</span></button></article>`;
}

function shelfView(): string {
  const all = demoMode ? library : [...library, ...starterDrills];
  return `<div class="shelf">${all.map((drill) => {
    const sample = drill.id.startsWith('sample-') || drill.id.startsWith('demo-');
    const owned = library.some((item) => item.id === drill.id);
    return `<article class="shelf-item">
      <div class="shelf-mark ${drill.kind}" aria-hidden="true">${drill.kind === 'ordered' ? '01↕' : drill.kind === 'command' ? '>_' : '⌖'}</div>
      <div><p class="meta">${labelKind(drill.kind)}${sample ? ' · Sample' : ''}</p><h3>${escapeHtml(drill.title)}</h3><p>${escapeHtml(drill.instructions)}</p>
        <div class="item-actions"><button class="secondary small" type="button" data-play="${escapeAttr(drill.id)}">Practise</button>${owned ? `<button class="quiet-button" type="button" data-edit="${escapeAttr(drill.id)}">Edit</button><button class="quiet-button" type="button" data-export="${escapeAttr(drill.id)}">Export JSON</button>${sample ? '' : `<button class="danger-button" type="button" data-delete="${escapeAttr(drill.id)}">Delete</button>`}` : ''}</div>
      </div></article>`;
  }).join('')}</div>`;
}

function importInputView(): string {
  return `<label class="visually-hidden" for="import-file">Import a drill JSON file</label><input class="visually-hidden" id="import-file" type="file" accept="application/json,.json" tabindex="-1" />`;
}

function editorView(): string {
  if (!draft) return emptyView('No drill is open', 'Choose a drill format to begin.', 'Choose a format');
  return `<main id="main" class="studio-main">
    <div class="studio-heading"><div><p class="eyebrow"><span></span> Create a drill</p><h1>${draft.title ? `Edit “${escapeHtml(draft.title)}”` : `Create an ${labelKind(draft.kind).toLowerCase()} drill`}</h1><p>Your work is stored in ${demoMode ? 'the separate demo workspace' : 'this browser'} when you select “Save and test”.</p></div><button class="quiet-button" type="button" data-nav="home">Close editor</button></div>
    <ol class="progress" aria-label="Authoring progress"><li class="done"><b>1</b> Choose</li><li class="current" aria-current="step"><b>2</b> Create</li><li><b>3</b> Test</li><li><b>4</b> Share</li></ol>
    <form id="drill-form" class="editor" novalidate>
      <p class="required-note" id="required-note">Fields marked * are required.</p>
      <div class="form-panel">
        <div class="panel-heading"><div><p class="meta">Drill details</p><h2>Add a title and instructions</h2></div><span class="autosave-note">${demoMode ? 'Demo only' : 'Browser only'}</span></div>
        <label for="title">Drill title <span aria-hidden="true">*</span></label><input id="title" name="title" maxlength="120" required aria-describedby="required-note" value="${escapeAttr(draft.title)}" placeholder="e.g. Restart the field radio" />
        <label for="instructions">Learner instructions <span aria-hidden="true">*</span></label><textarea id="instructions" name="instructions" maxlength="500" required aria-describedby="required-note" placeholder="Tell the learner what to do in one clear sentence.">${escapeHtml(draft.instructions)}</textarea>
      </div>
      ${kindFields(draft)}
      <div class="form-error" id="form-error" role="alert" aria-live="assertive"></div>
      <div class="editor-actions"><button class="secondary" type="button" data-nav="home">Cancel</button><button class="primary" type="submit">Save and test <span aria-hidden="true">→</span></button></div>
    </form>
  </main>`;
}

function kindFields(drill: Drill): string {
  if (drill.kind === 'ordered') return `<fieldset class="form-panel"><legend><span class="meta">Correct answer</span><strong>Add steps in the correct order</strong></legend><p class="field-help">Learners receive these steps shuffled. Use the arrow buttons to set the answer.</p><div id="step-list">${drill.items.map((item, index) => stepField(item, index, drill.items.length)).join('')}</div><button class="secondary small" type="button" data-add-step>+ Add a step</button></fieldset>`;
  if (drill.kind === 'command') return `<div class="form-panel"><div class="panel-heading"><div><p class="meta">Exact response</p><h2>Write the prompt and answer</h2></div><span class="terminal-symbol" aria-hidden="true">&gt;_</span></div><label for="prompt">Prompt <span aria-hidden="true">*</span></label><textarea id="prompt" name="prompt" maxlength="500" required aria-describedby="required-note" placeholder="e.g. Create a folder named field-notes">${escapeHtml(drill.prompt)}</textarea><label for="answer">Exact accepted answer <span aria-hidden="true">*</span></label><input class="code-input" id="answer" name="answer" maxlength="500" required aria-describedby="required-note" value="${escapeAttr(drill.answer)}" autocomplete="off" spellcheck="false" /><label class="check-row"><input name="caseSensitive" type="checkbox" ${drill.caseSensitive ? 'checked' : ''} /><span>Require matching uppercase and lowercase letters</span></label><p class="safety-note"><span aria-hidden="true">◇</span> Learner input is compared as text and is never executed.</p></div>`;
  return `<div class="form-panel"><div class="panel-heading"><div><p class="meta">Target image</p><h2>Mark the correct place</h2></div><span class="target-symbol" aria-hidden="true">⌖</span></div><p class="field-help">Upload a PNG, JPEG, or WebP of 2 MB or smaller. Select the image or use arrow keys to move the target.</p><label class="file-button" for="image-upload">Choose an image</label><input class="visually-hidden" id="image-upload" name="image-upload" type="file" accept="image/png,image/jpeg,image/webp" /><label for="imageAlt">Image description <span aria-hidden="true">*</span></label><input id="imageAlt" name="imageAlt" maxlength="300" required aria-describedby="required-note" value="${escapeAttr(drill.imageAlt)}" /><div class="author-hotspot"><button class="hotspot-canvas" type="button" data-author-hotspot aria-label="Place the target. Arrow keys move it. Current position ${Math.round(drill.target.x)} percent across and ${Math.round(drill.target.y)} percent down."><img src="${escapeAttr(drill.image)}" alt="${escapeAttr(drill.imageAlt)}" /><svg class="hotspot-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><circle class="target-ring" cx="${drill.target.x}" cy="${drill.target.y}" r="${drill.target.radius}" /></svg></button></div><label for="radius">Target size: <output id="radius-output">${drill.target.radius}%</output></label><input id="radius" name="radius" type="range" min="3" max="30" value="${drill.target.radius}" /></div>`;
}

function stepField(item: string, index: number, total: number): string {
  return `<div class="step-row"><span class="step-number">${index + 1}</span><label class="visually-hidden" for="step-${index}">Step ${index + 1}</label><input id="step-${index}" name="steps" maxlength="240" required aria-describedby="required-note" value="${escapeAttr(item)}" placeholder="Step ${index + 1}"/><button type="button" class="icon-button" data-step-up="${index}" aria-label="Move step ${index + 1} up" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" class="icon-button" data-step-down="${index}" aria-label="Move step ${index + 1} down" ${index === total - 1 ? 'disabled' : ''}>↓</button><button type="button" class="icon-button remove" data-step-remove="${index}" aria-label="Remove step ${index + 1}" ${total <= 2 ? 'disabled' : ''}>×</button></div>`;
}

function playerView(): string {
  if (!active) return emptyView('No drill is open', 'Choose a saved or sample drill to practise.', 'Browse drills');
  const runNumber = runs.filter((run) => run.drillId === active!.id).length + (completed ? 0 : 1);
  return `<main id="main" class="player-main">
    <div class="player-top"><button class="quiet-button back" type="button" data-nav="home">← Back to drills</button><p>Attempt ${runNumber} <span aria-hidden="true">·</span> ${labelKind(active.kind)}</p></div>
    <article class="drill-stage">
      <div class="stage-heading"><p class="eyebrow"><span></span> Practice drill</p><h1>${escapeHtml(active.title)}</h1><p>${escapeHtml(active.instructions)}</p></div>
      ${completed ? completionView(active) : playControl(active)}
      <div class="feedback ${feedback?.tone ?? ''}" id="feedback" aria-live="assertive">${feedback ? `<span aria-hidden="true">${feedback.tone === 'success' ? '✓' : feedback.tone === 'error' ? '!' : 'i'}</span><p>${escapeHtml(feedback.message)}</p>` : ''}</div>
    </article>
    <aside class="privacy-strip"><span aria-hidden="true">◇</span><div><strong>Answers stay in this browser</strong><p>Commands are compared as text. They are never run or sent anywhere.</p></div></aside>
  </main>`;
}

function playControl(drill: Drill): string {
  if (drill.kind === 'ordered') return `<section class="play-control" aria-labelledby="task-title"><div class="task-heading"><h2 id="task-title">Arrange the steps</h2><p>Use the arrow buttons to put them in the correct order.</p></div><ol class="order-list">${playItems.map((item, index) => `<li><span>${escapeHtml(item)}</span><button type="button" class="icon-button" data-play-up="${index}" aria-label="Move ${escapeAttr(item)} up" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" class="icon-button" data-play-down="${index}" aria-label="Move ${escapeAttr(item)} down" ${index === playItems.length - 1 ? 'disabled' : ''}>↓</button></li>`).join('')}</ol><button class="primary wide" type="button" data-check-order>Check order</button>`;
  if (drill.kind === 'command') return `<form id="command-form" class="play-control"><div class="task-heading"><h2>${escapeHtml(drill.prompt)}</h2><p>Enter one exact answer. Spaces and ${drill.caseSensitive ? 'letter case' : 'wording'} matter.</p></div><label for="command-attempt">Your answer</label><div class="command-entry"><span aria-hidden="true">$</span><input class="code-input" id="command-attempt" name="attempt" required autocomplete="off" autocapitalize="none" spellcheck="false" autofocus /></div><button class="primary wide" type="submit">Check command</button></form>`;
  return `<section class="play-control"><div class="task-heading"><h2>Choose the target</h2><p>Select the image, or use arrow keys to move the crosshair and Enter to check.</p></div><button class="hotspot-canvas playable" type="button" data-play-hotspot aria-label="Interactive image: ${escapeAttr(drill.imageAlt)}. Use arrow keys to move the crosshair, then press Enter."><img src="${escapeAttr(drill.image)}" alt="${escapeAttr(drill.imageAlt)}" /><svg class="hotspot-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><circle class="cursor-ring" cx="${hotspotCursor.x}" cy="${hotspotCursor.y}" r="3" /><path class="cursor-lines" d="${cursorPath()}" /></svg></button><p class="keyboard-help">Keyboard: arrow keys move by 5%. Shift + arrow moves by 1%.</p></section>`;
}

function completionView(drill: Drill): string {
  const drillRuns = runs.filter((run) => run.drillId === drill.id);
  const latest = drillRuns.at(-1);
  const first = drillRuns[0];
  const improvement = drillRuns.length >= 3 && first && latest ? first.attempts - latest.attempts : null;
  return `<section class="completion"><div class="success-orbit" aria-hidden="true">✓</div><p class="meta">Drill complete</p><h2>Correct answer</h2><p>Completed in <strong>${latest?.attempts ?? attemptCount} ${latest?.attempts === 1 ? 'attempt' : 'attempts'}</strong>.</p>${improvement !== null ? `<p class="improvement">${improvement > 0 ? `This run used ${improvement} fewer ${improvement === 1 ? 'attempt' : 'attempts'} than the first run.` : improvement === 0 ? 'This run used the same number of attempts as the first run.' : 'Try again and aim for fewer attempts.'}</p>` : `<p class="muted">Complete three runs to compare the first and third results.</p>`}<div class="completion-actions"><button class="primary" type="button" data-restart>Practise again</button><button class="secondary" type="button" data-export="${escapeAttr(drill.id)}">Export JSON</button>${library.some((item) => item.id === drill.id) ? `<button class="quiet-button" type="button" data-edit="${escapeAttr(drill.id)}">Edit drill</button>` : ''}</div></section>`;
}

function legalView(which: 'privacy' | 'terms'): string {
  const privacy = which === 'privacy';
  return `<main id="main" class="legal section-shell"><p class="eyebrow"><span></span> Product policy</p><h1>${privacy ? 'Privacy' : 'Terms of use'}</h1><p class="lede">Effective 6 September 2026</p>${privacy ? `<h2>Data stored in your browser</h2><p>Skill Drill Studio does not use accounts, analytics, ads, or tracking tools.</p><p>Drills and practice counts use local storage in your browser. Uploaded images become local data and are not sent to us.</p><h2>Data you choose to share</h2><p>Exporting a JSON file creates a local download. You choose where that copy goes.</p><p>Clearing site data removes saved drills and practice history. Demo data uses separate keys and is removed when you leave the demo.</p><h2>Hosting requests</h2><p>Our static host may process short-lived request logs for security and reliability. We do not use those logs to profile learners.</p>` : `<h2>Using the tool</h2><p>You may create and share drills for free. The software is provided as-is, without warranties.</p><p>Keep exported copies of important drills because browser storage can be cleared.</p><h2>Safe and lawful content</h2><p>Only upload images and material you have permission to use. Do not distribute unlawful or harmful content.</p><p>Learner commands are compared as text and never executed.</p><h2>Your work</h2><p>You keep ownership of the drill content you author. The application source uses the MIT License.</p>`}<p><a href="${demoMode ? '/demo' : '/'}" data-nav="home">Return to drills</a></p></main>`;
}

function notFoundView(): string {
  return `<main id="main" class="not-found section-shell"><p class="eyebrow"><span></span> Page not found</p><h1>This page does not exist</h1><p>The address may be wrong or the page may have moved.</p><a class="primary" href="${demoMode ? '/demo' : '/'}" data-nav="home">Return to Skill Drill Studio</a></main>`;
}

function footerView(): string {
  return `<footer><div><a class="brand footer-brand" href="${demoMode ? '/demo' : '/'}" data-nav="home">Skill Drill Studio</a><p>Create short practice drills with clear feedback.</p></div><nav aria-label="Legal"><a href="${demoMode ? '/demo/privacy' : '/privacy'}" data-nav="privacy">Privacy</a><a href="${demoMode ? '/demo/terms' : '/terms'}" data-nav="terms">Terms</a><a href="https://github.com/B-Divyesh/sf-skill-drill-studio" rel="noreferrer">Source code on GitHub (external)</a></nav><p class="art-credit">Version 1.1.0 · Built by Param Factory · Original generated night-workshop artwork · No tracking</p></footer>`;
}

function bindGlobalEvents(): void {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const nav = target.closest<HTMLElement>('[data-nav]');
    if (nav) { event.preventDefault(); navigate(nav.dataset.nav as View); return; }
    if (target.closest('[data-enter-demo]')) { event.preventDefault(); enterDemo(); return; }
    if (target.closest('[data-reset-demo]')) { resetDemo(); return; }
    if (target.closest('[data-start-real]')) { startForReal(); return; }
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
    if (authorHotspot && event instanceof MouseEvent && event.detail > 0) placeAuthorHotspot(authorHotspot, event);
    const playHotspot = target.closest<HTMLElement>('[data-play-hotspot]');
    if (playHotspot && event instanceof MouseEvent && event.detail > 0) submitHotspotFromPointer(playHotspot, event);
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
    if (input.matches('[aria-invalid="true"]')) { input.removeAttribute('aria-invalid'); input.setAttribute('aria-describedby', 'required-note'); }
    if (input.id === 'radius' && draft?.kind === 'hotspot') {
      draft.target.radius = Number(input.value);
      const output = document.querySelector<HTMLOutputElement>('#radius-output');
      const ring = document.querySelector<SVGCircleElement>('.target-ring');
      if (output) output.value = `${input.value}%`;
      ring?.setAttribute('r', input.value);
    }
  });

  document.addEventListener('keydown', (event) => {
    const authorCanvas = (event.target as HTMLElement).closest<HTMLElement>('[data-author-hotspot]');
    if (authorCanvas && draft?.kind === 'hotspot' && event.key.startsWith('Arrow')) {
      event.preventDefault();
      const step = event.shiftKey ? 1 : 5;
      if (event.key === 'ArrowLeft') draft.target.x = Math.max(0, draft.target.x - step);
      if (event.key === 'ArrowRight') draft.target.x = Math.min(100, draft.target.x + step);
      if (event.key === 'ArrowUp') draft.target.y = Math.max(0, draft.target.y - step);
      if (event.key === 'ArrowDown') draft.target.y = Math.min(100, draft.target.y + step);
      updateAuthorTarget(authorCanvas);
      return;
    }
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

  window.addEventListener('popstate', () => {
    const nextDemoMode = isDemoLocation();
    if (nextDemoMode !== demoMode) { demoMode = nextDemoMode; library = loadDrills(); runs = loadRuns(); draft = null; active = null; }
    view = routeView(); render(); focusMain();
  });
  window.addEventListener('online', () => showToast('Back online. Your browser drills are ready.'));
  window.addEventListener('offline', () => showToast('You are offline. Saved drills still work in this browser.'));
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}

function startNew(kind: DrillKind): void { draft = newDrill(kind); view = 'edit'; setPath(pathFor('edit')); render(); focusMain(); }
function startEdit(id: string): void { const found = findDrill(id); if (!found) return; draft = structuredClone(found); view = 'edit'; setPath(pathFor('edit')); render(); focusMain(); }
function startPlay(id: string): void { const found = findDrill(id); if (!found) return; active = structuredClone(found); restartPlay(); view = 'play'; setPath(pathFor('play')); render(); focusMain(); }

function restartPlay(): void {
  if (!active) return;
  const runIndex = runs.filter((run) => run.drillId === active!.id).length;
  playItems = active.kind === 'ordered' ? practiceOrder(active.items, runIndex) : [];
  attemptCount = 0; feedback = null; completed = false; hotspotCursor = { x: 50, y: 50 };
  if (view === 'play') { render(); focusMain(); }
}

function saveAndTest(): void {
  const form = document.querySelector<HTMLFormElement>('#drill-form');
  syncDraft();
  if (!draft || !form) return;
  const invalid = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input:invalid, textarea:invalid, select:invalid');
  if (invalid) { showInvalidField(invalid); return; }
  try {
    const clean = validateDrill(draft);
    const index = library.findIndex((item) => item.id === clean.id);
    if (index >= 0) library[index] = clean; else library.unshift(clean);
    persistDrills();
    active = structuredClone(clean);
    view = 'play'; setPath(pathFor('play')); restartPlay(); render(); focusMain();
  } catch (error) {
    const box = document.querySelector<HTMLElement>('#form-error');
    if (box) box.textContent = error instanceof Error ? error.message : 'Complete the required fields, then try again.';
    const firstField = form.querySelector<HTMLElement>('input:not([type="checkbox"]):not([type="range"]), textarea, select');
    firstField?.focus();
  }
}

function showInvalidField(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void {
  const names: Record<string, string> = { title: 'drill title', instructions: 'learner instructions', prompt: 'prompt', answer: 'exact accepted answer', imageAlt: 'image description', steps: 'step' };
  const name = names[field.name] ?? 'required field';
  const box = document.querySelector<HTMLElement>('#form-error');
  if (box) box.textContent = `Enter the ${name}, then select Save and test again.`;
  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('aria-describedby', 'required-note form-error');
  field.focus();
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
function submitOrder(): void { if (!active || active.kind !== 'ordered') return; attemptCount += 1; if (checkOrdered(active.items, playItems)) completeRun(); else { const correct = active.items.filter((item, index) => item === playItems[index]).length; feedback = { tone: 'error', message: `Not correct yet. ${correct} of ${active.items.length} positions are correct. Adjust the order and try again.` }; render(); document.querySelector<HTMLElement>('[data-check-order]')?.focus(); } }
function submitCommand(form: HTMLFormElement): void { if (!active || active.kind !== 'command') return; const value = String(new FormData(form).get('attempt') ?? ''); attemptCount += 1; if (checkCommand(active, value)) completeRun(); else { feedback = { tone: 'error', message: `That is not an exact match. Check ${active.caseSensitive ? 'capitalization, spaces, and punctuation' : 'spaces and punctuation'}, then try again.` }; const field = form.querySelector<HTMLInputElement>('input'); if (field) { field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', 'feedback'); field.select(); } renderFeedback(); } }

function placeAuthorHotspot(canvas: HTMLElement, event: MouseEvent): void { syncDraft(); if (!draft || draft.kind !== 'hotspot') return; const point = relativePoint(canvas, event); draft.target.x = point.x; draft.target.y = point.y; updateAuthorTarget(canvas); showToast(`Target placed at ${Math.round(point.x)} percent across and ${Math.round(point.y)} percent down.`); }
function updateAuthorTarget(canvas: HTMLElement): void { if (!draft || draft.kind !== 'hotspot') return; const ring = canvas.querySelector<SVGCircleElement>('.target-ring'); ring?.setAttribute('cx', String(draft.target.x)); ring?.setAttribute('cy', String(draft.target.y)); canvas.setAttribute('aria-label', `Place the target. Arrow keys move it. Current position ${Math.round(draft.target.x)} percent across and ${Math.round(draft.target.y)} percent down.`); }
function submitHotspotFromPointer(canvas: HTMLElement, event: MouseEvent): void { const point = relativePoint(canvas, event); hotspotCursor = point; submitHotspot(point.x, point.y); }
function submitHotspot(x: number, y: number): void { if (!active || active.kind !== 'hotspot') return; attemptCount += 1; if (checkHotspot(active.target, x, y)) completeRun(); else { feedback = { tone: 'error', message: 'That is outside the target area. Choose a different spot.' }; render(); document.querySelector<HTMLElement>('[data-play-hotspot]')?.focus(); } }

function completeRun(): void { if (!active) return; runs.push({ drillId: active.id, attempts: attemptCount, completedAt: new Date().toISOString() }); runs = runs.slice(-150); persistRuns(); completed = true; feedback = { tone: 'success', message: 'Correct. Drill complete.' }; render(); document.querySelector<HTMLElement>('[data-restart]')?.focus(); }

function relativePoint(element: HTMLElement, event: MouseEvent): { x: number; y: number } { const rect = element.getBoundingClientRect(); return { x: clamp(((event.clientX - rect.left) / rect.width) * 100), y: clamp(((event.clientY - rect.top) / rect.height) * 100) }; }
function updateCursor(): void { const ring = document.querySelector<SVGCircleElement>('.cursor-ring'); const lines = document.querySelector<SVGPathElement>('.cursor-lines'); ring?.setAttribute('cx', String(hotspotCursor.x)); ring?.setAttribute('cy', String(hotspotCursor.y)); lines?.setAttribute('d', cursorPath()); }
function cursorPath(): string { const { x, y } = hotspotCursor; return `M${x - 5} ${y}h10M${x} ${y - 5}v10`; }

async function loadHotspotImage(file: File): Promise<void> {
  if (!draft || draft.kind !== 'hotspot') return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2_000_000) { showFormError('Choose a PNG, JPEG, or WebP image of 2 MB or smaller.'); return; }
  draft.image = await readAsDataUrl(file); draft.target = { x: 50, y: 50, radius: draft.target.radius }; syncDraft(); render(); document.querySelector<HTMLElement>('[data-author-hotspot]')?.focus();
}

async function importDrill(file: File): Promise<void> {
  try {
    if (file.size > 3_000_000) throw new Error('That file is too large. Choose a drill under 3 MB.');
    const drill = validateDrill(JSON.parse(await file.text()));
    drill.id = makeId();
    library.unshift(drill); persistDrills(); render(); showToast(`Imported “${drill.title}”.`);
  } catch (error) { showToast(error instanceof SyntaxError ? 'That JSON file could not be read. Check the file and try again.' : error instanceof Error ? error.message : 'That JSON file could not be read. Check the file and try again.', true); }
}

function exportDrill(id: string): void {
  const drill = findDrill(id);
  if (!drill) return;
  const blob = new Blob([`${JSON.stringify(drill, null, 2)}\n`], { type: 'application/json' });
  const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = `${slugify(drill.title)}.skill-drill.json`; anchor.click(); URL.revokeObjectURL(anchor.href); showToast('JSON file exported.');
}

function deleteDrill(id: string): void { const drill = library.find((item) => item.id === id); if (!drill || !window.confirm(`Delete “${drill.title}” from this browser? Export a copy first if you need it.`)) return; library = library.filter((item) => item.id !== id); persistDrills(); render(); showToast('Drill deleted.'); }

function enterDemo(): void { demoMode = true; library = loadDrills(); runs = loadRuns(); draft = null; active = null; view = 'home'; setPath('/demo'); render(); focusMain(); }
function resetDemo(): void { localStorage.removeItem(DEMO_LIBRARY_KEY); localStorage.removeItem(DEMO_RUNS_KEY); library = loadDrills(); runs = loadRuns(); draft = null; active = null; view = 'home'; setPath('/demo'); render(); focusMain(); showToast('Demo reset to the original sample data.'); }
function startForReal(): void { localStorage.removeItem(DEMO_LIBRARY_KEY); localStorage.removeItem(DEMO_RUNS_KEY); demoMode = false; library = loadDrills(); runs = loadRuns(); draft = null; active = null; view = 'home'; setPath('/'); render(); focusMain(); }
function navigate(next: View): void { view = next; setPath(pathFor(next)); render(); focusMain(); }
function setPath(path: string): void { history.pushState({}, '', path); }
function pathFor(next: View): string { const path = next === 'home' ? '' : `/${next === 'notFound' ? '404' : next === 'edit' ? 'studio' : next}`; return demoMode ? `/demo${path}` : path || '/'; }
function routeView(): View { const path = routePath(); if (path === '/' || path === '') return 'home'; if (path === '/privacy') return 'privacy'; if (path === '/terms') return 'terms'; if (path === '/studio') return 'edit'; if (path === '/play') return 'play'; return 'notFound'; }
function routePath(): string { return demoMode && location.pathname.startsWith('/demo') ? location.pathname.slice(5) || '/' : location.pathname; }
function isDemoLocation(): boolean { return location.pathname === '/demo' || location.pathname.startsWith('/demo/') || new URLSearchParams(location.search).get('demo') === '1'; }
function focusMain(): void { const main = document.querySelector<HTMLElement>('main'); const heading = document.querySelector<HTMLElement>('h1'); main?.setAttribute('tabindex', '-1'); heading?.setAttribute('tabindex', '-1'); heading?.focus(); const announcer = document.querySelector<HTMLElement>('#route-announcer'); if (announcer) announcer.textContent = heading?.textContent ?? document.title; }

function demoSeedDrills(): Drill[] { return starterDrills.map((drill) => ({ ...structuredClone(drill), id: drill.id.replace('sample-', 'demo-') })); }
function demoSeedRuns(): Run[] { return [{ drillId: 'demo-command', attempts: 3, completedAt: '2026-09-04T09:00:00.000Z' }, { drillId: 'demo-command', attempts: 2, completedAt: '2026-09-05T09:00:00.000Z' }]; }
function loadDrills(): Drill[] { const key = demoMode ? DEMO_LIBRARY_KEY : REAL_LIBRARY_KEY; try { const stored = localStorage.getItem(key); if (demoMode && stored === null) { const seed = demoSeedDrills(); localStorage.setItem(key, JSON.stringify(seed)); return seed; } const parsed: unknown = JSON.parse(stored ?? '[]'); return Array.isArray(parsed) ? parsed.flatMap((item) => { try { return [validateDrill(item)]; } catch { return []; } }) : []; } catch { return demoMode ? demoSeedDrills() : []; } }
function loadRuns(): Run[] { const key = demoMode ? DEMO_RUNS_KEY : REAL_RUNS_KEY; try { const stored = localStorage.getItem(key); if (demoMode && stored === null) { const seed = demoSeedRuns(); localStorage.setItem(key, JSON.stringify(seed)); return seed; } const value: unknown = JSON.parse(stored ?? '[]'); return Array.isArray(value) ? value.filter((run): run is Run => typeof run === 'object' && run !== null && typeof (run as Run).drillId === 'string' && typeof (run as Run).attempts === 'number') : []; } catch { return demoMode ? demoSeedRuns() : []; } }
function persistDrills(): void { try { localStorage.setItem(demoMode ? DEMO_LIBRARY_KEY : REAL_LIBRARY_KEY, JSON.stringify(library)); } catch { showToast('Browser storage is full. Export this drill to keep a copy.', true); } }
function persistRuns(): void { try { localStorage.setItem(demoMode ? DEMO_RUNS_KEY : REAL_RUNS_KEY, JSON.stringify(runs)); } catch { /* Practice still works without history. */ } }
function findDrill(id: string): Drill | undefined { return library.find((item) => item.id === id) ?? (demoMode ? undefined : starterDrills.find((item) => item.id === id)); }

function renderFeedback(): void { const box = document.querySelector<HTMLElement>('#feedback'); if (box && feedback) { box.className = `feedback ${feedback.tone}`; box.innerHTML = `<span aria-hidden="true">!</span><p>${escapeHtml(feedback.message)}</p>`; } }
function showFormError(message: string): void { const box = document.querySelector<HTMLElement>('#form-error'); if (box) box.textContent = message; else showToast(message, true); }
function showToast(message: string, error = false): void { const box = document.querySelector<HTMLElement>('#toast'); if (!box) return; box.textContent = message; box.className = `toast-region visible${error ? ' error' : ''}`; window.setTimeout(() => box.classList.remove('visible'), 4000); }

function emptyView(title: string, body: string, action: string): string { return `<main id="main" class="empty"><h1>${title}</h1><p>${body}</p><button class="primary" type="button" data-nav="home">${action}</button></main>`; }
function titleForView(): string { if (view === 'edit') return 'Create a drill — Skill Drill Studio'; if (view === 'play') return 'Practice a drill — Skill Drill Studio'; if (view === 'privacy') return 'Privacy — Skill Drill Studio'; if (view === 'terms') return 'Terms — Skill Drill Studio'; if (view === 'notFound') return 'Page not found — Skill Drill Studio'; if (demoMode) return 'Demo — Skill Drill Studio'; return 'Skill Drill Studio — create browser practice drills'; }
function descriptionForView(): string { if (view === 'privacy') return 'Read how Skill Drill Studio stores drills and practice history in your browser.'; if (view === 'terms') return 'Read the terms for creating and sharing browser practice drills.'; if (view === 'notFound') return 'The requested Skill Drill Studio page was not found.'; if (demoMode) return 'Try three sample browser drills in a separate demo workspace.'; return 'Create ordered-step, exact-command, and image-hotspot practice drills, then share them as JSON files.'; }
function updateMetadata(): void { const title = titleForView(); const description = descriptionForView(); const canonicalPath = view === 'notFound' ? '/404' : pathFor(view); document.title = title; setMeta('meta[name="description"]', description); setMeta('meta[property="og:title"]', title); setMeta('meta[property="og:description"]', description); setMeta('meta[property="og:url"]', `${PRODUCT_ORIGIN}${canonicalPath}`); setMeta('meta[name="twitter:title"]', title); setMeta('meta[name="twitter:description"]', description); const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]'); if (canonical) canonical.href = `${PRODUCT_ORIGIN}${canonicalPath}`; }
function setMeta(selector: string, content: string): void { document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content); }
function labelKind(kind: DrillKind): string { return kind === 'ordered' ? 'Ordered steps' : kind === 'command' ? 'Exact command' : 'Image hotspot'; }
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]!); }
function escapeAttr(value: string): string { return escapeHtml(value).replace(/`/g, '&#096;'); }
function clamp(value: number): number { return Math.round(Math.max(0, Math.min(100, value)) * 10) / 10; }
function slugify(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'skill-drill'; }
function readAsDataUrl(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('The image could not be read.')); reader.readAsDataURL(file); }); }

function routeIcon(): string { return `<svg viewBox="0 0 240 128" aria-hidden="true"><path d="M21 99c25-43 44-70 70-48s33 56 64 28 35-48 63-48"/><circle cx="21" cy="99" r="8"/><circle cx="91" cy="51" r="8"/><circle cx="155" cy="79" r="8"/><circle cx="218" cy="31" r="8"/></svg>`; }
function commandIcon(): string { return `<svg viewBox="0 0 240 128" aria-hidden="true"><rect x="20" y="18" width="200" height="92" rx="9"/><circle cx="40" cy="36" r="4"/><circle cx="54" cy="36" r="4"/><path d="m48 67 17 12-17 12M79 91h36M139 67h49"/></svg>`; }
function hotspotIcon(): string { return `<svg viewBox="0 0 240 128" aria-hidden="true"><path d="M20 101 66 38l36 42 31-27 34 26 22-38 31 60Z"/><circle cx="136" cy="62" r="21"/><path d="M136 28v17m0 34v17m-34-34h17m34 0h17"/></svg>`; }
