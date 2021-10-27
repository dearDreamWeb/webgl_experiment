import Tess2 from 'tess2';
import { draw, earcut, Vector2D } from './index';

export default function triangulation(
  gl: WebGLRenderingContext,
  canvas: HTMLCanvasElement,
  callback: (res: boolean) => void
) {
  const vertices = [
    [-0.7, 0.5],
    [-0.4, 0.3],
    [-0.25, 0.71],
    [-0.1, 0.56],
    [-0.1, 0.13],
    [0.4, 0.21],
    [0, -0.6],
    [-0.3, -0.3],
    [-0.6, -0.3],
    [-0.45, 0.0],
  ];
  const contours = [vertices.flat()];
  const res = Tess2.tesselate({
    contours: contours,
    windingRule: Tess2.WINDING_ODD,
    elementType: Tess2.POLYGONS,
    polySize: 3,
    vertexSize: 2,
  });

  const points = [];
  for (var i = 0; i < res.elements.length; i += 3) {
    var a = res.elements[i],
      b = res.elements[i + 1],
      c = res.elements[i + 2];
    points.push(
      res.vertices[a * 2],
      res.vertices[a * 2 + 1],
      res.vertices[b * 2],
      res.vertices[b * 2 + 1],
      res.vertices[c * 2],
      res.vertices[c * 2 + 1]
    );
  }
  draw(gl, points, 'TRIANGLES');
  const { left, top } = canvas.getBoundingClientRect();
  const cells = new Uint16Array(earcut(vertices.flat()));
  canvas.onmousemove = e => {
    const { x, y } = e;
    const offsetX = (2 * (x - left)) / canvas.width - 1.0;
    const offsetY = 1.0 - (2 * (y - top)) / canvas.height;
    const result = isPointInPath(
      { vertices, cells },
      new Vector2D(offsetX, offsetY)
    );
    callback(result);
  };
}

/**
 * 是否在三角形中
 */
function inTriangle(p1: any, p2: any, p3: any, point: any) {
  const a = p2.copy().sub(p1);
  const b = p3.copy().sub(p2);
  const c = p1.copy().sub(p3);

  const u1 = point.copy().sub(p1);
  const u2 = point.copy().sub(p2);
  const u3 = point.copy().sub(p3);

  const s1 = Math.sign(a.cross(u1));
  let p = a.dot(u1) / a.length ** 2;
  if (s1 === 0 && p >= 0 && p <= 1) return true;

  const s2 = Math.sign(b.cross(u2));
  p = b.dot(u2) / b.length ** 2;
  if (s2 === 0 && p >= 0 && p <= 1) return true;

  const s3 = Math.sign(c.cross(u3));
  p = c.dot(u3) / c.length ** 2;
  if (s3 === 0 && p >= 0 && p <= 1) return true;

  return s1 === s2 && s2 === s3;
}

/**
 * 判断鼠标是否在图形中
 */
function isPointInPath(
  { vertices, cells }: { vertices: number[][]; cells: Uint16Array },
  point: number[]
) {
  let ret = false;
  for (let i = 0; i < cells.length; i += 3) {
    const p1 = new Vector2D(...vertices[cells[i]]);
    const p2 = new Vector2D(...vertices[cells[i + 1]]);
    const p3 = new Vector2D(...vertices[cells[i + 2]]);
    if (inTriangle(p1, p2, p3, point)) {
      ret = true;
      break;
    }
  }
  return ret;
}
