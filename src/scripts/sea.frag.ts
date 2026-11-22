// Ray-marched ocean. Height field is a sum of sharpened sine waves where each wave nudges the
// sample point along its direction ("drag"), a common technique for cheap choppy water.
// GLSL ES 1.0 has no line continuation for macros, so the two detail levels are generated here.
const height = (name: string, octaves: number) => `
float ${name}(vec2 p) {
  float ang = 0.6, freq = 0.9, speed = 1.5, amp = 1.0, sum = 0.0, norm = 0.0;
  for (int i = 0; i < ${octaves}; i++) {
    vec2 dir = vec2(cos(ang), sin(ang));
    vec2 w = wave(p, dir, freq, uTime * speed);
    p += dir * w.y * amp * 0.34;
    sum += w.x * amp;
    norm += amp;
    amp *= 0.81;
    freq *= 1.19;
    speed *= 1.06;
    ang += GOLDEN;
  }
  return sum / norm;
}`;

export default /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;

const float DEPTH = 1.0;
const float SCALE = 0.30;
const float CAM_H = 1.5;
const float GOLDEN = 2.39996323;

vec2 wave(vec2 p, vec2 dir, float freq, float phase) {
  float x = dot(dir, p) * freq + phase;
  float w = exp(sin(x) - 1.0);
  return vec2(w, -w * cos(x));
}

${height("heightLo", 10)}
${height("heightHi", 26)}

vec3 sunDir() {
  // Keep the sun inside narrow (phone) canvases.
  float side = 0.10 * clamp(uRes.x / uRes.y, 0.5, 2.4);
  return normalize(vec3(side + (uMouse.x - 0.5) * 0.5, 0.20, 1.0));
}

vec3 sky(vec3 rd) {
  float y = max(rd.y, 0.0);
  vec3 col = mix(vec3(0.93, 0.97, 1.0), vec3(0.58, 0.80, 0.97), pow(y, 0.55));
  float s = max(dot(rd, sunDir()), 0.0);
  col += vec3(1.0, 0.93, 0.76) * (0.35 * pow(s, 12.0) + 0.5 * pow(s, 90.0));
  return col;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  // Gentle bobbing, like standing on a small boat.
  float bob = sin(uTime * 0.45) * 0.05;
  p.y += sin(uTime * 0.31) * 0.006;
  vec3 ro = vec3(0.0, CAM_H + bob, uTime * 0.6);
  vec3 rd = normalize(vec3(p.x, p.y - 0.17, 1.25));
  vec3 sun = sunDir();

  vec3 col;
  if (rd.y >= 0.0) {
    col = sky(rd);
    float s = max(dot(rd, sun), 0.0);
    col += vec3(1.0, 0.97, 0.88) * smoothstep(0.9993, 0.9997, s);
  } else {
    float tTop = -ro.y / rd.y;
    float tBot = -(ro.y + DEPTH) / rd.y;
    float t = tTop;
    vec3 pos = ro + rd * t;
    float h = 0.0;
    for (int i = 0; i < 56; i++) {
      h = heightLo(pos.xz * SCALE) * DEPTH - DEPTH;
      float gap = pos.y - h;
      if (gap < 0.012 * t) break;
      t += gap * 0.85;
      if (t > tBot) break;
      pos = ro + rd * t;
    }
    float e = max(0.012, t * 0.004);
    vec2 xz = pos.xz * SCALE;
    float hc = heightHi(xz);
    vec3 n = normalize(vec3(
      (hc - heightHi(xz + vec2(e, 0.0))) * DEPTH,
      e / SCALE,
      (hc - heightHi(xz + vec2(0.0, e))) * DEPTH));
    n = normalize(mix(n, vec3(0.0, 1.0, 0.0), smoothstep(20.0, 160.0, t) * 0.75));

    float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
    vec3 r = reflect(rd, n);
    r.y = abs(r.y);
    vec3 refl = sky(r);
    float spec = pow(max(dot(r, sun), 0.0), 420.0) * 7.0 + pow(max(dot(r, sun), 0.0), 40.0) * 0.25;
    refl += vec3(1.0, 0.96, 0.86) * spec;

    vec3 deep = vec3(0.05, 0.33, 0.60);
    vec3 shallow = vec3(0.20, 0.76, 0.86);
    vec3 body = mix(deep, shallow, smoothstep(0.15, 0.95, hc));
    body += vec3(0.9, 1.0, 1.0) * smoothstep(0.80, 1.0, hc) * 0.10;

    col = mix(body, refl, fres);
    col = mix(col, vec3(0.90, 0.96, 1.0), 1.0 - exp(-t * 0.010));
  }

  col = pow(col, vec3(0.94));
  gl_FragColor = vec4(col, 1.0);
}
`;
