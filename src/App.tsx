import { useState, useEffect, useRef, InputHTMLAttributes } from 'react';
import {
  getGl,
  parametric,
  Vector2D,
  triangulation,
  particleAnimation,
  drawPolyline,
  performanceTest,
  filter,
  updateFilter,
  drawCube,
  imageOverlay,
} from './utils';
import drawPolygon, { updateFn } from './utils/drawPolygon';
import './app.css';

// input组件
interface IDiyInput extends InputHTMLAttributes<HTMLInputElement> {
  type?: string;
  value: number;
  onChangeHandler: (val: number) => void;
  setValue?: React.Dispatch<React.SetStateAction<number>>;
}
const DiyInput = (props: IDiyInput) => {
  const { type, value, setValue, onChangeHandler, ...resetProps } = props;
  const [val, setVal] = useState<number>(value);
  useEffect(() => {
    onChangeHandler(val);
  }, [val]);
  return (
    <input
      type={type || 'range'}
      value={val}
      onChange={(e) => {
        setVal(Number(e.target.value));
      }}
      {...resetProps}
    />
  );
};

const allTypes = [
  {
    key: '0',
    type: 'polygon',
    text: '绘制多边形',
  },
  {
    key: '1',
    type: 'para',
    text: '绘制抛物线',
  },
  {
    key: '2',
    type: 'helical',
    text: '绘制阿基米德螺旋线',
  },
  {
    key: '3',
    type: 'star',
    text: '绘制星形线',
  },
  {
    key: '4',
    type: 'quadricBezier',
    text: '绘制贝塞尔曲线',
  },
  {
    key: '5',
    type: 'triangulation',
    text: '三角剖分',
  },
  {
    key: '6',
    type: 'particleAnimation',
    text: '粒子动画',
  },
  {
    key: '7',
    type: 'drawPolyline',
    text: '绘制带宽度的曲线',
  },
  {
    key: '8',
    type: 'performanceTest',
    text: '性能检测',
  },
  {
    key: '9',
    type: 'filter',
    text: '滤镜',
  },
  {
    key: '10',
    type: 'drawCube',
    text: '绘制立方体',
  },
  {
    key: '11',
    type: 'imageFilter',
    text: '图片叠加效果',
  },
];

function App(): JSX.Element {
  const [type, setType] = useState(allTypes[10].type);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [inputValue, setInputValue] = useState<number>(3);
  const [translateX, setTranslateX] = useState<number>(50);
  const [translateY, setTranslateY] = useState<number>(50);
  const [scale, setScale] = useState<number>(50);
  const [rotate, setRotate] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(50);
  const [hueAdjust, setHueAdjust] = useState<number>(50);
  const [xRange, setXRange] = useState<number>(10);
  const [yRange, setYRange] = useState<number>(10);
  const [zRange, setZRange] = useState<number>(0);
  const [saturationVal, setSaturationVal] = useState<number>(50);
  const [isShowText, setIsShowText] = useState<boolean>(false);
  const [gl, setGl] = useState<WebGLRenderingContext>();

  useEffect(() => {
    if (!canvas.current || gl) {
      return;
    }
    setGl(canvas.current.getContext('webgl')!);
  }, [type]);

  useEffect(() => {
    if (!gl || !canvas.current) {
      return;
    }
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    canvas.current.onmousemove = null;
    const program = getGl(gl);
    console.log(123);
    switch (type) {
      case allTypes[0].type:
        drawPolygon(gl, program, scale, rotate, translateX, translateY);
        break;
      case allTypes[1].type:
        // 抛物线参数方程
        const para = parametric(
          gl,
          (t) => 0.05 * t,
          (t) => 0.05 * t ** 2
        );
        para(-10, 10, 100000).draw('');
        break;
      case allTypes[2].type:
        const helical = parametric(
          gl,
          (t, l) => l * t * Math.cos(t),
          (t, l) => l * t * Math.sin(t)
        );

        helical(0, 50, 500, 5).draw('helical');
        break;
      case allTypes[3].type:
        const star = parametric(
          gl,
          (t, l) => l * Math.cos(t) ** 3,
          (t, l) => l * Math.sin(t) ** 3
        );

        star(0, Math.PI * 2, 500, 5).draw('star');
        break;
      case allTypes[4].type:
        const quadricBezier = parametric(
          gl,
          (t, [{ x: x0 }, { x: x1 }, { x: x2 }]) =>
            (1 - t) ** 2 * x0 + 2 * t * (1 - t) * x1 + t ** 2 * x2,
          (t, [{ y: y0 }, { y: y1 }, { y: y2 }]) =>
            (1 - t) ** 2 * y0 + 2 * t * (1 - t) * y1 + t ** 2 * y2
        );
        const p0 = new Vector2D(0, 0);
        const p1 = new Vector2D(100, 0);
        p1.rotate(0.75);
        const p2 = new Vector2D(200, 0);
        const count = 30;
        for (let i = 0; i < count; i++) {
          // 绘制30条从圆心出发，旋转不同角度的二阶贝塞尔曲线
          p1.rotate((2 / count) * Math.PI);
          p2.rotate((2 / count) * Math.PI);
          quadricBezier(0, 1, 100, [p0, p1, p2]).draw('quadricBezier');
        }
        break;
      case allTypes[5].type:
        triangulation(gl, canvas.current, (isShow: boolean) =>
          setIsShowText(isShow)
        );
        break;
      case allTypes[6].type:
        particleAnimation(gl);
        break;
      case allTypes[7].type:
        drawPolyline();
        break;
      case allTypes[8].type:
        performanceTest(canvas.current);
        break;
      case allTypes[9].type:
        filter(
          gl,
          (brightness - 50) / 50,
          (hueAdjust - 50) * 10,
          (saturationVal - (50 - 16.6)) / 16.6
        );
        break;
      case allTypes[10].type:
        drawCube({ gl, xRange, yRange,zRange })
        break;
      case allTypes[11].type:
        imageOverlay({ gl })
        break;
    }
  }, [type, gl]);

  /**
   * 绘制多边体
   */
  useEffect(() => {
    if (!canvas.current || type !== allTypes[0].type || !gl) {
      return;
    }
    const program = getGl(gl);
    updateFn(gl, program, inputValue, scale, rotate, translateX, translateY);
  }, [type, gl, inputValue, translateX, translateY, rotate, scale]);

  /**
   * 滤镜
   */
  useEffect(() => {
    if (!canvas.current || type !== allTypes[9].type || !gl) {
      return;
    }
    updateFilter(
      gl,
      (brightness - 50) / 50,
      (hueAdjust - 50) * 10,
      (saturationVal - (50 - 16.6)) / 16.6
    );
  }, [brightness, hueAdjust, saturationVal]);

  /**
   * 立方体
   */
  useEffect(() => {
    if (!canvas.current || type !== allTypes[10].type || !gl) {
      return;
    }
    drawCube({ gl, xRange, yRange,zRange })
  }, [xRange, yRange,zRange])

  return (
    <div className='app'>
      <div className='app_nav'>
        {allTypes.map(
          (item, index) =>
            index !== 6 &&
            index !== 8 && (
              <button
                key={item.key}
                className={`${item.type === type ? 'nav_active' : ''}`}
                onClick={() => setType(item.type)}
              >
                {item.text}
              </button>
            )
        )}
      </div>

      <div className='canvas_box'>
        <canvas width='800' height='800' ref={canvas}></canvas>
        {/* 多边形选项 */}
        {type === allTypes[0].type && (
          <div className='polygon_box'>
            <div className='polygon_option'>
              <p className='polygon_option_text'>边数：</p>
              <DiyInput
                type='text'
                value={inputValue}
                onChangeHandler={(val) => setInputValue(val)}
                min={3}
              />
            </div>
            <div className='polygon_option'>
              <p className='polygon_option_text'> x轴移动：</p>
              <DiyInput
                value={translateX}
                onChangeHandler={(val) => setTranslateX(val)}
              />
            </div>
            <div className='polygon_option'>
              <p className='polygon_option_text'> y轴移动：</p>
              <DiyInput
                value={translateY}
                setValue={setTranslateY}
                onChangeHandler={(val) => setTranslateY(val)}
              />
            </div>
            <div className='polygon_option'>
              <p className='polygon_option_text'> 旋转：</p>
              <DiyInput
                value={rotate}
                setValue={setRotate}
                onChangeHandler={(val) => setRotate(val)}
              />
            </div>
            <div className='polygon_option'>
              <p className='polygon_option_text'> 缩放：</p>
              <DiyInput
                value={scale}
                setValue={setScale}
                onChangeHandler={(val) => setScale(val)}
              />
            </div>
          </div>
        )}
        {isShowText && '鼠标移入图形中！！！'}
        {/* 明亮度 */}
        {type === allTypes[9].type && (
          <div className='filter_box'>
            <div>
              <span className='filter_item_label'>明亮度：</span>
              <input
                type='range'
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
              />
            </div>
            <div>
              <span className='filter_item_label'>色相：</span>
              <input
                type='range'
                value={hueAdjust}
                onChange={(e) => setHueAdjust(Number(e.target.value))}
              />
            </div>
            <div>
              <span className='filter_item_label'>饱和度：</span>
              <input
                type='range'
                value={saturationVal}
                onChange={(e) => setSaturationVal(Number(e.target.value))}
              />
            </div>
          </div>
        )}
        {/* 立方体 */}
        {
          type === allTypes[10].type && (
            <div className='filter_box'>
              <div>
                <span className='filter_item_label'>x轴旋转角度：</span>
                <input
                  type='range'
                  value={xRange}
                  onChange={(e) => setXRange(Number(e.target.value))}
                />
                <span>{Math.floor(xRange * 3.6)}</span>
              </div>
              <div>
                <span className='filter_item_label'>y轴旋转角度：</span>
                <input
                  type='range'
                  value={yRange}
                  onChange={(e) => setYRange(Number(e.target.value))}
                />
                <span>{Math.floor(yRange * 3.6)}</span>
              </div>
              <div>
                <span className='filter_item_label'>z轴旋转角度：</span>
                <input
                  type='range'
                  value={zRange}
                  onChange={(e) => setZRange(Number(e.target.value))}
                />
                <span>{Math.floor(zRange * 3.6)}</span>
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
}

export default App;
