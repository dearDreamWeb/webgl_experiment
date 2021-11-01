import girl2 from '../assets/girl2.jpg';

//顶点着色器源码
let vertexShaderSource: string = `
    attribute vec4 a_Position; //顶点位置坐标
    attribute vec2 a_TexCoord; //纹理坐标
    varying vec2 v_TexCoord; //插值后纹理坐标
    void main(){
        gl_Position = a_Position; //逐顶点处理
        v_TexCoord = a_TexCoord; //纹理坐标插值计算
    }
  `;
//片元着色器源码
let fragShaderSource: string = `
    precision highp float;  //所有float类型数据的精度是lowp
    varying vec2 v_TexCoord;  //接收插值后的纹理坐标
    uniform sampler2D u_Sampler;  //纹理图片像素数据
    uniform float brightness; //明亮度 区间[-1,1]
    uniform mat4 hueMat;
    const mediump vec3 luminanceWeighting = vec3(0.2125, 0.7154, 0.0721);
    uniform lowp float saturation; // 色彩饱和度 区间[-2,2]


    void main(){ 
        // 采集纹素
        vec4 texture = texture2D(u_Sampler,v_TexCoord); 
        // 计算RGB三个分量光能量之和，也就是亮度
        // float luminance = 0.299*texture.r+0.587*texture.g+0.114*texture.b;

        lowp float luminance = dot(texture.rgb, luminanceWeighting);
        lowp vec3 greyScaleColor = vec3(luminance);

        vec4 color = vec4(texture.rgb + vec3(brightness,brightness,brightness),1.0);
        // 逐片元赋值，RGB相同均为亮度值，用黑白两色表达图片的明暗变化
        gl_FragColor = hueMat*vec4(mix(greyScaleColor, color.rgb, saturation),color.w);
    }
  `;

export default function filter(
  gl: WebGLRenderingContext,
  brightnessVal: number = 0,
  hueAdjustVal: number = 0,
  saturationVal: number = 1
) {
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  //初始化着色器
  let program = initShader(gl, vertexShaderSource, fragShaderSource);
  /**
   * 从program对象获取相关的变量
   * attribute变量声明的方法使用getAttribLocation()方法
   * uniform变量声明的方法使用getAttribLocation()方法
   **/
  let a_Position = gl.getAttribLocation(program, 'a_Position');
  let a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
  let u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
  let brightness = gl.getUniformLocation(program, 'brightness');
  let hueMat = gl.getUniformLocation(program, 'hueMat');
  let saturation = gl.getUniformLocation(program, 'saturation');
  const hueMatVal = createHueRotateMatrix(hueAdjustVal);
  gl.uniform1f(brightness, brightnessVal);
  gl.uniformMatrix4fv(hueMat, false, hueMatVal);
  gl.uniform1f(saturation, 1.0 * saturationVal);
  /**
   * 四个顶点坐标数据data，z轴为零
   * 定义纹理贴图在WebGL坐标系中位置
   **/
  let data = new Float32Array([
    -1,
    1, //左上角——v0
    -1,
    -1, //左下角——v1
    1,
    1, //右上角——v2
    1,
    -1, //右下角——v3
  ]);
  /**
   * 创建UV纹理坐标数据textureData
   **/
  let textureData = new Float32Array([
    0,
    1, //左上角——uv0
    0,
    0, //左下角——uv1
    1,
    1, //右上角——uv2
    1,
    0, //右下角——uv3
  ]);
  /**
   * 加载纹理图像像素数据
   **/
  let image = new Image();
  image.onload = texture;
  image.src = girl2;
  /**
     创建缓冲区buffer，向顶点着色器传入顶点位置数据data
     **/
  let buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  /**
     创建缓冲区textureBuffer，向顶点着色器传入顶点纹理坐标数据textureData
     **/
  let textureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, textureData, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_TexCoord);
  /**
     创建缓冲区textureBuffer，传入图片纹理数据，然后执行绘制方法drawArrays()
    **/
  function texture() {
    let texture = gl.createTexture(); //创建纹理图像缓冲区
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); //纹理图片上下反转
    gl.activeTexture(gl.TEXTURE0); //激活0号纹理单元TEXTURE0
    gl.bindTexture(gl.TEXTURE_2D, texture); //绑定纹理缓冲区
    //设置纹理贴图填充方式(纹理贴图像素尺寸大于顶点绘制区域像素尺寸)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    //设置纹理贴图填充方式(纹理贴图像素尺寸小于顶点绘制区域像素尺寸)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //以下配置就不需要要求图片的尺寸了
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    //设置纹素格式，jpg格式对应gl.RGB
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler, 0); //纹理缓冲区单元TEXTURE0中的颜色数据传入片元着色器
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

function createHueRotateMatrix(value: number) {
  let sin = Math.sin((value * Math.PI) / 180);
  let cos = Math.cos((value * Math.PI) / 180);
  return new Float32Array([
    0.213 + cos * 0.787 - sin * 0.213,
    0.213 - cos * 0.213 + sin * 0.143,
    0.213 - cos * 0.213 - sin * 0.787,
    0.0,
    0.715 - cos * 0.715 - sin * 0.715,
    0.715 + cos * 0.285 + sin * 0.14,
    0.715 - cos * 0.715 + sin * 0.715,
    0.0,
    0.072 - cos * 0.072 + sin * 0.928,
    0.072 - cos * 0.072 - sin * 0.283,
    0.072 + cos * 0.928 + sin * 0.072,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
  ]);
}

/**
     初始化函数initShader()
     **/
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

/**
 *
 */
export function updateFilter(
  gl: WebGLRenderingContext,
  brightnessVal: number,
  hueAdjustVal: number = 0,
  saturationVal: number = 1
) {
  //初始化着色器
  let program = initShader(gl, vertexShaderSource, fragShaderSource);
  let brightness = gl.getUniformLocation(program, 'brightness');
  let saturation = gl.getUniformLocation(program, 'saturation');
  let hueMat = gl.getUniformLocation(program, 'hueMat');
  const hueMatVal = createHueRotateMatrix(hueAdjustVal);
  gl.uniformMatrix4fv(hueMat, false, hueMatVal);
  gl.uniform1f(brightness, brightnessVal);
  console.log(hueAdjustVal);


  gl.uniform1f(saturation, 1.0 * saturationVal);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
