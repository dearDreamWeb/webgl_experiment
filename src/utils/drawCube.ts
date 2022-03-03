import { getGl } from './index';
interface DrawCube {
    gl: WebGLRenderingContext;
    xRange: number;
    yRange: number;
    zRange: number;
}
interface Translate extends DrawCube {
    program: WebGLProgram
}







export default function drawCube({ gl, xRange, yRange, zRange }: DrawCube) {

    const vertex = `
        precision mediump float;
        attribute vec3 a_Position;
        attribute vec3 a_Color;
        varying vec4 v_Color;
        //矩阵x
        uniform mat4 mx;
        //矩阵y
        uniform mat4 my;
        //矩阵z
        uniform mat4 mz;

        void main(){
            gl_Position = mx*my*mz*vec4(a_Position,1.0);
            v_Color = vec4(a_Color,1.0);
        }
    `;

    const fragment = `
        precision mediump float;
        varying vec4 v_Color;

        void main(){
            gl_FragColor = v_Color;
        }
    `;
    const program = getGl(gl, vertex, fragment);
    // 顶点数据
    const points = new Float32Array([
        -0.5, -0.5, 0.5, 1, 0, 0,
        0.5, -0.5, 0.5, 1, 0, 0,
        0.5, 0.5, 0.5, 1, 0, 0,
        -0.5, 0.5, 0.5, 1, 0, 0,

        -0.5, 0.5, 0.5, 0, 1, 0,
        -0.5, 0.5, -0.5, 0, 1, 0,
        -0.5, -0.5, -0.5, 0, 1, 0,
        -0.5, -0.5, 0.5, 0, 1, 0,

        0.5, 0.5, 0.5, 0, 0, 1,
        0.5, -0.5, 0.5, 0, 0, 1,
        0.5, -0.5, -0.5, 0, 0, 1,
        0.5, 0.5, -0.5, 0, 0, 1,

        0.5, 0.5, -0.5, 1, 0, 1,
        0.5, -0.5, -0.5, 1, 0, 1,
        -0.5, -0.5, -0.5, 1, 0, 1,
        -0.5, 0.5, -0.5, 1, 0, 1,

        -0.5, 0.5, 0.5, 1, 1, 0,
        0.5, 0.5, 0.5, 1, 1, 0,
        0.5, 0.5, -0.5, 1, 1, 0,
        -0.5, 0.5, -0.5, 1, 1, 0,

        -0.5, -0.5, 0.5, 0, 1, 1,
        -0.5, -0.5, -0.5, 0, 1, 1,
        0.5, -0.5, -0.5, 0, 1, 1,
        0.5, -0.5, 0.5, 0, 1, 1,

    ])

    const indexData = new Uint16Array([
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23
    ])

    const FSIZE = points.BYTES_PER_ELEMENT;
    const pointsBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

    const a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
    const a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);


    // 后面被遮挡住的物体不应该显示出来
    gl.enable(gl.DEPTH_TEST);

    translate({ gl, xRange, yRange, program, zRange })

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}


/**
 * 旋转
 * @param param0 
 */
const translate = ({ gl, xRange, yRange, zRange, program }: Translate) => {
    // x轴旋转
    const radX = xRange * Math.PI / 180 * 3.6;
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);
    const mx = gl.getUniformLocation(program, 'mx');
    // x轴旋转矩阵
    const mxArr = new Float32Array([
        1, 0, 0, 0,
        0, cosX, -sinX, 0,
        0, sinX, cosX, 0,
        0, 0, 0, 1
    ])
    gl.uniformMatrix4fv(mx, false, mxArr);

    // y轴旋转
    const radY = yRange * Math.PI / 180 * 3.6;
    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);

    const my = gl.getUniformLocation(program, 'my');
    // y轴旋转矩阵
    const myArr = new Float32Array([
        cosY, 0, -sinY, 0,
        0, 1, 0, 0,
        sinY, 0, cosY,
        0, 0, 0, 0, 1
    ])
    gl.uniformMatrix4fv(my, false, myArr);

    // z轴旋转
    const radZ = zRange * Math.PI / 180 * 3.6;
    const cosZ = Math.cos(radZ);
    const sinZ = Math.sin(radZ);

    const mz = gl.getUniformLocation(program, 'mz');
    // y轴旋转矩阵
    const mzArr = new Float32Array([
        cosZ, sinZ, 0, 0,
        -sinZ, cosZ, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
    gl.uniformMatrix4fv(mz, false, mzArr);
}

