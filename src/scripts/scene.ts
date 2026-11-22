// Minimal WebGL runner for a full-canvas fragment shader.
// The canvas keeps its CSS gradient until the first frame is drawn, so no-WebGL still looks fine.
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

export interface SceneOptions {
  maxDpr?: number;
}

export function mountScene(canvas: HTMLCanvasElement, frag: string, { maxDpr = 1.5 }: SceneOptions = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader error');
    return s;
  };
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link error');
  } catch (e) {
    console.warn('[scene]', e);
    return;
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uMouse = gl.getUniformLocation(prog, 'uMouse');

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  let visible = false;
  let raf = 0;
  let drawn = false;
  // Start mid-cycle so the first frame already has developed clouds and waves.
  const t0 = performance.now() - 40_000;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, maxDpr);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };

  const draw = (now: number) => {
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, still ? 40 : (now - t0) / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!drawn) {
      drawn = true;
      canvas.classList.add('is-live');
    }
  };

  const loop = (now: number) => {
    draw(now);
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
  resize();
}
