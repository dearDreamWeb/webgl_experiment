import { useState, useEffect, useRef, InputHTMLAttributes } from "react";
import Tess2 from "tess2";
import { getGl, parametric, draw } from "./utils";
import drawPolygon, { updateFn } from "./utils/drawPolygon";
import Vector2D from "./utils/vector2d.js";

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
];

function App(): JSX.Element {
  const [type, setType] = useState("polygon");
  const canvas = useRef<HTMLCanvasElement>(null);
  const [inputValue, setInputValue] = useState<number>(3);
  const [translateX, setTranslateX] = useState<number>(50);
  const [translateY, setTranslateY] = useState<number>(50);
  const [scale, setScale] = useState<number>(50);
  const [rotate, setRotate] = useState<number>(0);

  useEffect(() => {
    if (!canvas.current) {
      return;
    }
    const gl = canvas.current.getContext("webgl")!;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
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
        ].flat();
        const contours = [vertices];
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
        draw(gl, points, "TRIANGLES");
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
    <div className="App">
      <div>
        {allTypes.map(item => (
          <button key={item.key} onClick={() => setType(item.type)}>
            {item.text}
          </button>
        ))}
      </div>
      {type === allTypes[0].type && (
        <div>
          <DiyInput
            type="text"
            value={inputValue}
            onChangeHandler={val => setInputValue(val)}
            min={3}
          />
          x移动：
          <DiyInput
            value={translateX}
            onChangeHandler={val => setTranslateX(val)}
          />
          y移动：
          <DiyInput
            value={translateY}
            setValue={setTranslateY}
            onChangeHandler={val => setTranslateY(val)}
          />
          旋转：
          <DiyInput
            value={rotate}
            setValue={setRotate}
            onChangeHandler={val => setRotate(val)}
          />
          缩放：
          <DiyInput
            value={scale}
            setValue={setScale}
            onChangeHandler={val => setScale(val)}
          />
        </div>
      )}
      <div className="canvas_box">
        <canvas width="800" height="800" ref={canvas}></canvas>
      </div>
    </div>
  );
}

export default App;
