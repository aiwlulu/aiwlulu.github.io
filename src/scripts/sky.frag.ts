// Drifting clouds on a pale blue sky. Clouds are fbm noise projected onto a plane overhead,
// lit from the sun side so they get a soft shaded underside.
export default /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;

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
const mat2 ROT = mat2(0.8, -0.6, 0.6, 0.8);
float fbm(vec2 p) {
  float a = 0.5, v = 0.0;
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = ROT * p * 2.03 + 7.1;
    a *= 0.5;
  }
  return v;
}
float density(vec2 q, float t) {
  vec2 warp = vec2(fbm(q * 0.6 + t * 0.02), fbm(q * 0.6 - t * 0.015 + 4.7));
  return fbm(q + warp * 0.9 + vec2(t * 0.045, 0.0));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y);
  vec2 m = uMouse - 0.5;

  vec3 col = mix(vec3(0.89, 0.95, 0.995), vec3(0.60, 0.81, 0.97), smoothstep(0.0, 1.0, uv.y));

  vec2 sun = vec2(0.30 * aspect, 0.80) + m * vec2(0.05, -0.03);
  float d = length(p - sun);
  float glow = 0.22 * exp(-d * 2.2) + 0.45 * exp(-d * 9.0) + smoothstep(0.080, 0.050, d);
  col = mix(col, vec3(1.0, 0.985, 0.93), min(glow, 1.0));

  // Mild perspective: clouds near the top of the canvas are closer and larger.
  vec2 q = vec2(p.x, uv.y * 1.5) / (uv.y * 0.55 + 0.70);
  q = q * 1.9 + m * 0.20;

  float n = density(q, uTime);
  float cover = smoothstep(0.43, 0.60, n);
  // Fixed light direction; comparing density toward the light gives a soft shaded underside.
  float lit = density(q + vec2(0.16, 0.20), uTime);
  float shade = smoothstep(-0.09, 0.10, n - lit);
  vec3 cloud = mix(vec3(0.76, 0.86, 0.96), vec3(1.0), shade);
  cloud = mix(cloud, vec3(1.0, 0.99, 0.95), min(glow, 1.0) * 0.6);
  col = mix(col, cloud, cover * 0.96 * smoothstep(0.02, 0.30, uv.y));

  // Thin high haze layer, moving a little faster.
  float haze = fbm(q * 0.45 + vec2(uTime * 0.02, 3.0));
  col = mix(col, vec3(1.0), smoothstep(0.55, 0.9, haze) * 0.22);

  col = min(col, vec3(1.0));
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;
