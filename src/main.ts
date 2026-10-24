import type { PortraitDocument } from '../lib/editor-document';
import { Camera } from './camera.ts';
import { createGridMesh, type GridMesh } from './mesh.ts';
import { Compositor } from './compositor.ts';
import { createTextureFromSource, createTextureFromPixels } from './glutil.ts';
import { deformPoints, buildControlPoints } from './mls.ts';
import { ControlPointStore } from './controlPoints.ts';
import { drawOverlay } from './overlay.ts';
import { setupInteraction } from './interaction.ts';
import { setupDevPanel } from './devpanel.ts';
import { exportComposite } from './exporter.ts';
import { generateTestPattern } from './testPattern.ts';
import { drawDetectionOverlay } from './detectionOverlay.ts';
import { initDetector, runDetection, type DetectionResult } from './detector.ts';
import { buildBodyEdit } from './bodyEdit.ts';
import { featherMatte, buildPremultipliedPerson } from './person.ts';
import { buildCleanPlate } from './inpaintCore.ts';
import { createInpaintWorker, inpaint } from './inpaintClient.ts';
import {
  GRID_QUADS,
  MAX_PREVIEW_SIZE,
  PREVIEW_PLATE_SIZE,
  type WarpOptions,
  type DebugOptions,
  type SliderState,
  type ViewOptions,
} from './state.ts';
export interface FigurRuntime {
  restore(document: PortraitDocument | null): Promise<void>;
  dispose(): void;
}
export function createFigurRuntime(
  onChange: (document: PortraitDocument) => void,
  onError: (message: string) => void,
): FigurRuntime {
  const controller = new AbortController();
  const signal = controller.signal;
  let disposed = false,
    restoring = false,
    frameId = 0,
    sourceVersion = 0;
  let sourceData: PortraitDocument['source'] = null;
  let pendingCamera: PortraitDocument['camera'] | null = null;
  const stage = document.getElementById('stage') as HTMLDivElement;
  const glCanvas = document.getElementById('gl') as HTMLCanvasElement;
  const overlayCanvas = document.getElementById('overlay') as HTMLCanvasElement;
  const dropHint = document.getElementById('drop-hint') as HTMLDivElement;
  const gl = glCanvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) {
    throw new Error('WebGL2 is not available in this browser.');
  }
  const octx = overlayCanvas.getContext('2d')!;
  const MAX_TEX = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const EXPORT_MAX = Math.min(4096, MAX_TEX); // native-layer cap (bounds worker/mem)
  const compositor = new Compositor(gl);
  const camera = new Camera();
  const store = new ControlPointStore();
  const worker = createInpaintWorker();
  const options: WarpOptions = {
    alpha: 1.2,
    localize: true,
    radius: 0,
    showControlPoints: true,
    showOriginal: false,
    showWireframe: false,
  };
  const debug: DebugOptions = { segModel: 'multiclass', showContour: false, showMatte: false, showPose: false };
  const sliders: SliderState = { bbl: 0, bust: 0, ceiling: 100, hips: 0, waist: 0 };
  const view: ViewOptions = { split: false, splitRatio: 0.5 };
  // ---- loaded-image state ----
  type ImageSrc = ImageBitmap | HTMLCanvasElement;
  let exportSource: ImageSrc | null = null;
  let mesh: GridMesh | null = null;
  let dstX = new Float32Array(0);
  let dstY = new Float32Array(0);
  let nativeW = 0;
  let nativeH = 0;
  let exportDims = { h: 0, w: 0 };
  let meshDirty = true;
  let lastMlsMs = 0;
  let bodyRadius = 0;
  let detection: DetectionResult | null = null;
  let detectToken = 0; // guards against stale async results
  // Layer textures.
  let originalTex: WebGLTexture | null = null;
  let personTexPreview: WebGLTexture | null = null;
  let plateTexPreview: WebGLTexture | null = null;
  let plateTexNative: WebGLTexture | null = null;
  let dpr = 1;
  const markDirty = () => {
    meshDirty = true;
    if (!restoring && !disposed) {
      onChange(snapshot());
    }
  };
  function snapshot(): PortraitDocument {
    const fit = nativeW && nativeH ? Math.min(stage.clientWidth / nativeW, stage.clientHeight / nativeH) * 0.92 : 1;
    const [cx, cy] = camera.toImage(stage.clientWidth / 2, stage.clientHeight / 2);
    return {
      camera: {
        centerX: nativeW ? cx / nativeW : 0.5,
        centerY: nativeH ? cy / nativeH : 0.5,
        zoom: nativeW ? camera.scale / fit : 1,
      },
      debug: { ...debug },
      options: { ...options, showOriginal: false },
      points: store.points.map((point) => ({ ...point })),
      selectedPoint: store.selectedId,
      sliders: { ...sliders },
      source: sourceData,
      version: 1,
      view: { ...view },
    };
  }
  // ---- dev panel ----
  const panel = setupDevPanel({
    debug,
    markDirty,
    onExport: doExport,
    onLoadTest: () => loadSource(generateTestPattern(1024, 1280), true),
    onOpenFile: openFile,
    onRedetect: () => void detect(),
    onResetView: () => {
      if (mesh) {
        camera.fit(nativeW, nativeH, stage.clientWidth, stage.clientHeight);
      }
      markDirty();
    },
    onUnloadTest: clearSource,
    options,
    signal,
    sliders,
    store,
    view,
  });
  initDetector()
    .then(() => {
      if (!disposed) {
        panel.setDetectStatus('models ready', 'ok');
      }
    })
    .catch(() => {
      if (!disposed) {
        panel.setDetectStatus('Automatic shape detection is unavailable; manual points still work.', 'err');
      }
    });
  // ---- interaction ----
  setupInteraction(overlayCanvas, {
    camera,
    imageSize: () => (mesh ? { h: nativeH, w: nativeW } : null),
    markDirty,
    onChange: () => panel.refreshList(),
    options,
    signal,
    store,
    view,
  });
  // ---- image loading ----
  async function openFile(file: File): Promise<void> {
    const version = ++sourceVersion;
    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 24 * 1024 * 1024) {
        throw new Error('Choose a JPG, PNG or WebP image up to 24 MB.');
      }
      const bitmap = await createImageBitmap(file);
      if (disposed || version !== sourceVersion) {
        bitmap.close();
        return;
      }
      const scale = Math.min(
        1,
        4096 / Math.max(bitmap.width, bitmap.height),
        Math.sqrt(4194304 / (bitmap.width * bitmap.height)),
      );
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(bitmap.width * scale));
      canvas.height = Math.max(1, Math.floor(bitmap.height * scale));
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      loadSource(canvas);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'This image could not be opened.');
    }
  }
  function loadSource(source: ImageSrc, isTestPattern = false): void {
    if (disposed) {
      return;
    }
    const persisted = document.createElement('canvas');
    persisted.width = source.width;
    persisted.height = source.height;
    persisted.getContext('2d')!.drawImage(source, 0, 0);
    const data = persisted.toDataURL('image/webp', 0.94);
    if (data.length > 16 * 1024 * 1024) {
      onError('This image is too large to save. Choose a smaller photo.');
      return;
    }
    sourceData = { data, height: source.height, testPattern: isTestPattern, width: source.width };
    if (exportSource instanceof ImageBitmap && exportSource !== source) {
      exportSource.close();
    }
    nativeW = source.width;
    nativeH = source.height;
    exportSource = source;
    exportDims = fitDims(nativeW, nativeH, EXPORT_MAX);
    mesh = createGridMesh(GRID_QUADS, GRID_QUADS, nativeW, nativeH);
    compositor.setMesh(mesh);
    dstX = new Float32Array(mesh.vertexCount);
    dstY = new Float32Array(mesh.vertexCount);
    disposeLayerTextures();
    originalTex = makeImageTexture(source, nativeW, nativeH);
    store.clear();
    sliders.waist = sliders.hips = sliders.bust = sliders.bbl = 0;
    panel.syncSliders();
    panel.applyImageSize(Math.min(nativeW, nativeH));
    panel.refreshList();
    camera.fit(nativeW, nativeH, stage.clientWidth, stage.clientHeight);
    dropHint.classList.add('hidden');
    document.body.classList.add('has-photo'); // lets the layout reveal the controls
    panel.setTestPatternLoaded(isTestPattern);
    meshDirty = true;
    detection = null;
    markDirty();
    void detect();
  }
  function clearSource(): void {
    sourceVersion++;
    sourceData = null;
    detectToken += 1;
    disposeLayerTextures();
    if (exportSource instanceof ImageBitmap) {
      exportSource.close();
    }
    exportSource = null;
    mesh = null;
    dstX = new Float32Array(0);
    dstY = new Float32Array(0);
    nativeW = 0;
    nativeH = 0;
    exportDims = { h: 0, w: 0 };
    bodyRadius = 0;
    detection = null;
    store.clear();
    sliders.waist = sliders.hips = sliders.bust = sliders.bbl = 0;
    view.split = false;
    view.splitRatio = 0.5;
    options.showOriginal = false;
    panel.applyImageSize(0);
    panel.syncSliders();
    panel.refreshList();
    panel.setTestPatternLoaded(false);
    panel.setDetectStatus('models ready', 'ok');
    dropHint.classList.remove('hidden');
    document.body.classList.remove('has-photo');
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    markDirty();
  }
  function disposeLayerTextures(): void {
    for (const t of [originalTex, personTexPreview, plateTexPreview, plateTexNative]) {
      if (t) {
        gl!.deleteTexture(t);
      }
    }
    originalTex = personTexPreview = plateTexPreview = plateTexNative = null;
  }
  /** Whole-image texture capped at MAX_PREVIEW_SIZE (the "before" / spacebar layer). */
  function makeImageTexture(source: TexImageSource, w: number, h: number): WebGLTexture {
    const long = Math.max(w, h);
    if (long <= MAX_PREVIEW_SIZE) {
      return createTextureFromSource(gl!, source);
    }
    const s = MAX_PREVIEW_SIZE / long;
    const c = document.createElement('canvas');
    c.width = Math.round(w * s);
    c.height = Math.round(h * s);
    c.getContext('2d')!.drawImage(source as CanvasImageSource, 0, 0, c.width, c.height);
    return createTextureFromSource(gl!, c);
  }
  // ---- M2 detection + M3 layer building ----
  async function detect(): Promise<void> {
    if (!exportSource) {
      return;
    }
    const token = ++detectToken;
    panel.setDetectStatus('detecting…', 'busy');
    try {
      const result = await runDetection(exportSource as CanvasImageSource, nativeW, nativeH, debug.segModel);
      if (disposed || token !== detectToken) {
        return;
      }
      detection = result;
      const { segMs, poseMs, totalMs } = result.timings;
      const covPct = (result.matte.coverage * 100).toFixed(1);
      console.debug(
        `[M2] segmentation ${segMs.toFixed(0)}ms · pose ${poseMs.toFixed(0)}ms · total ${totalMs.toFixed(0)}ms · ` +
          `model ${result.model} · matte ${covPct}% · ${result.contour ? 'contour 6/6' : 'no contour'}`,
      );
      panel.setDetectStatus(
        `done ${totalMs.toFixed(0)}ms · ${covPct}% matte · ${result.contour ? '6 pts' : 'no contour'}`,
        'ok',
      );
      buildPreviewLayers(result);
      meshDirty = true;
      void buildNativePlate(result, token);
    } catch {
      if (!disposed && token === detectToken) {
        detection = null;
        panel.setDetectStatus('Automatic detection unavailable; manual points remain available.', 'err');
      }
    }
  }
  /** Immediate preview person + plate so sliders work while the native plate runs. */
  function buildPreviewLayers(det: DetectionResult): void {
    // Person layer (premultiplied) at preview resolution.
    const pd = fitDims(nativeW, nativeH, MAX_PREVIEW_SIZE);
    const origP = sampleRGBA(exportSource!, pd.w, pd.h);
    const alphaP = featherMatte(
      det.matte.soft,
      det.matte.width,
      det.matte.height,
      pd.w,
      pd.h,
      featherSigma(Math.max(pd.w, pd.h)),
    );
    const personPx = buildPremultipliedPerson(origP, alphaP, pd.w, pd.h);
    if (personTexPreview) {
      gl!.deleteTexture(personTexPreview);
    }
    personTexPreview = createTextureFromPixels(gl!, personPx, pd.w, pd.h);
    // Clean plate at a small resolution (fast), replaced by the native plate later.
    const gd = fitDims(nativeW, nativeH, PREVIEW_PLATE_SIZE);
    const origG = sampleRGBA(exportSource!, gd.w, gd.h);
    const binG = upscaleBinaryNearest(det.matte.binary, det.matte.width, det.matte.height, gd.w, gd.h);
    const B = Math.max(4, 0.15 * personBBoxWidth(binG, gd.w, gd.h));
    const dil = Math.max(2, Math.round(Math.max(gd.w, gd.h) * 0.004));
    const plateG = buildCleanPlate(new Uint8Array(origG.buffer), binG, gd.w, gd.h, dil, B);
    if (plateTexPreview) {
      gl!.deleteTexture(plateTexPreview);
    }
    plateTexPreview = createTextureFromPixels(gl!, plateG, gd.w, gd.h);
    if (plateTexNative) {
      gl!.deleteTexture(plateTexNative);
      plateTexNative = null;
    }
  }
  /** Native clean plate, computed once in the worker. */
  async function buildNativePlate(det: DetectionResult, token: number): Promise<void> {
    const ed = exportDims;
    const orig = sampleRGBA(exportSource!, ed.w, ed.h);
    const bin = upscaleBinaryNearest(det.matte.binary, det.matte.width, det.matte.height, ed.w, ed.h);
    const B = Math.max(6, 0.15 * personBBoxWidth(bin, ed.w, ed.h));
    const dil = Math.max(3, Math.round(Math.max(ed.w, ed.h) * 0.004));
    const res = await inpaint(worker, {
      binary: bin,
      dilatePx: dil,
      erodePx: B,
      h: ed.h,
      rgba: new Uint8Array(orig.buffer, orig.byteOffset, orig.length),
      w: ed.w,
    });
    if (token !== detectToken) {
      return;
    }
    console.debug(`[M3] native plate ${res.w}x${res.h} inpaint ${res.ms.toFixed(0)}ms`);
    if (plateTexNative) {
      gl!.deleteTexture(plateTexNative);
    }
    plateTexNative = createTextureFromPixels(gl!, res.rgba, res.w, res.h);
  }
  // ---- deformation (drives the person mesh) ----
  function recompute(): void {
    if (!mesh) {
      return;
    }
    const origins: [number, number][] = [];
    const targets: [number, number][] = [];
    bodyRadius = 0;
    if (detection?.contour) {
      const be = buildBodyEdit(detection, sliders);
      if (be) {
        bodyRadius = be.radius;
        for (const p of be.pairs) {
          origins.push([p.ox, p.oy]);
          targets.push([p.tx, p.ty]);
        }
      }
    }
    for (const p of store.points) {
      origins.push([p.ox, p.oy]);
      targets.push([p.tx, p.ty]);
    }
    const cp = buildControlPoints(origins, targets);
    const radius = bodyRadius > 0 ? bodyRadius : options.radius;
    const t0 = performance.now();
    deformPoints(cp, mesh.srcX, mesh.srcY, dstX, dstY, mesh.vertexCount, {
      alpha: options.alpha,
      localize: options.localize,
      radius,
    });
    lastMlsMs = performance.now() - t0;
    compositor.updatePersonPositions(dstX, dstY, mesh.vertexCount);
  }
  async function doExport(): Promise<void> {
    if (!mesh || !exportSource) {
      alert('Load an image first.');
      return;
    }
    recompute();
    panel.setEditStatus('exporting…', 'busy');
    const ed = exportDims;
    const plate = plateTexNative ?? plateTexPreview ?? originalTex!;
    // Build the native premultiplied person for a crisp export.
    let personNative: WebGLTexture | null = null;
    if (detection) {
      const orig = sampleRGBA(exportSource, ed.w, ed.h);
      const alpha = featherMatte(
        detection.matte.soft,
        detection.matte.width,
        detection.matte.height,
        ed.w,
        ed.h,
        featherSigma(Math.max(ed.w, ed.h)),
      );
      const px = buildPremultipliedPerson(orig, alpha, ed.w, ed.h);
      personNative = createTextureFromPixels(gl!, px, ed.w, ed.h);
    }
    try {
      await exportComposite(
        gl!,
        compositor,
        plate,
        personNative ?? (!detection && store.points.length ? originalTex : null),
        ed.w,
        ed.h,
      );
      panel.setEditStatus(`exported ${ed.w}×${ed.h}`, 'ok');
    } catch (err) {
      console.error(err);
      panel.setEditStatus('export failed (see console)', 'err');
    } finally {
      if (personNative) {
        gl!.deleteTexture(personNative);
      }
    }
    meshDirty = true;
  }
  // ---- pixel helpers ----
  function sampleRGBA(source: CanvasImageSource, w: number, h: number): Uint8ClampedArray {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cx = c.getContext('2d', { willReadFrequently: true })!;
    cx.drawImage(source, 0, 0, w, h);
    return cx.getImageData(0, 0, w, h).data;
  }
  function upscaleBinaryNearest(bin: Uint8Array, sw: number, sh: number, dw: number, dh: number): Uint8Array {
    const out = new Uint8Array(dw * dh);
    for (let y = 0; y < dh; y++) {
      const sy = Math.min(sh - 1, Math.floor(((y + 0.5) * sh) / dh));
      for (let x = 0; x < dw; x++) {
        const sx = Math.min(sw - 1, Math.floor(((x + 0.5) * sw) / dw));
        out[y * dw + x] = bin[sy * sw + sx];
      }
    }
    return out;
  }
  function personBBoxWidth(bin: Uint8Array, w: number, h: number): number {
    let minX = w,
      maxX = -1;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        if (bin[row + x] === 1) {
          if (x < minX) {
            minX = x;
          }
          if (x > maxX) {
            maxX = x;
          }
        }
      }
    }
    return maxX >= minX ? maxX - minX : w;
  }
  function featherSigma(long: number): number {
    return Math.max(0.6, (1.5 * long) / 1024);
  }
  function fitDims(
    w: number,
    h: number,
    maxLong: number,
  ): {
    w: number;
    h: number;
  } {
    const long = Math.max(w, h);
    const s = long > maxLong ? maxLong / long : 1;
    return { h: Math.max(1, Math.round(h * s)), w: Math.max(1, Math.round(w * s)) };
  }
  // ---- resize ----
  /** Returns true when the drawing buffer actually changed size this frame. */
  function syncCanvasSize(): boolean {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const dw = Math.round(stage.clientWidth * dpr);
    const dh = Math.round(stage.clientHeight * dpr);
    let resized = false;
    if (glCanvas.width !== dw || glCanvas.height !== dh) {
      glCanvas.width = dw;
      glCanvas.height = dh;
      overlayCanvas.width = dw;
      overlayCanvas.height = dh;
      resized = true;
    }
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return resized;
  }
  // ---- render loop ----
  let frames = 0;
  let fpsClock = performance.now();
  function frame(): void {
    if (disposed) {
      return;
    }
    const resized = syncCanvasSize();
    const cssW = stage.clientWidth;
    const cssH = stage.clientHeight;
    // Re-fit on stage resize (breakpoint change, rotation, window drag) so the
    // photo is never left cropped or off-centre by a layout change.
    if (resized && mesh && cssW > 0 && cssH > 0) {
      camera.fit(nativeW, nativeH, cssW, cssH);
      meshDirty = true;
    }
    if (pendingCamera && mesh && cssW > 0 && cssH > 0) {
      const fit = Math.min(cssW / nativeW, cssH / nativeH) * 0.92;
      camera.scale = fit * pendingCamera.zoom;
      camera.offsetX = cssW / 2 - pendingCamera.centerX * nativeW * camera.scale;
      camera.offsetY = cssH / 2 - pendingCamera.centerY * nativeH * camera.scale;
      pendingCamera = null;
      meshDirty = true;
    }
    gl!.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    octx.clearRect(0, 0, cssW, cssH);
    if (mesh && originalTex) {
      if (meshDirty) {
        recompute();
        meshDirty = false;
      }
      const u = { canvasH: cssH, canvasW: cssW, offsetX: camera.offsetX, offsetY: camera.offsetY, scale: camera.scale };
      const plateTex = plateTexNative ?? plateTexPreview;
      const splitX = view.split ? cssW * view.splitRatio : 0;
      if (options.showOriginal) {
        compositor.drawQuad(originalTex, u);
      } else if (view.split) {
        compositor.drawQuad(originalTex, u); // left half stays "before"
        const dx = Math.round(splitX * dpr);
        gl!.enable(gl!.SCISSOR_TEST);
        gl!.scissor(dx, 0, glCanvas.width - dx, glCanvas.height);
        compositor.drawQuad(plateTex ?? originalTex, u);
        if (personTexPreview || store.points.length) {
          compositor.drawPerson(personTexPreview ?? originalTex, u);
        }
        if (options.showWireframe) {
          compositor.drawWireframe(u);
        }
        gl!.disable(gl!.SCISSOR_TEST);
      } else {
        compositor.drawQuad(plateTex ?? originalTex, u);
        if (personTexPreview || store.points.length) {
          compositor.drawPerson(personTexPreview ?? originalTex, u);
        }
        if (options.showWireframe) {
          compositor.drawWireframe(u);
        }
      }
      drawDetectionOverlay(octx, camera, detection, debug);
      drawOverlay(octx, cssW, cssH, camera, store, options);
      if (view.split && !options.showOriginal) {
        drawSplitDivider(splitX, cssW, cssH);
      }
    }
    frames++;
    const now = performance.now();
    if (now - fpsClock >= 500) {
      const fps = (frames * 1000) / (now - fpsClock);
      frames = 0;
      fpsClock = now;
      panel.setPerf(fps, lastMlsMs);
    }
    frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);
  const FIGUR_PINK = '#E83E8C';
  const CHIP_FONT = "700 11px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  function drawSplitDivider(x: number, cssW: number, cssH: number): void {
    // Visible photo rect in CSS px. Everything below is clipped to it, so the
    // divider never paints onto the stage background around the photo.
    const [sx0, sy0] = camera.toScreen(0, 0);
    const [sx1, sy1] = camera.toScreen(nativeW, nativeH);
    const imgL = Math.max(0, Math.min(sx0, sx1));
    const imgR = Math.min(cssW, Math.max(sx0, sx1));
    const imgT = Math.max(0, Math.min(sy0, sy1));
    const imgB = Math.min(cssH, Math.max(sy0, sy1));
    if (imgR <= imgL || imgB <= imgT) {
      return;
    } // photo fully off-screen
    octx.save();
    octx.beginPath();
    octx.rect(imgL, imgT, imgR - imgL, imgB - imgT);
    octx.clip();
    // Divider (clipped to the photo's visible top and bottom edges).
    octx.shadowColor = 'rgba(21,16,22,0.35)';
    octx.shadowBlur = 8;
    octx.strokeStyle = '#ffffff';
    octx.lineWidth = 2;
    octx.beginPath();
    octx.moveTo(x, imgT);
    octx.lineTo(x, imgB);
    octx.stroke();
    // Draggable handle, centred in the visible band of the photo.
    const cy = (imgT + imgB) / 2;
    octx.fillStyle = '#ffffff';
    octx.beginPath();
    octx.arc(x, cy, 18, 0, Math.PI * 2);
    octx.fill();
    octx.shadowColor = 'transparent';
    octx.strokeStyle = FIGUR_PINK;
    octx.lineWidth = 2;
    octx.lineCap = 'round';
    octx.beginPath();
    octx.moveTo(x - 4.5, cy - 5);
    octx.lineTo(x - 4.5, cy + 5);
    octx.moveTo(x + 4.5, cy - 5);
    octx.lineTo(x + 4.5, cy + 5);
    octx.stroke();
    octx.lineCap = 'butt';
    // Chips sit on the photo too, using the same rect. Each is drawn only when
    // its side of the photo is wide enough to hold it, so a divider near (or
    // past) an edge labels just the side that is actually showing.
    const chipY = Math.min(imgT + 14, Math.max(imgT, imgB - CHIP_H - 14));
    octx.font = CHIP_FONT;
    const wOriginal = Math.round(octx.measureText('ORIGINAL').width) + 24;
    const wEdited = Math.round(octx.measureText('EDITED').width) + 24;
    if (x - imgL >= wOriginal + 20) {
      drawChip('ORIGINAL', x - 12, 'right', 'rgba(21,16,22,0.82)', chipY, imgL, imgR, cssW);
    }
    if (imgR - x >= wEdited + 20) {
      drawChip('EDITED', x + 12, 'left', FIGUR_PINK, chipY, imgL, imgR, cssW);
    }
    octx.restore();
  }
  const CHIP_H = 26;
  /** Rounded label pill, kept inside the visible photo and inside the stage. */
  function drawChip(
    text: string,
    anchorX: number,
    align: 'left' | 'right',
    bg: string,
    y: number,
    imgL: number,
    imgR: number,
    cssW: number,
  ): void {
    octx.font = CHIP_FONT;
    const w = Math.round(octx.measureText(text).width) + 24;
    let left = align === 'right' ? anchorX - w : anchorX;
    left = Math.max(imgL + 10, Math.min(imgR - w - 10, left)); // stay on the photo
    left = Math.max(8, Math.min(cssW - w - 8, left)); // never leave the stage
    octx.fillStyle = bg;
    octx.beginPath();
    if (octx.roundRect) {
      octx.roundRect(left, y, w, CHIP_H, CHIP_H / 2);
    } else {
      octx.rect(left, y, w, CHIP_H);
    }
    octx.fill();
    octx.fillStyle = '#ffffff';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText(text, left + w / 2, y + CHIP_H / 2 + 0.5);
  }
  // ---- drag & drop ----
  function stopDnd(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
  }
  stage.addEventListener(
    'dragover',
    (e) => {
      stopDnd(e);
      stage.classList.add('dragover');
    },
    { signal },
  );
  stage.addEventListener(
    'dragleave',
    (e) => {
      stopDnd(e);
      stage.classList.remove('dragover');
    },
    { signal },
  );
  stage.addEventListener(
    'drop',
    (e) => {
      stopDnd(e);
      stage.classList.remove('dragover');
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        openFile(file);
      }
    },
    { signal },
  );
  window.addEventListener('dragover', (e) => e.preventDefault(), { signal });
  window.addEventListener('drop', (e) => e.preventDefault(), { signal });
  return {
    dispose() {
      disposed = true;
      detectToken++;
      sourceVersion++;
      controller.abort();
      cancelAnimationFrame(frameId);
      worker.terminate();
      disposeLayerTextures();
      compositor.dispose();
      if (exportSource instanceof ImageBitmap) {
        exportSource.close();
      }
      exportSource = null;
      mesh = null;
      document.body.classList.remove('has-photo');
    },
    async restore(saved) {
      restoring = true;
      try {
        clearSource();
        if (saved) {
          Object.assign(debug, saved.debug);
        }
        if (saved?.source) {
          const image = await createImageBitmap(await (await fetch(saved.source.data)).blob());
          if (disposed) {
            image.close();
            return;
          }
          if (image.width !== saved.source.width || image.height !== saved.source.height) {
            image.close();
            throw new Error('The saved photo could not be restored.');
          }
          loadSource(image, saved.source.testPattern);
          sourceData = saved.source;
        }
        if (saved && !disposed) {
          Object.assign(options, saved.options);
          Object.assign(debug, saved.debug);
          Object.assign(sliders, saved.sliders);
          Object.assign(view, saved.view);
          store.replace(saved.points, saved.selectedPoint);
          pendingCamera = saved.camera;
          panel.syncSliders();
          panel.syncOptions();
          panel.refreshList();
          meshDirty = true;
        }
      } finally {
        restoring = false;
      }
    },
  };
}
