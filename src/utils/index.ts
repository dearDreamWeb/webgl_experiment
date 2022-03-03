import triangulation from './triangulation';
import particleAnimation from './particleAnimation';
import drawPolyline from './drawPolyline';
import performanceTest from './performanceTest';
import Vector2D from './vector2d.js';
import { earcut } from './earcut.js';
import filter, { updateFilter } from './filter';
import drawCube from './drawCube';

/**
 * 
 * @param gl webgl上下文
 * @param vertex 顶点着色器程序
 * @param fragment 片元着色器程序
 * @returns 
 */
export function getGl(gl: WebGLRenderingContext, vertex?: string, fragment?: string) {
  vertex = vertex || `
    attribute vec2 position;

    void main() {
        gl_PointSize = 1.0;
        gl_Position = vec4(position,0.0, 1.0);
    }
`;

  fragment = fragment || `
    void main() {
        gl_FragColor = vec4(1.0,0.0,0.0, 1.0);
    }
`;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vertexShader, vertex);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fragmentShader, fragment);
  gl.compileShader(fragmentShader);

  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);
  return program;
}
// 根据点来绘制图形
export function draw(
  gl: WebGLRenderingContext,
  paramPoints: number[],
  type: string
) {
  const vertex = `
      attribute vec2 position;

      void main() {
          gl_PointSize = 5.0;
          gl_Position = vec4(position,0.0, 1.0);
      }
  `;

  const fragment = `
      void main() {
          gl_FragColor = vec4(1.0,0.0,0.0, 1.0);
      }
  `;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vertexShader, vertex);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fragmentShader, fragment);
  gl.compileShader(fragmentShader);

  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  let arr = [];
  if (type === 'helical') {
    arr = paramPoints.map((item) => item / 244);
  } else if (type === 'star') {
    arr = paramPoints.map((item) => item / 5);
  } else if (type === 'quadricBezier') {
    arr = paramPoints.map((item) => item / 196);
  } else {
    arr = [...paramPoints];
  }
  const points = new Float32Array(arr);
  const bufferId = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

  const vPosition = gl.getAttribLocation(program, 'position'); // 获取顶点着色器中的position变量的地址
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  if (type === 'TRIANGLES') {
    gl.drawArrays(gl.TRIANGLES, 0, points.length / 2);
  } else {
    gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);
  }
}

export function parametric(
  gl: WebGLRenderingContext,
  xFunc: (t: number, ...args: any) => number,
  yFunc: (t: number, ...args: any) => number
) {
  return function (start: number, end: number, seg = 100, ...args: any) {
    const points = [];
    for (let i = 0; i <= seg; i++) {
      const p = i / seg;
      const t = start * (1 - p) + end * p;
      const x = xFunc(t, ...args); // 计算参数方程组的x
      const y = yFunc(t, ...args); // 计算参数方程组的y
      points.push(...[x, y]);
    }
    return { draw: draw.bind(null, gl, points), points };
  };
}

export {
  triangulation,
  Vector2D,
  earcut,
  particleAnimation,
  drawPolyline,
  performanceTest,
  filter,
  updateFilter,
  drawCube
};
