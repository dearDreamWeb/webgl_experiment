import { useState, useEffect, useRef, InputHTMLAttributes } from "react";
import {
  getGl,
  parametric,
  Vector2D,
  triangulation,
  particleAnimation,
} from "./utils";
import drawPolygon, { updateFn } from "./utils/drawPolygon";
import "./app.css";

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
      type={type || "range"}
      value={val}
      onChange={e => {
        setVal(Number(e.target.value));
      }}
      {...resetProps}
    />
  );
};

const allTypes = [
  {
    key: "0",
    type: "polygon",
    text: "绘制多边形",
  },
  {
    key: "1",
    type: "para",
    text: "绘制抛物线",
  },
  {
    key: "2",
    type: "helical",
    text: "绘制阿基米德螺旋线",
  },
  {
    key: "3",
    type: "star",
    text: "绘制星形线",
  },
  {
    key: "4",
    type: "quadricBezier",
    text: "绘制贝塞尔曲线",
  },
  {
    key: "5",
    type: "triangulation",
    text: "三角剖分",
  },
  {
    key: "6",
    type: "particleAnimation",
    text: "粒子动画",
  },
];

function App(): JSX.Element {
  const [type, setType] = useState("particleAnimation");
  const canvas = useRef<HTMLCanvasElement>(null);
  const [inputValue, setInputValue] = useState<number>(3);
  const [translateX, setTranslateX] = useState<number>(50);
  const [translateY, setTranslateY] = useState<number>(50);
  const [scale, setScale] = useState<number>(50);
  const [rotate, setRotate] = useState<number>(0);
  const [isShowText, setIsShowText] = useState<boolean>(false);

  useEffect(() => {
    if (!canvas.current) {
      return;
    }
    const gl = canvas.current.getContext("webgl")!;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    canvas.current.onmousemove = null;
    const program = getGl(gl);
    switch (type) {
      case allTypes[0].type:
        drawPolygon(gl, program, scale, rotate, translateX, translateY);
        break;
      case allTypes[1].type:
        // 抛物线参数方程
        const para = parametric(
          gl,
          t => 0.05 * t,
          t => 0.05 * t ** 2
        );
        para(-10, 10, 100000).draw("");
        break;
      case allTypes[2].type:
        const helical = parametric(
          gl,
          (t, l) => l * t * Math.cos(t),
          (t, l) => l * t * Math.sin(t)
        );

        helical(0, 50, 500, 5).draw("helical");
        break;
      case allTypes[3].type:
        const star = parametric(
          gl,
          (t, l) => l * Math.cos(t) ** 3,
          (t, l) => l * Math.sin(t) ** 3
        );

        star(0, Math.PI * 2, 500, 5).draw("star");
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
          quadricBezier(0, 1, 100, [p0, p1, p2]).draw("quadricBezier");
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
    }
  }, [type]);

  useEffect(() => {
    if (!canvas.current || type !== allTypes[0].type) {
      return;
    }
    const gl = canvas.current.getContext("webgl")!;
    const program = getGl(gl);
    updateFn(gl, program, inputValue, scale, rotate, translateX, translateY);
  }, [type, inputValue, translateX, translateY, rotate, scale]);

  return (
    <div className="app">
      <div className="app_nav">
        {allTypes.map(item => (
          <button
            key={item.key}
            className={`${item.type === type ? "nav_active" : ""}`}
            onClick={() => setType(item.type)}
          >
            {item.text}
          </button>
        ))}
      </div>

      <div className="canvas_box">
        <canvas width="800" height="800" ref={canvas}></canvas>
        {/* 多边形选项 */}
        {type === allTypes[0].type && (
          <div className="polygon_box">
            <div className="polygon_option">
              <p className="polygon_option_text">边数：</p>
              <DiyInput
                type="text"
                value={inputValue}
                onChangeHandler={val => setInputValue(val)}
                min={3}
              />
            </div>
            <div className="polygon_option">
              <p className="polygon_option_text"> x轴移动：</p>
              <DiyInput
                value={translateX}
                onChangeHandler={val => setTranslateX(val)}
              />
            </div>
            <div className="polygon_option">
              <p className="polygon_option_text"> y轴移动：</p>
              <DiyInput
                value={translateY}
                setValue={setTranslateY}
                onChangeHandler={val => setTranslateY(val)}
              />
            </div>
            <div className="polygon_option">
              <p className="polygon_option_text"> 旋转：</p>
              <DiyInput
                value={rotate}
                setValue={setRotate}
                onChangeHandler={val => setRotate(val)}
              />
            </div>
            <div className="polygon_option">
              <p className="polygon_option_text"> 缩放：</p>
              <DiyInput
                value={scale}
                setValue={setScale}
                onChangeHandler={val => setScale(val)}
              />
            </div>
          </div>
        )}
        {isShowText && "鼠标移入图形中！！！"}
      </div>
    </div>
  );
}

export default App;
