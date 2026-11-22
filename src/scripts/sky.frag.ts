// A soft blue sky with cumulus clouds receding toward the horizon, plus thin cirrus streaks.
// Clouds are fbm noise on a plane overhead, seen through a real perspective camera, so they are
// large at the top of the canvas and small and dense near the horizon at the bottom.
// Colours come from the time-of-day palette; at midday they are the original soft-blue values.
export default /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uZenith, uMid, uHorizon, uCloud, uShade, uGlow;
uniform float uNight;

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
    p = ROT * p * 2.04 + 7.1;
    a *= 0.5;
  }
  return v;
}
float fbm3(vec2 p) {
  float a = 0.5, v = 0.0;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = ROT * p * 2.1 + 3.3;
    a *= 0.5;
  }
  return v;
}

// Cumulus density: large shapes, then finer noise eats into the edges to make them billowy.
float cumulus(vec2 q, float t) {
  vec2 w = vec2(t * 0.020, t * 0.006);
  float base = fbm(q * 0.72 + w + 0.30 * vec2(fbm3(q * 0.5 + 2.0), fbm3(q * 0.5 + 9.0)));
  float detail = fbm(q * 3.1 + w * 2.2);
  // A slow, very large mask leaves open patches of blue between cloud fields.
  float field = fbm3(q * 0.16 + w * 0.5 + 21.0);
  return base + (detail - 0.5) * 0.26 + (field - 0.5) * 0.30;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 m = uMouse - 0.5;
  // Camera looks slightly up; the horizon sits just below the bottom edge of the canvas.
  // Portrait canvases get a wider lens so phones also see the cloud field, not only the zenith.
  float wide = clamp(uRes.x / uRes.y - 0.5, 0.0, 1.0);
  vec3 rd = normalize(vec3(p.x + m.x * 0.04, p.y + 0.66 - m.y * 0.03, mix(0.62, 0.95, wide)));
  float e = rd.y;

  vec3 col = mix(uHorizon, uMid, smoothstep(0.02, 0.38, e));
  col = mix(col, uZenith, smoothstep(0.30, 0.85, e));

  // Night: stars, and a shooting star now and then.
  if (uNight > 0.01) {
    vec2 cell = floor(gl_FragCoord.xy / 2.0);
    float star = step(0.9965, hash(cell)) * (0.6 + 0.4 * sin(uTime * 1.7 + hash(cell + 3.0) * 40.0));
    col += uNight * star * smoothstep(0.12, 0.5, e) * vec3(0.9, 0.95, 1.0);
    float cycle = floor(uTime / 11.0);
    float run = fract(uTime / 11.0) / 0.09;
    if (run < 1.0) {
      vec2 from = vec2(mix(-0.5, 0.9, hash(vec2(cycle, 1.0))), mix(0.18, 0.46, hash(vec2(cycle, 2.0))));
      vec2 dir = normalize(vec2(-0.86, -0.42));
      vec2 rel = p - (from + dir * run * 0.9);
      float along = dot(rel, -dir);
      float across = length(rel + dir * along);
      float tail = smoothstep(0.26, 0.0, along) * step(0.0, along);
      col += uNight * tail * smoothstep(0.004, 0.0, across) * sin(run * 3.1416) * vec3(1.0, 0.98, 0.9);
    }
  }

  // A warm lift on the side the light comes from; there is no sun disc.
  vec3 sunDir = normalize(vec3(0.55, 0.62, 0.56));
  float s = max(dot(rd, sunDir), 0.0);
  col += vec3(0.35, 0.30, 0.20) * pow(s, 6.0) * 0.5 * (1.0 - uNight);

  // Smaller clouds on portrait canvases, so a phone still shows several of them.
  vec2 q = rd.xz / e * mix(2.7, 1.55, wide);
  float far = smoothstep(0.10, 0.34, e);

  // Cirrus: noise stretched along one direction, very thin.
  vec2 c = ROT * q;
  float cir = fbm(vec2(c.x * 0.22, c.y * 1.5) + vec2(uTime * 0.012, 0.0));
  cir *= fbm3(c * 0.35 + 5.0) * 1.6;
  col = mix(col, uCloud, smoothstep(0.30, 0.62, cir) * 0.50 * far);

  float d = cumulus(q, uTime);
  float cover = smoothstep(0.455, 0.545, d);
  // Light comes from one side: thinner toward it means brighter.
  float toward = cumulus(q + sunDir.xz * 0.30, uTime);
  float lit = smoothstep(-0.10, 0.12, d - toward);
  float core = smoothstep(0.52, 0.74, d);
  vec3 shade = mix(uShade, mix(uShade, uCloud, 0.55), far);
  vec3 cloud = mix(shade, uCloud, clamp(lit * 0.75 + 0.35 - core * 0.18, 0.0, 1.0));
  cloud = mix(cloud, uHorizon, (1.0 - far) * 0.6);
  col = mix(col, cloud, cover * mix(0.55, 1.0, far) * smoothstep(0.04, 0.14, e));

  col = min(col, vec3(1.0));
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;
