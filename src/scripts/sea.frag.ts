// A watercolour sea: bands of brush strokes that get finer toward the horizon, laid in a few
// flat tones with darker wet edges, and dry-brush highlights where the light falls.
// Colours come from the time-of-day palette.
export default /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uHorizon, uGlow, uSeaFar, uSeaMid, uSeaNear, uSeaLight;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float a = 0.5, v = 0.0;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.03 + 5.7;
    a *= 0.5;
  }
  return v;
}

const float HORIZON = 0.67;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec3 col;
  if (uv.y > HORIZON) {
    // A pale strip of sky; the canvas fades out above it.
    col = mix(uHorizon, uGlow, 0.25 * exp(-abs(uv.x - 0.5 - (uMouse.x - 0.5) * 0.1) * 6.0));
  } else {
    float depth = (HORIZON - uv.y) / HORIZON;          // 0 at the horizon, 1 at the bottom
    float z = 1.0 / (depth + 0.07);                     // perspective: far water is compressed
    vec2 p = vec2((uv.x - 0.5) * aspect * z * 0.55, z * 1.9);

    // Brush strokes: long in x, short in y, drifting sideways and rolling toward the viewer.
    float swell = sin(p.y * 3.1 - uTime * 0.55 + fbm(p * 0.5) * 5.0);
    float n = fbm(vec2(p.x * 0.9 + uTime * 0.035, p.y * 2.6 - uTime * 0.16)) + swell * 0.07;
    n += (noise(p * vec2(3.0, 9.0) + 2.0) - 0.5) * 0.05;

    // Tones: far, middle, near, chosen by depth; strokes flip between neighbouring tones.
    vec3 base = mix(uSeaFar, uSeaMid, smoothstep(0.0, 0.42, depth));
    base = mix(base, uSeaNear, smoothstep(0.35, 1.0, depth));
    vec3 lighter = mix(base, uSeaFar, 0.45);
    vec3 darker = mix(base, uSeaNear, 0.45) * 0.94;
    float t1 = smoothstep(0.455, 0.470, n);
    float t2 = smoothstep(0.545, 0.560, n);
    col = mix(darker, base, t1);
    col = mix(col, lighter, t2);
    // Wet edges between tones.
    float rim = t1 * (1.0 - smoothstep(0.470, 0.492, n)) + t2 * (1.0 - smoothstep(0.560, 0.580, n));
    col = mix(col, darker * 0.9, rim * 0.28);

    // Light on the water: a path under the sun or moon, painted as broken dry-brush dashes.
    float sunX = 0.5 + 0.11 * clamp(aspect, 0.5, 2.4) / 2.4 + (uMouse.x - 0.5) * 0.12;
    float path = exp(-pow((uv.x - sunX) / (0.05 + depth * 0.16), 2.0));
    float dash = smoothstep(0.60, 0.63, fbm(vec2(p.x * 2.4 - uTime * 0.05, p.y * 7.0 - uTime * 0.5)));
    float sparkle = smoothstep(0.66, 0.69, n) * 0.35;
    col = mix(col, uSeaLight, clamp(path * dash * 0.95 + sparkle * (1.0 - depth * 0.6), 0.0, 1.0));

    // Haze where the sea meets the sky.
    col = mix(col, uHorizon, exp(-depth * 26.0) * 0.75);
  }
  col *= 0.965 + 0.07 * noise(gl_FragCoord.xy * 0.7);
  gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);
}
`;
