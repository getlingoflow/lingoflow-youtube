export const loadingSvg = `<svg viewBox="-20 0 100 100" 
     style="display: inline-block; width: 1em; height: 1em; vertical-align: middle;">
  <circle fill="#209CEE" stroke="none" cx="6" cy="50" r="6">
    <animateTransform attributeName="transform" dur="1s" type="translate" values="0 15 ; 0 -15; 0 15" repeatCount="indefinite" begin="0.1"/>
  </circle>
  <circle fill="#209CEE" stroke="none" cx="30" cy="50" r="6">
    <animateTransform attributeName="transform" dur="1s" type="translate" values="0 10 ; 0 -10; 0 10" repeatCount="indefinite" begin="0.2"/>
  </circle>
  <circle fill="#209CEE" stroke="none" cx="54" cy="50" r="6">
    <animateTransform attributeName="transform" dur="1s" type="translate" values="0 5 ; 0 -5; 0 5" repeatCount="indefinite" begin="0.3"/>
  </circle>
</svg>
`;

function createSVGElement(tag, attributes) {
  const svgNS = "http://www.w3.org/2000/svg";
  const el = document.createElementNS(svgNS, tag);
  for (const key in attributes) {
    el.setAttribute(key, attributes[key]);
  }
  return el;
}

/**
 * 创建loding动画
 * @returns
 */
export function createLoadingSVG() {
  const svg = createSVGElement("svg", {
    viewBox: "-20 0 100 100",
    style:
      "display: inline-block; width: 1em; height: 1em; vertical-align: middle;",
  });

  const circleData = [
    { cx: "6", begin: "0.1", values: "0 15 ; 0 -15; 0 15" },
    { cx: "30", begin: "0.2", values: "0 10 ; 0 -10; 0 10" },
    { cx: "54", begin: "0.3", values: "0 5 ; 0 -5; 0 5" },
  ];

  circleData.forEach((data) => {
    const circle = createSVGElement("circle", {
      fill: "#209CEE",
      stroke: "none",
      cx: data.cx,
      cy: "50",
      r: "6",
    });
    const animation = createSVGElement("animateTransform", {
      attributeName: "transform",
      dur: "1s",
      type: "translate",
      values: data.values,
      repeatCount: "indefinite",
      begin: data.begin,
    });
    circle.appendChild(animation);
    svg.appendChild(circle);
  });

  return svg;
}

/**
 * 创建logo
 * @param {*} param0
 * @returns
 */
export function createLogoSVG({
  width = "24",
  height = "24",
  viewBox = "-5 -5 40 40",
  isSelected = false,
} = {}) {
  const svg = createSVGElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width,
    height,
    viewBox,
    version: "1.1",
  });

  const primaryColor = "#6366f1";
  const secondaryColor = "#f5f6ff";

  const bgFill = isSelected ? secondaryColor : primaryColor;
  const fgFill = isSelected ? primaryColor : secondaryColor;

  // 背景容器
  const bg = createSVGElement("rect", {
    x: "0", y: "0", width: "32", height: "32",
    rx: "6", ry: "6",
    fill: "transparent",
  });

  // 上方气泡 (简单矩形 + 三角尾巴)
  const bubble1 = createSVGElement("path", {
    d: "M5 7 H19 Q21 7 21 9 V15 Q21 17 19 17 H10 L7 20 V17 H7 Q5 17 5 15 V9 Q5 7 7 7 Z",
    fill: fgFill,
    opacity: "0.8",
  });

  // 下方气泡
  const bubble2 = createSVGElement("path", {
    d: "M13 14 H25 Q27 14 27 16 V22 Q27 24 25 24 H22 L19 27 V24 H15 Q13 24 13 22 V16 Q13 14 15 14 Z",
    fill: fgFill,
  });

  svg.appendChild(bg);
  svg.appendChild(bubble1);
  svg.appendChild(bubble2);
  return svg;
}

export function createSettingsSVG({ width = "18", height = "18" } = {}) {
  const svg = createSVGElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width,
    height,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });

  const circle = createSVGElement("circle", { cx: "12", cy: "12", r: "3" });
  const path = createSVGElement("path", {
    d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z",
  });

  svg.appendChild(circle);
  svg.appendChild(path);
  return svg;
}
