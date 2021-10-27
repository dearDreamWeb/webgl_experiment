export default function drawPolygon(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    scale: number = 0,
    rotate: number = 0,
    translateX = 0,
    translateY = 0
) {
    const points = new Float32Array([-1, -1, 0, 1, 1, -1]);
    const bufferId = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

    updateFn(gl, program, 3, scale, rotate, translateX, translateY);
}

function getPointArr(a: number[], b: number[], c: number[]): number[] {
    return [a[0], a[1], b[0], b[1], c[0], c[1]];
}

/**
 * 得到三角形的点数据
 */
function getShape(
    center: number[],
    r: number,
    n: number,
    scale: number = 0,
    rotate: number = 0
): number[] {
    let idx = 0;
    let x = 0;
    let y = 0;
    let radius = 0;
    let pointArr = [];

    const r1 = r * (1 + scale);
    for (; idx < n; idx++) {
        radius = ((2 * Math.PI) / n) * idx + rotate;
        x = r1 * Math.cos(radius) + center[0];
        y = r1 * Math.sin(radius) + center[1];
        pointArr.push([x, y]);
    }
    let res = []; // 平坦化数组
    for (idx = 0; idx < n; idx++) {
        res.push(...getPointArr(pointArr[idx], pointArr[(idx + 1) % n], center)); // 注意这里是逆时针排布的
    }
    return res;
}

/**
 * 更新数据
 */
export function updateFn(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    n: number,
    scale: number,
    rotate: number,
    xDistance = 0,
    yDistance = 0
) {
    xDistance = (xDistance - 50) / 50;
    yDistance = (yDistance - 50) / 50;
    rotate = rotate * 3.6 * (Math.PI / 180);
    scale = (scale - 50) / 50;

    const vPosition = gl.getAttribLocation(program, 'position'); // 获取顶点着色器中的position变量的地址

    // 生成N边形
    const data = getShape([0, 0], 0.5, n, scale, rotate);
    data.forEach((item, index) => {
        if (index % 2 === 0) {
            data[index] += xDistance;
        } else {
            data[index] += yDistance;
        }
    });
    const dataArr = new Float32Array(data);
    const pointCount = data.length / 2;

    // 重新创建WebGL的buffer，并且将多边形的点传入
    let buffer_id = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_id);
    gl.bufferData(gl.ARRAY_BUFFER, dataArr, gl.STATIC_DRAW);
    // 指定 data 的格式
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.drawArrays(gl.TRIANGLES, 0, pointCount);
}
