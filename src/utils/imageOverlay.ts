import img0 from '../assets/img0.jpeg'
import img1 from '../assets/img1.jpeg'

function initShader(
    gl: WebGLRenderingContext,
    vertexShaderSource: string,
    fragmentShaderSource: string
) {
    let vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);
    let program: WebGLProgram = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    return program;
}

export default function imageOverlay({ gl }: { gl: WebGLRenderingContext }) {
    let textureList: any[] = [];
    const VSHADER_SOURCE = `
        attribute vec2 a_Position;// 顶点坐标
        attribute vec2 a_PointUV;     // 顶点UV
        varying vec2 v_PointUV;

        void main(){
            gl_Position = vec4(a_Position,0.0,1.0);
            v_PointUV = a_PointUV;
        }
    `;
    const FSHADER_SOURCE = `
        precision mediump float;
        varying vec2 v_PointUV;
        uniform sampler2D u_Image;
        uniform sampler2D u_Image1;

        void main() {

            vec4 color = vec4(0.0);
    vec4 mask_src = vec4(0.0);

    vec4 cloth = vec4(0.0);
    vec4 mask = vec4(0.0);

    // Mask creation
    mask_src = texture2D(u_Image, v_PointUV).rgba;
    cloth = texture2D(u_Image1, v_PointUV).rgba;
    mask[3] = 1.0 - mask_src[2];
    if (mask_src[3] == 0.0) {
        mask[3] = 0.0;
    }

    // Alpha composite
    float w_color = mask[3] / (mask[3] + cloth[3] * (1.0 - mask[3]));
    color.rgb = mask.rgb *  (1.0 - w_color) + cloth.rgb * (1.0 - w_color);
    color[3] = mask[3] + cloth[3] * (1.0 - mask[3]);
    for (int i=0; i<3; i++) {
        color[i] = clamp(color[i],0.0,1.0);
    }

    if (cloth[3] == 0.0) {
        color.rgb = mask_src.rgb;
    }
    color[3] = mask_src[3];

    if (cloth[3] != 1.0 && mask_src[3] > 0.5) {
        color[3] = cloth[3] * 1.0;
    }

    gl_FragColor = color;
            // gl_FragColor = vec4(sample_color.xyz  * sample_color1.xyz ,1.0);
        }
    `;
    let program = initShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    const bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    draw()

    function random(min: number, max: number) {
        return min + Math.random() * (max - min);
    }

    async function draw() {
        let data: Float32Array = new Float32Array(
            [
                -1, -1, 0, 0,
                1, -1, 1, 0,
                1, 1, 1, 1,
                1, 1, 1, 1,
                -1, 1, 0, 1,
                -1, -1, 0, 0,
            ]
        );

        await loadTextureImage(0, img0)
        await loadTextureImage(1, img1)

        const FSIZE = data.BYTES_PER_ELEMENT;

        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        const a_Position = gl.getAttribLocation(program, 'a_Position');
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
        gl.enableVertexAttribArray(a_Position);

        const a_PointUV = gl.getAttribLocation(program, 'a_PointUV');
        gl.vertexAttribPointer(a_PointUV, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
        gl.enableVertexAttribArray(a_PointUV);


        const u_Image = gl.getUniformLocation(program, "u_Image");
        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.bindTexture(gl.TEXTURE_2D, textureList[0]);
        gl.uniform1i(u_Image, 0);

        const u_Image1 = gl.getUniformLocation(program, "u_Image1");
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, textureList[1]);
        gl.uniform1i(u_Image1, 1);

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, data.length / 4)
    }

    // 判断是否是 2 的 整数次方
    function isPowerOf2(value: number) {
        return (value & (value - 1)) === 0;
    }

    /**
     * 加载纹理
     */
    function loadTextureImage(index: number, url: string) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = url || './images/0.jpeg';
            img.crossOrigin = 'anonymous'
            img.onload = () => {
                // 在 WebGL 里创建一个 texture
                let texture = gl.createTexture();
                textureList.push(texture)
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.activeTexture(gl.TEXTURE0 + index);
                gl.bindTexture(gl.TEXTURE_2D, textureList[index])
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
                    gl.generateMipmap(gl.TEXTURE_2D);
                } else {
                    console.log("非2的整数次方");
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                }

                resolve(texture)
            }
        })
    }

}