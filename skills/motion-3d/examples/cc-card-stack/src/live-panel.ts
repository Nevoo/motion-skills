import type {Player, Plugin} from '@canvas-commons/core';

const playerRef: {current: Player | null} = {current: null};

export function capturePlayerPlugin(): Plugin {
  return {
    name: 'live-panel-player-capture',
    player(player: Player) {
      playerRef.current = player;
    },
  };
}

export function requestRender(): void {
  playerRef.current?.requestRender();
}

export interface ParamMeta {
  min: number;
  max: number;
  step: number;
  label?: string;
  structural?: boolean;
  group?: string;
}

export interface ParamSet<T extends Record<string, number>> {
  values: T;
  meta: {[K in keyof T]: ParamMeta};
}

export interface Variant<T> {
  label: string;
  values: Partial<T>;
}

export interface PanelOptions<T extends Record<string, number>> {
  onChange?: () => void;
  variants?: Variant<T>[];
  loop?: {from: number; length: number};
}

interface Entry {
  params: ParamSet<Record<string, number>>;
  defaults: Record<string, number>;
  builtWith: Record<string, number>;
  onChange: () => void;
  refresh: () => void;
}

const entries = new Map<string, Entry>();
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const storageKey = (title: string, part: string) => `live-panel:${slug(title)}:${part}`;

function load<V>(key: string, fallback: V): V {
  try {
    const raw = localStorage.getItem(key);
    return raw ? {...fallback, ...JSON.parse(raw)} : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage blocked: keep working for this session
  }
}

function persist(title: string, entry: Entry): void {
  const diff: Record<string, number> = {};
  for (const [k, v] of Object.entries(entry.params.values)) {
    if (v !== entry.defaults[k]) diff[k] = v;
  }
  save(storageKey(title, 'values'), diff);
}

export function mountPanel<T extends Record<string, number>>(
  title: string,
  params: ParamSet<T>,
  options: PanelOptions<T> | (() => void) = {},
): void {
  if (typeof document === 'undefined') return;
  const opts: PanelOptions<T> = typeof options === 'function' ? {onChange: options} : options;
  const set = params as unknown as ParamSet<Record<string, number>>;

  const existing = entries.get(title);
  const defaults = existing?.defaults ?? {...set.values};
  Object.assign(set.values, load(storageKey(title, 'values'), {}));

  const id = `live-panel-${slug(title)}`;
  if (existing && document.getElementById(id)) {
    existing.params = set;
    existing.onChange = opts.onChange ?? (() => {});
    existing.refresh();
    return;
  }
  document.getElementById(id)?.remove(); // stale DOM from a hot-reloaded copy of this module

  const entry: Entry = {
    params: set,
    defaults,
    builtWith: {...set.values},
    onChange: opts.onChange ?? (() => {}),
    refresh: () => {},
  };
  entries.set(title, entry);
  build(id, title, entry, opts as PanelOptions<Record<string, number>>);
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (style) node.style.cssText = style;
  if (text) node.textContent = text;
  return node;
}

const BTN =
  'padding:5px 8px;border-radius:4px;border:1px solid #444;background:#2a2a2e;color:#ddd;cursor:pointer;font:inherit';
const INPUT = 'width:58px;box-sizing:border-box;background:#1b1b1e;color:#eee;border:1px solid #444;border-radius:3px;font:inherit;padding:2px 4px';

function build(id: string, title: string, entry: Entry, opts: PanelOptions<Record<string, number>>): void {
  const index = entries.size - 1;
  const ui = load(storageKey(title, 'ui'), {
    open: true,
    from: opts.loop?.from ?? 0,
    length: opts.loop?.length ?? 2,
    loop: false,
    replay: true,
    variant: -1,
  });
  const saveUi = () => save(storageKey(title, 'ui'), ui);

  const root = el(
    'div',
    `position:fixed;top:${12 + index * 36}px;left:12px;z-index:${100000 - index};width:300px;` +
      'max-height:92vh;overflow:auto;background:#151517ee;color:#ddd;border:1px solid #333;' +
      'border-radius:6px;font:11px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px #0006',
  );
  root.id = id;

  const head = el('div', 'display:flex;align-items:center;gap:6px;padding:6px 8px;border-bottom:1px solid #333');
  head.append(el('strong', 'flex:1', title));
  const toggle = el('button', BTN);
  head.append(toggle);
  const body = el('div', 'padding:6px 8px;display:flex;flex-direction:column;gap:6px');
  const showBody = () => {
    body.style.display = ui.open ? 'flex' : 'none';
    toggle.textContent = ui.open ? 'hide panel' : 'show panel';
  };
  toggle.onclick = () => {
    ui.open = !ui.open;
    saveUi();
    showBody();
  };
  root.append(head, body);

  const status = el('div', 'color:#8a8a8a;min-height:14px');
  const reloadBtn = el('button', BTN, 'reload to apply');
  reloadBtn.onclick = () => location.reload();
  const needsReload = (values: Record<string, number>) =>
    Object.keys(entry.params.meta).some(k => entry.params.meta[k].structural && values[k] !== entry.builtWith[k]);
  const paintReload = () => {
    const pending = needsReload(entry.params.values);
    reloadBtn.style.background = pending ? '#8a4b12' : '#2a2a2e';
    reloadBtn.textContent = pending ? 'reload to apply (pending)' : 'reload to apply';
  };

  const live = () => {
    entry.onChange();
    requestRender();
  };

  const loopBox = el('div', 'display:flex;flex-wrap:wrap;gap:6px;align-items:center');
  const numberField = (label: string, key: 'from' | 'length', step: number) => {
    const wrap = el('label', 'display:flex;gap:4px;align-items:center', label);
    const input = el('input', INPUT);
    input.type = 'number';
    input.step = String(step);
    input.value = String(ui[key]);
    input.onchange = () => {
      ui[key] = Math.max(key === 'length' ? 0.1 : 0, Number(input.value) || 0);
      saveUi();
    };
    wrap.append(input);
    return wrap;
  };
  const loopCheck = el('input');
  loopCheck.type = 'checkbox';
  loopCheck.checked = ui.loop;
  const loopLabel = el('label', 'display:flex;gap:4px;align-items:center');
  loopLabel.append(loopCheck, document.createTextNode('loop playback'));
  const playBtn = el('button', BTN, 'play loop');

  let unsubscribe: (() => void) | null = null;
  const frames = () => {
    const playback = playerRef.current?.status;
    if (!playback) return null;
    return {start: playback.secondsToFrames(ui.from), end: playback.secondsToFrames(ui.from + ui.length)};
  };
  const watchLoop = () => {
    unsubscribe?.();
    unsubscribe = null;
    if (!ui.loop || !playerRef.current) return;
    unsubscribe = playerRef.current.onFrameChanged.subscribe(frame => {
      const range = frames();
      if (range && frame > range.end) playerRef.current?.requestSeek(range.start);
    }, false);
  };
  const playLoop = () => {
    const range = frames();
    if (!range) {
      status.textContent = 'player not captured: add capturePlayerPlugin() to project.ts';
      return;
    }
    playerRef.current?.requestSeek(range.start);
    playerRef.current?.togglePlayback(true);
  };
  loopCheck.onchange = () => {
    ui.loop = loopCheck.checked;
    saveUi();
    watchLoop();
  };
  playBtn.onclick = playLoop;
  loopBox.append(numberField('loop from (s)', 'from', 0.05), numberField('loop length (s)', 'length', 0.05), loopLabel, playBtn);
  body.append(loopBox);
  if (ui.loop) setTimeout(watchLoop, 0);

  const variantButtons: HTMLButtonElement[] = [];
  const variants = (opts.variants ?? []).slice(0, 9);
  const variantValues = (i: number) => ({...entry.defaults, ...(variants[i].values as Record<string, number>)});
  const paintVariants = () =>
    variantButtons.forEach((b, i) => {
      b.style.background = i === ui.variant ? '#3f6fd1' : '#2a2a2e';
      b.style.color = i === ui.variant ? '#fff' : '#ddd';
      const badge = b.querySelector('span') as HTMLSpanElement;
      const reload = needsReload(variantValues(i));
      badge.style.display = reload ? 'inline' : 'none';
      b.title = reload ? 'changes a * setting: reload after switching' : '';
    });
  const applyVariant = (i: number) => {
    const v = variants[i];
    if (!v) return;
    Object.assign(entry.params.values, variantValues(i));
    ui.variant = i;
    saveUi();
    paintVariants();
    paintReload();
    persist(title, entry);
    entry.refresh();
    live();
    status.textContent = `variant ${i + 1}: ${v.label}`;
    if (ui.replay) playLoop();
  };
  if (variants.length) {
    body.append(el('div', 'color:#8a8a8a;margin-top:4px', 'variants (keys 1-9)'));
    const grid = el('div', 'display:grid;grid-template-columns:repeat(3,1fr);gap:4px');
    variants.forEach((v, i) => {
      const b = el('button', BTN, `${i + 1} ${v.label}`);
      b.dataset.variant = String(i + 1);
      b.append(el('span', 'margin-left:4px;padding:0 3px;border-radius:3px;background:#8a4b12;color:#fff;font-size:9px', 'reload'));
      b.onclick = () => applyVariant(i);
      variantButtons.push(b);
      grid.append(b);
    });
    const replay = el('input');
    replay.type = 'checkbox';
    replay.checked = ui.replay;
    replay.onchange = () => {
      ui.replay = replay.checked;
      saveUi();
    };
    const replayLabel = el('label', 'display:flex;gap:4px;align-items:center');
    replayLabel.append(replay, document.createTextNode('replay loop when switching'));
    body.append(grid, replayLabel);
    paintVariants();
    window.addEventListener('keydown', event => {
      const target = event.target as HTMLElement | null;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (!document.getElementById(id)) return;
      const i = Number(event.key) - 1;
      if (Number.isInteger(i) && i >= 0 && i < variants.length) applyVariant(i);
    });
  }

  const refreshers: (() => void)[] = [];
  let group: string | undefined;
  for (const key of Object.keys(entry.params.meta)) {
    const meta = entry.params.meta[key];
    if (meta.group !== undefined && meta.group !== group) {
      group = meta.group;
      body.append(el('div', 'margin-top:6px;color:#9ab;font-weight:600', group));
    }
    const row = el('div', 'display:grid;grid-template-columns:96px 1fr 58px;gap:6px;align-items:center');
    const name = el('span', 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap');
    name.textContent = `${meta.label ?? key}${meta.structural ? ' *' : ''}`;
    name.title = name.textContent;
    const range = el('input', 'width:100%');
    const num = el('input', INPUT);
    range.type = 'range';
    num.type = 'number';
    for (const input of [range, num]) {
      input.min = String(meta.min);
      input.max = String(meta.max);
      input.step = String(meta.step);
    }
    const set = (raw: string) => {
      const v = Number(raw);
      if (!Number.isFinite(v)) return;
      entry.params.values[key] = v;
      range.value = num.value = String(v);
      persist(title, entry);
      ui.variant = -1;
      saveUi();
      paintVariants();
      paintReload();
      if (!meta.structural) live();
    };
    range.oninput = () => set(range.value);
    num.onchange = () => set(num.value);
    refreshers.push(() => {
      range.value = num.value = String(entry.params.values[key]);
    });
    row.append(name, range, num);
    body.append(row);
  }
  entry.refresh = () => refreshers.forEach(r => r());
  entry.refresh();

  const actions = el('div', 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px');
  const copyBtn = el('button', BTN, 'copy values');
  copyBtn.onclick = () => {
    const text = JSON.stringify(entry.params.values, null, 2);
    const fallback = () => {
      console.log(`[live-panel: ${title}]\n${text}`);
      status.textContent = 'clipboard blocked: values printed to the console';
    };
    if (!navigator.clipboard) return fallback();
    navigator.clipboard.writeText(text).then(() => (status.textContent = 'values copied'), fallback);
  };
  const resetBtn = el('button', BTN, 'reset to defaults');
  resetBtn.onclick = () => {
    Object.assign(entry.params.values, entry.defaults);
    ui.variant = -1;
    saveUi();
    persist(title, entry);
    location.reload();
  };
  actions.append(copyBtn, resetBtn, reloadBtn);
  body.append(el('div', 'color:#8a8a8a', '* applies after reload'), actions, status);

  paintReload();
  showBody();
  document.body.append(root);
}
