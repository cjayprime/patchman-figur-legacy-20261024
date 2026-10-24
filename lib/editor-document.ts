import type { ControlPoint } from '../src/controlPoints';
import type { WarpOptions, DebugOptions, SliderState, ViewOptions } from '../src/state';

export interface PortraitDocument {
  version: 1;
  source: { data: string; width: number; height: number; testPattern: boolean } | null;
  points: ControlPoint[];
  selectedPoint: number | null;
  options: WarpOptions;
  debug: DebugOptions;
  sliders: SliderState;
  view: ViewOptions;
  camera: { zoom: number; centerX: number; centerY: number };
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid portrait state.');
  }
  return value as Record<string, unknown>;
}
function number(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error('Invalid portrait value.');
  }
  return value;
}
function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw new Error('Invalid portrait setting.');
  }
  return value;
}
export function portraitDocument(value: unknown): PortraitDocument {
  const state = record(value);
  if (state.version !== 1) {
    throw new Error('Unsupported portrait version.');
  }
  let source: PortraitDocument['source'] = null;
  if (state.source !== null) {
    const image = record(state.source);
    const width = number(image.width, 1, 4096),
      height = number(image.height, 1, 4096);
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width * height > 4194304 ||
      typeof image.data !== 'string' ||
      image.data.length > 16 * 1024 * 1024 ||
      !/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(image.data)
    ) {
      throw new Error('The saved portrait image is invalid.');
    }
    source = { data: image.data, height, testPattern: boolean(image.testPattern), width };
  }
  if (!Array.isArray(state.points) || state.points.length > 40) {
    throw new Error('Use up to 40 shaping points.');
  }
  const points = state.points.map((item) => {
    const point = record(item);
    const id = number(point.id, 1, Number.MAX_SAFE_INTEGER);
    if (!Number.isInteger(id)) {
      throw new Error('Invalid shaping point.');
    }
    return {
      anchor: boolean(point.anchor),
      id,
      ox: number(point.ox, -16384, 16384),
      oy: number(point.oy, -16384, 16384),
      tx: number(point.tx, -16384, 16384),
      ty: number(point.ty, -16384, 16384),
    };
  });
  if (new Set(points.map((point) => point.id)).size !== points.length || (!source && points.length)) {
    throw new Error('Invalid shaping point set.');
  }
  const selected = state.selectedPoint === null ? null : number(state.selectedPoint, 1, Number.MAX_SAFE_INTEGER);
  if (selected !== null && !points.some((point) => point.id === selected)) {
    throw new Error('Invalid selected point.');
  }
  const options = record(state.options),
    debug = record(state.debug),
    sliders = record(state.sliders),
    view = record(state.view),
    camera = record(state.camera);
  if (!['selfie', 'multiclass'].includes(String(debug.segModel))) {
    throw new Error('Invalid segmentation model.');
  }
  return {
    camera: {
      centerX: number(camera.centerX, -100, 100),
      centerY: number(camera.centerY, -100, 100),
      zoom: number(camera.zoom, 0.001, 1000),
    },
    debug: {
      segModel: debug.segModel as DebugOptions['segModel'],
      showContour: boolean(debug.showContour),
      showMatte: boolean(debug.showMatte),
      showPose: boolean(debug.showPose),
    },
    options: {
      alpha: number(options.alpha, 0.2, 3),
      localize: boolean(options.localize),
      radius: number(options.radius, 0, 4096),
      showControlPoints: boolean(options.showControlPoints),
      showOriginal: false,
      showWireframe: boolean(options.showWireframe),
    },
    points,
    selectedPoint: selected,
    sliders: {
      bbl: number(sliders.bbl, 0, 100),
      bust: number(sliders.bust, 0, 100),
      ceiling: number(sliders.ceiling, 0, 100),
      hips: number(sliders.hips, 0, 100),
      waist: number(sliders.waist, 0, 100),
    },
    source,
    version: 1,
    view: { split: boolean(view.split), splitRatio: number(view.splitRatio, 0, 1) },
  };
}
