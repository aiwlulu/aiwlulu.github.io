// A painterly sky. Clouds have feathered, fraying edges and continuous light and shade for
// volume, with a thin high layer behind them, on an uneven pigment wash with paper granulation. Colours come from the time-of-day palette.
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
  for (int i = 0; i < 5; i++) {
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
float cumulus(vec2 q, float t) {
  vec2 w = vec2(t * 0.020, t * 0.006);
  float base = fbm(q * 0.72 + w + 0.30 * vec2(fbm3(q * 0.5 + 2.0), fbm3(q * 0.5 + 9.0)));
  // Medium-sized lumps give each cloud its rounded, piled-up puffs.
  float puff = fbm(q * 2.3 + w * 1.8 + 3.0);
  float field = fbm3(q * 0.16 + w * 0.5 + 21.0);
  return base + (puff - 0.5) * 0.24 + (field - 0.5) * 0.22;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 m = uMouse - 0.5;
  // Portrait canvases get a wider lens so phones also see the cloud field.
  float wide = clamp(uRes.x / uRes.y - 0.5, 0.0, 1.0);
  vec3 rd = normalize(vec3(p.x + m.x * 0.04, p.y + 0.66 - m.y * 0.03, mix(0.62, 0.95, wide)));
  float e = rd.y;

  // The wash: pigment is never even, so the gradient is nudged by slow noise.
  float wash = fbm3(p * 1.4 + 3.0) - 0.5;
  vec3 col = mix(uHorizon, uMid, smoothstep(0.02, 0.40, e + wash * 0.12));
  col = mix(col, uZenith, smoothstep(0.30, 0.88, e + wash * 0.18));
  col *= 1.0 - 0.06 * smoothstep(0.45, 0.80, fbm3(p * 2.9 + 11.0));

  // Stars come out at night.
  vec2 cell = floor(gl_FragCoord.xy / 2.0);
  float star = step(0.9965, hash(cell)) * (0.6 + 0.4 * sin(uTime * 1.7 + hash(cell + 3.0) * 40.0));
  col += uNight * star * smoothstep(0.12, 0.5, e) * vec3(0.9, 0.95, 1.0);

  // A shooting star crosses now and then (night only).
  float cycle = floor(uTime / 11.0);
  float run = fract(uTime / 11.0) / 0.09;
  if (uNight > 0.01 && run < 1.0) {
    vec2 from = vec2(mix(-0.5, 0.9, hash(vec2(cycle, 1.0))), mix(0.18, 0.46, hash(vec2(cycle, 2.0))));
    vec2 dir = normalize(vec2(-0.86, -0.42));
    vec2 rel = p - (from + dir * run * 0.9);
    float along = dot(rel, -dir);
    float across = length(rel + dir * along);
    float tail = smoothstep(0.26, 0.0, along) * step(0.0, along);
    col += uNight * tail * smoothstep(0.004, 0.0, across) * sin(run * 3.1416) * vec3(1.0, 0.98, 0.9);
  }

  vec3 sunDir = normalize(vec3(0.55, 0.62, 0.56));

  // The sun, painted into the sky at the upper right (the moon at night). It is drawn before the
  // clouds, so they drift across it and its light soaks into their edges.
  vec2 orb = vec2(0.5 * uRes.x / uRes.y - mix(0.16, 0.44, wide), 0.31) + m * vec2(0.02, -0.012);
  vec2 toOrb = p - orb;
  float od = length(toOrb);
  float ang = atan(toOrb.y, toOrb.x);
  // A slightly uneven rim, as a brush would leave.
  float rimWobble = (noise(vec2(ang * 3.0, 1.0)) - 0.5) * 0.004;
  float day = 1.0 - uNight;
  // Sun: a white-hot core, a warm disc, a wide soft bloom and faint slow-turning rays.
  float sunDisc = smoothstep(0.050 + rimWobble, 0.034, od);
  float bloom = 0.62 * exp(-od * 7.5) + 0.22 * exp(-od * 2.6);
  float rays = pow(noise(vec2(ang * 5.0 + uTime * 0.02, 3.0)), 3.0) * exp(-od * 4.2) * 0.40;
  col = mix(col, uGlow, clamp(bloom + rays, 0.0, 1.0) * day);
  col = mix(col, mix(uGlow, vec3(1.0, 0.995, 0.95), 0.75), sunDisc * day);
  // Moon: a pale disc with soft grey seas and a cool halo.
  float moonDisc = smoothstep(0.043 + rimWobble, 0.036, od);
  float seas = smoothstep(0.42, 0.68, fbm3(toOrb * 34.0 + 5.0)) * 0.20;
  col = mix(col, vec3(0.80, 0.86, 1.0), (0.34 * exp(-od * 9.0) + 0.10 * exp(-od * 3.0)) * uNight);
  col = mix(col, vec3(0.95, 0.96, 1.0) * (1.0 - seas), moonDisc * uNight);
  float orbLight = exp(-od * 3.2);

  vec2 q = rd.xz / e * mix(2.7, 1.55, wide);
  float far = smoothstep(0.10, 0.34, e);

  // A thin, high layer far away: gives the sky depth behind the main clouds.
  float high = fbm(q * 0.33 + vec2(uTime * 0.008, 4.0)) * fbm3(q * 0.9 + 13.0) * 2.0;
  col = mix(col, mix(uCloud, uHorizon, 0.4), smoothstep(0.42, 0.78, high) * 0.30 * far);

  // Main clouds. The outline is feathered and broken up by fine noise so it frays into wisps
  // instead of ending in a drawn line.
  float d = cumulus(q, uTime);
  float fray = (fbm(q * 5.5 + 5.0) - 0.5) * 0.085;
  float body = smoothstep(0.375, 0.465, d + fray);
  // Volume: light falls from the sun side, the thick middle and the underside sit in shade.
  float lit = smoothstep(-0.07, 0.09, d - cumulus(q + sunDir.xz * 0.34, uTime));
  float thick = smoothstep(0.43, 0.64, d);
  float under = smoothstep(-0.05, 0.08, d - cumulus(q + vec2(0.0, 0.22), uTime));
  // Thick cloud is bright where the sun reaches it and clearly shaded where it does not.
  float light = clamp(0.36 + 0.64 * lit + thick * 0.10 * lit - thick * 0.34 * (1.0 - lit) - under * 0.14, 0.0, 1.0);
  vec3 cloud = mix(uShade, uCloud, light);
  // Cloud near the sun or moon glows, most of all at its thin edges.
  cloud = mix(cloud, mix(uGlow, vec3(1.0), 0.5), orbLight * (0.22 + 0.45 * (1.0 - thick)) * mix(1.0, 0.45, uNight));
  // Edges take a little of the sky colour, as thin cloud does.
  cloud = mix(cloud, col, (1.0 - smoothstep(0.375, 0.52, d + fray)) * 0.18);
  cloud = mix(cloud, uHorizon, (1.0 - far) * 0.55);
  float alpha = body * mix(0.55, 1.0, far) * smoothstep(0.04, 0.14, e);
  alpha *= 1.0 - 0.35 * (1.0 - thick) * smoothstep(0.09, 0.0, od);
  col = mix(col, cloud, alpha);
  // A faint trace of the watercolour edge is kept, so the clouds still belong with the sea.
  float rim = body * (1.0 - smoothstep(0.465, 0.495, d + fray));
  col = mix(col, uShade * 0.95, rim * 0.07 * far);

  // Paper granulation.
  col *= 0.965 + 0.07 * noise(gl_FragCoord.xy * 0.9);
  gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);
}
`;
