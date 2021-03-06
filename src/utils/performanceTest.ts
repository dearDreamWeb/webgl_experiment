export default function performanceTest(canvas: HTMLCanvasElement) {
  // @ts-ignore
  const renderer = new GlRenderer(canvas);
  const vertex = `
      attribute vec2 a_vertexPosition;
      attribute float id;
      uniform float uTime;
  
      highp float random(vec2 co) {
        highp float a = 12.9898;
        highp float b = 78.233;
        highp float c = 43758.5453;
        highp float dt= dot(co.xy ,vec2(a,b));
        highp float sn= mod(dt,3.14);
        return fract(sin(sn) * c);
      }
      varying vec3 vColor;
      void main() {
        float t = id / 10000.0;
        float alpha = 6.28 * random(vec2(uTime, 2.0 + t));
        float c = cos(alpha);
        float s = sin(alpha);
        mat3 modelMatrix = mat3(
          c, -s, 0,
          s, c, 0,
          2.0 * random(vec2(uTime, t)) - 1.0, 2.0 * random(vec2(uTime, 1.0 + t)) - 1.0, 1
        );
        vec3 pos = modelMatrix * vec3(a_vertexPosition, 1);
        vColor = vec3(
          random(vec2(uTime, 4.0 + t)),
          random(vec2(uTime, 5.0 + t)),
          random(vec2(uTime, 6.0 + t))
        );
        gl_Position = vec4(pos, 1);
      }
    `;

  const fragment = `
      #ifdef GL_ES
      precision highp float;
      #endif
      varying vec3 vColor;
      
      void main() {
        gl_FragColor.rgb = vColor;
        gl_FragColor.a = 1.0;
      }
    `;

  const program = renderer.compileSync(fragment, vertex);
  renderer.useProgram(program);

  const alpha = (2 * Math.PI) / 3;
  const beta = 2 * alpha;

  const COUNT = 6000;
  renderer.setMeshData({
    positions: [
      [0, 0.1],
      [0.1 * Math.sin(alpha), 0.1 * Math.cos(alpha)],
      [0.1 * Math.sin(beta), 0.1 * Math.cos(beta)],
    ],
    instanceCount: COUNT,
    attributes: {
      id: { data: [...new Array(COUNT).keys()], divisor: 1 },
    },
  });

  function render(t: number) {
    renderer.uniforms.uTime = t / 1e6;
    renderer.render();
    requestAnimationFrame(render);
  }

  render(0);
}
