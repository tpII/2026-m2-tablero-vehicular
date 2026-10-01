import { useEffect, useMemo, useRef, useState } from "react";
import "./MeterGauge.css";

// Réplica en SVG del widget MeterWidget de TFT_eSPI (Meter.cpp / Meter.h).
// Todas las coordenadas están expresadas en píxeles lógicos del display TFT.

const DEG = Math.PI / 180;

// Centro de la aguja y radios (Meter.cpp)
const CX = 120;
const CY = 140;
const R_SCALE = 100; // radio del arco de escala
const R_TICK_LONG = 15; // longitud del tick largo (100 + 15 = 115)
const R_TICK_SHORT = 8;
const R_LABEL = R_SCALE + R_TICK_LONG + 10; // 125
const R_NEEDLE = 98;

// Barrido de la escala: -50..+50 grados => -140..-40 grados absolutos
const SCALE_DEG_FROM = -50;
const SCALE_DEG_TO = 50;

// Limites de la aguja: la escala es -50..+50 pero la aguja tiene tope en -150..-30
const NEEDLE_DEG_FROM = -150;
const NEEDLE_DEG_TO = -30;
const NEEDLE_VAL_FROM = -10;
const NEEDLE_VAL_TO = 110;

// Colores TFT (RGB565 expandidos a RGB de 8 bits)
const TFT_GREY = "#5a5d19"; // 0x5AEB
const TFT_BLACK = "#000000";
const TFT_WHITE = "#ffffff";
const TFT_RED = "#ff0000";
const TFT_ORANGE = "#ffa500";
const TFT_YELLOW = "#ffff00";
const TFT_GREEN = "#00ff00";
const TFT_MAGENTA = "#ff00ff";

// Orden de pintado de las zonas: rojo, naranja, amarillo, verde (Meter.cpp)
const ZONE_ORDER = [
  ["red", TFT_RED],
  ["orange", TFT_ORANGE],
  ["yellow", TFT_YELLOW],
  ["green", TFT_GREEN],
];

const LABEL_Y_TWEAK = { "-50": -12, "-25": -9, 0: -6, 25: -9, 50: -12 };

const polar = (radius, deg) => [
  CX + Math.cos(deg * DEG) * radius,
  CY + Math.sin(deg * DEG) * radius,
];

const round3 = (v) => Number(v.toFixed(3));
const toPath = (points) =>
  points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${round3(x)} ${round3(y)}`).join(" ");

// Sector anular entre dos angulos, recorriendo el arco en pasos de 5 grados
// como lo hace el triangulado original.
function sectorPath(fromDeg, toDeg) {
  const angles = [];
  for (let a = fromDeg; a < toDeg - 0.001; a += 5) angles.push(a);
  angles.push(toDeg);

  const outer = angles.map((a) => polar(R_SCALE + R_TICK_LONG, a));
  const inner = angles.map((a) => polar(R_SCALE, a)).reverse();

  return `${toPath(outer)} ${toPath(inner)} Z`;
}

// dtostrf(value, 5, 1, buf)
const fmtValue = (value) => value.toFixed(1).padStart(5, "0");

// La aguja se mueve de a 1 unidad cada 10 ms y frena al acercarse
// (updateNeedle con ms_delay por defecto).
function useNeedle(target) {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);

  useEffect(() => {
    let ms = 10;
    let timer = null;
    let current = shownRef.current;

    const step = () => {
      const diff = target - current;
      if (Math.abs(diff) < 1e-4) {
        timer = null;
        return;
      }
      current += diff > 0 ? 1 : -1;
      shownRef.current = current;
      setShown(current);
      if (Math.abs(target - current) < 10) ms += ms / 5;
      timer = setTimeout(step, ms);
    };

    if (current !== target) timer = setTimeout(step, ms);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [target]);

  return shown;
}

// Ancho de avance, alto y linea de base de las fuentes de TFT_eSPI.
// En drawString() la coordenada y es el borde superior del glifo.
const FONT_METRICS = {
  2: { advance: 8, size: 16, baseline: 12 },
  4: { advance: 16, size: 26, baseline: 19 },
};

function TftText({ x, y, value, font = 2, anchor = "start", className = "" }) {
  const text = String(value);
  if (!text.length) return null;
  const { advance, size, baseline } = FONT_METRICS[font] ?? FONT_METRICS[2];

  return (
    <text
      className={`tft-gauge__text tft-gauge__text--f${font} ${className}`}
      x={x}
      y={y + baseline}
      fontSize={size}
      textAnchor={anchor}
      textLength={text.length * advance}
      lengthAdjust="spacingAndGlyphs"
    >
      {text}
    </text>
  );
}

export default function MeterGauge({
  value = 0,
  fullScale = 100,
  label = "",
  unit = "",
  scaleLabels = ["0", "25", "50", "75", "100"],
  zones = null,
  className = "",
}) {
  const needleValue = useNeedle(value);

  const { zonePaths, ticks, arcPoints, scaleTexts } = useMemo(() => {
    const zonePaths = ZONE_ORDER.filter(
      ([key]) => zones?.[key] && zones[key][1] > zones[key][0],
    ).map(([key, color]) => {
      const from = Math.max(SCALE_DEG_FROM, zones[key][0] - 50);
      const to = Math.min(SCALE_DEG_TO, zones[key][1] - 50);
      return { key, color, d: sectorPath(from - 90, to - 90) };
    });

    const ticks = [];
    const arcPoints = [];
    for (let i = SCALE_DEG_FROM; i <= SCALE_DEG_TO; i += 5) {
      const radius = i % 25 === 0 ? R_TICK_LONG : R_TICK_SHORT;
      ticks.push({
        deg: i,
        from: polar(R_SCALE, i - 90),
        to: polar(R_SCALE + radius, i - 90),
      });
      arcPoints.push(polar(R_SCALE, i - 90));
    }

    const scaleTexts = [-50, -25, 0, 25, 50].map((deg, idx) => {
      const [x, y] = polar(R_LABEL, deg - 90);
      return {
        idx,
        text: scaleLabels[idx],
        x,
        y: y + LABEL_Y_TWEAK[deg],
      };
    });

    return { zonePaths, ticks, arcPoints, scaleTexts };
  }, [zones, scaleLabels]);

  // factor = 100 / fullScale ; value = val * factor
  // angulo = map(value, -10, 110, -150, -30)
  const needleDeg = (() => {
    const clamped = Math.min(
      NEEDLE_VAL_TO,
      Math.max(NEEDLE_VAL_FROM, (needleValue * 100) / fullScale),
    );
    return (
      NEEDLE_DEG_FROM +
      ((clamped - NEEDLE_VAL_FROM) * (NEEDLE_DEG_TO - NEEDLE_DEG_FROM)) /
        (NEEDLE_VAL_TO - NEEDLE_VAL_FROM)
    );
  })();

  // La base de la aguja no llega al pivote: esta a 20 px de altura y
  // desplazada segun tan(angulo + 90), tal cual updateNeedle().
  const needleTail = [CX + 20 * Math.tan((needleDeg + 90) * DEG), CY - 20];
  const needleTip = polar(R_NEEDLE, needleDeg);

  const needleLines = [
    { key: "l", dx: -1, color: TFT_RED },
    { key: "c", dx: 0, color: TFT_MAGENTA },
    { key: "r", dx: 1, color: TFT_RED },
  ];

  return (
    <svg
      className={`tft-gauge ${className}`}
      viewBox="0 0 240 128"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${label} ${value}`}
    >
      {/* Marco gris y fondo blanco del widget */}
      <rect className="tft-gauge__frame" x="0" y="0" width="239" height="126" fill={TFT_GREY} />
      <rect className="tft-gauge__frame" x="5" y="3" width="230" height="119" fill={TFT_WHITE} />

      {/* Zonas de color */}
      {zonePaths.map((zone) => (
        <path key={zone.key} d={zone.d} fill={zone.color} />
      ))}

      {/* Ticks cada 5 grados */}
      {ticks.map((tick) => (
        <line
          key={tick.deg}
          x1={round3(tick.from[0])}
          y1={round3(tick.from[1])}
          x2={round3(tick.to[0])}
          y2={round3(tick.to[1])}
          stroke={TFT_BLACK}
          strokeWidth="1"
        />
      ))}

      {/* Arco de la escala */}
      <polyline
        points={arcPoints.map(([x, y]) => `${round3(x)},${round3(y)}`).join(" ")}
        fill="none"
        stroke={TFT_BLACK}
        strokeWidth="1"
      />

      {/* Valores de la escala */}
      {scaleTexts.map((item) => (
        <TftText
          key={item.idx}
          x={round3(item.x)}
          y={round3(item.y)}
          value={item.text}
          anchor="middle"
        />
      ))}

      {/* Etiqueta grande central y unidad abajo a la derecha */}
      <TftText x={CX} y={70} value={label} font={4} anchor="middle" className="tft-gauge__title" />
      <TftText x={195} y={99} value={unit} />

      {/* Marco negro */}
      <rect
        className="tft-gauge__frame"
        x="5.5"
        y="3.5"
        width="229"
        height="118"
        fill="none"
        stroke={TFT_BLACK}
        strokeWidth="1"
      />

      {/* Valor digital */}
      <TftText x={50} y={99} value={fmtValue(value)} anchor="end" />

      {/* Aguja */}
      <g>
        {needleLines.map((line) => (
          <line
            key={line.key}
            x1={round3(needleTail[0] + line.dx)}
            y1={round3(needleTail[1])}
            x2={round3(needleTip[0] + line.dx)}
            y2={round3(needleTip[1])}
            stroke={line.color}
            strokeWidth="1"
          />
        ))}
      </g>
    </svg>
  );
}
