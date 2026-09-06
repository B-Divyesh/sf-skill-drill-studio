export type DrillKind = 'ordered' | 'command' | 'hotspot';

interface DrillBase {
  schema: 1;
  id: string;
  title: string;
  instructions: string;
  kind: DrillKind;
}

export interface OrderedDrill extends DrillBase {
  kind: 'ordered';
  items: string[];
}

export interface CommandDrill extends DrillBase {
  kind: 'command';
  prompt: string;
  answer: string;
  caseSensitive: boolean;
}

export interface HotspotDrill extends DrillBase {
  kind: 'hotspot';
  image: string;
  imageAlt: string;
  target: { x: number; y: number; radius: number };
}

export type Drill = OrderedDrill | CommandDrill | HotspotDrill;

export const starterDrills: Drill[] = [
  {
    schema: 1,
    id: 'sample-ordered',
    kind: 'ordered',
    title: 'Prepare a microscope slide',
    instructions: 'Put the slide preparation steps in the correct order.',
    items: ['Clean the glass slide', 'Place the sample in the center', 'Add one drop of mounting liquid', 'Lower the cover slip at an angle']
  },
  {
    schema: 1,
    id: 'sample-command',
    kind: 'command',
    title: 'Create a project folder',
    instructions: 'Enter the exact shell command. Nothing you type will be executed.',
    prompt: 'Create a directory named field-notes.',
    answer: 'mkdir field-notes',
    caseSensitive: true
  },
  {
    schema: 1,
    id: 'sample-hotspot',
    kind: 'hotspot',
    title: 'Find the compass',
    instructions: 'Select the compass on the workbench.',
    image: '/assets/sample-workbench.svg',
    imageAlt: 'Illustrated field-station workbench with a radio, notebook, compass, and lamp.',
    target: { x: 72.2, y: 71.2, radius: 11 }
  }
];

export function newDrill(kind: DrillKind): Drill {
  const base = { schema: 1 as const, id: makeId(), title: '', instructions: '', kind };
  if (kind === 'ordered') return { ...base, kind, items: ['', '', ''] };
  if (kind === 'command') return { ...base, kind, prompt: '', answer: '', caseSensitive: true };
  return {
    ...base,
    kind,
    image: '/assets/sample-workbench.svg',
    imageAlt: 'Illustrated field-station workbench with a radio, notebook, compass, and lamp.',
    target: { x: 72.2, y: 71.2, radius: 11 }
  };
}

export function makeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `drill-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function checkCommand(drill: CommandDrill, attempt: string): boolean {
  return drill.caseSensitive ? attempt === drill.answer : attempt.toLocaleLowerCase() === drill.answer.toLocaleLowerCase();
}

export function checkOrdered(expected: string[], attempt: string[]): boolean {
  return expected.length === attempt.length && expected.every((item, index) => item === attempt[index]);
}

export function checkHotspot(target: HotspotDrill['target'], x: number, y: number): boolean {
  return Math.hypot(target.x - x, target.y - y) <= target.radius;
}

export function practiceOrder(items: string[], run: number): string[] {
  if (items.length < 2) return [...items];
  const copy = [...items];
  let seed = (run + 1) * 9301 + 49297;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    seed = (seed * 233280 + 1) % 2147483647;
    const swap = seed % (index + 1);
    [copy[index], copy[swap]] = [copy[swap]!, copy[index]!];
  }
  if (checkOrdered(items, copy)) [copy[0], copy[1]] = [copy[1]!, copy[0]!];
  return copy;
}

export function validateDrill(value: unknown): Drill {
  if (!isRecord(value) || value.schema !== 1 || !isText(value.id, 100) || !isText(value.title, 120) || !isText(value.instructions, 500)) {
    throw new Error('This is not a valid Skill Drill Studio file.');
  }
  if (value.kind === 'ordered') {
    if (!Array.isArray(value.items) || value.items.length < 2 || value.items.length > 12 || !value.items.every((item) => isText(item, 240))) {
      throw new Error('Ordered drills need 2–12 non-empty steps.');
    }
    return { schema: 1, id: value.id, title: value.title, instructions: value.instructions, kind: value.kind, items: [...value.items] };
  }
  if (value.kind === 'command') {
    if (!isText(value.prompt, 500) || !isText(value.answer, 500) || typeof value.caseSensitive !== 'boolean') {
      throw new Error('The command prompt or exact answer is missing.');
    }
    return { schema: 1, id: value.id, title: value.title, instructions: value.instructions, kind: value.kind, prompt: value.prompt, answer: value.answer, caseSensitive: value.caseSensitive };
  }
  if (value.kind === 'hotspot') {
    if (!validImage(value.image) || !isText(value.imageAlt, 300) || !isRecord(value.target) || !inRange(value.target.x, 0, 100) || !inRange(value.target.y, 0, 100) || !inRange(value.target.radius, 3, 30)) {
      throw new Error('The hotspot image or target area is invalid.');
    }
    return { schema: 1, id: value.id, title: value.title, instructions: value.instructions, kind: value.kind, image: value.image, imageAlt: value.imageAlt, target: { x: value.target.x, y: value.target.y, radius: value.target.radius } };
  }
  throw new Error('This drill type is not supported.');
}

export function validImage(source: unknown): source is string {
  if (typeof source !== 'string' || source.length > 2_800_000) return false;
  return source === '/assets/sample-workbench.svg' || /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(source);
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

function inRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}
