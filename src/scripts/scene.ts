// Minimal WebGL runner for a full-canvas fragment shader.
// The canvas keeps its CSS gradient until the first frame is drawn, so no-WebGL still looks fine.
import { paletteChanges } from './palette.ts';

const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

export interface SceneOptions {
  maxDpr?: number;
  /** Render at this fraction of the canvas size; soft scenes upscale well. */
  scale?: number;
  /** Frames per second cap. */
  fps?: number;
  /** Extra uniforms, read on every frame: a number, or a vec3 as [r, g, b]. */
  uniforms?: () => Record<string, number | number[]>;
}

// Compiling shaders and the first frames cost real main-thread time on slow phones, so scenes
// start only after the page has painted and the browser is idle. The CSS gradient shows until then.
export function mountScene(canvas: HTMLCanvasElement, frag: string, opts: SceneOptions = {}) {
  const start = () => startScene(canvas, frag, opts);
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 200));
  if (document.readyState === 'complete') idle();
  else addEventListener('load', idle, { once: true });
}

// Without a GPU the browser renders WebGL on the CPU, and a full-screen shader then blocks the page.
const isSoftware = (gl: WebGLRenderingContext) => {
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
};

function startScene(canvas: HTMLCanvasElement, frag: string, { maxDpr = 1.5, scale = 1, fps = 60, uniforms }: SceneOptions) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;

  let uRes: WebGLUniformLocation | null, uTime: WebGLUniformLocation | null, uMouse: WebGLUniformLocation | null;
  let prog: WebGLProgram;
  let locs: Record<string, WebGLUniformLocation | null> = {};
  let ready = false;

  // Builds the program. Called at start and again whenever the browser restores a lost context.
  const setup = () => {
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader error');
      return s;
    };
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link error');
    } catch (e) {
      console.warn('[scene]', e);
      return false;
    }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    uRes = gl.getUniformLocation(prog, 'uRes');
    uTime = gl.getUniformLocation(prog, 'uTime');
    uMouse = gl.getUniformLocation(prog, 'uMouse');
    locs = {};
    gl.viewport(0, 0, canvas.width, canvas.height);
    return true;
  };
  ready = setup();
  if (!ready) return;

  // Reduced motion and CPU rendering both get one still frame, redrawn only on resize or theme change.
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || isSoftware(gl);
  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  let visible = false;
  let raf = 0;
  let drawn = false;
  // Start mid-cycle so the first frame already has developed clouds and waves.
  const t0 = performance.now() - 40_000;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, maxDpr) * scale;
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };

  const draw = (now: number) => {
    if (!ready || gl.isContextLost()) return;
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, still ? 40 : (now - t0) / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    if (uniforms) {
      for (const [name, value] of Object.entries(uniforms())) {
        const at = (locs[name] ??= gl.getUniformLocation(prog, name));
        if (typeof value === 'number') gl.uniform1f(at, value);
        else gl.uniform3f(at, value[0], value[1], value[2]);
      }
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!drawn) {
      drawn = true;
      canvas.classList.add('is-live');
    }
  };

  // A static or paused canvas still needs a frame when the reader switches themes.
  paletteChanges.addEventListener('change', () => draw(performance.now()));

  let last = 0;
  const loop = (now: number) => {
    if (now - last >= 1000 / fps - 2) {
      last = now;
      draw(now);
    }
    raf = visible && !document.hidden && !still ? requestAnimationFrame(loop) : 0;
  };
  const kick = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
  };

  new ResizeObserver(() => {
    resize();
    if (still || !raf) draw(performance.now());
  }).observe(canvas);
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      kick();
    },
    { rootMargin: '120px' },
  ).observe(canvas);
  document.addEventListener('visibilitychange', kick);
  addEventListener(
    'pointermove',
    (e) => {
      mouse.tx = e.clientX / innerWidth;
      mouse.ty = e.clientY / innerHeight;
    },
    { passive: true },
  );
  // Browsers may drop a WebGL context (many tabs, GPU pressure, a long sleep). The canvas then
  // goes blank and the CSS fallback shows through; rebuild as soon as the context comes back.
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    ready = false;
    drawn = false;
    cancelAnimationFrame(raf);
    raf = 0;
    canvas.classList.remove('is-live');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    ready = setup();
    if (!ready) return;
    resize();
    draw(performance.now());
    kick();
  });
  resize();
}
