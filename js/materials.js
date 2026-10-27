// Custom shader materials: a "holographic" semi-transparent rim-lit
// material for anatomy shells, and a soft glowing point material for
// airflow particles.
import * as THREE from '../vendor/three.module.min.js';

// Fresnel (rim-glow) material. Edges facing away from the camera glow,
// centres stay mostly see-through, giving an X-ray / hologram look.
export function fresnelMaterial({
  color = 0x66aaff,
  rimColor = null,
  opacity = 0.5,
  base = 0.08,
  power = 2.2,
  side = THREE.FrontSide,
  additive = true,
} = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uRim: { value: new THREE.Color(rimColor ?? color) },
      uOpacity: { value: opacity },
      uBase: { value: base },
      uPower: { value: power },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uRim;
      uniform float uOpacity;
      uniform float uBase;
      uniform float uPower;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), uPower);
        vec3 col = mix(uColor * 0.6, uRim, f);
        float a = (uBase + f) * uOpacity;
        gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
      }
    `,
    transparent: true,
    depthWrite: false,
    side,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  mat.userData.baseOpacity = opacity;
  return mat;
}

// Soft round glowing points. Size is given in world units per particle
// (attribute aSize) and scaled by perspective.
export function particleMaterial({ color = 0x4fb6ff, opacity = 1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uScale: { value: 800 },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aAlpha;
      uniform float uScale;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(aSize * uScale / max(0.001, -mv.z), 0.0, 48.0);
        gl_Position = projectionMatrix * mv;
        vAlpha = aAlpha;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        if (a <= 0.001) discard;
        vec3 col = uColor * (0.55 + 0.9 * a * a) + vec3(0.25) * a * a * a;
        gl_FragColor = vec4(col, a * vAlpha * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function setOpacity(mat, o) {
  if (mat.uniforms && mat.uniforms.uOpacity) mat.uniforms.uOpacity.value = o;
  else mat.opacity = o;
}
