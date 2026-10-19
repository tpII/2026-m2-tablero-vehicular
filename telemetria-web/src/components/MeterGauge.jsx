import { useEffect, useMemo, useRef, useState } from "react";
import "./MeterGauge.css";

// Medidor analogico en SVG. Conserva la geometria de MeterWidget (TFT_eSPI):
// mismo centro, mismo barrido de escala (-50..+50), mismos topes de aguja y
// mismas zonas en % de fondo de escala. Lo visual (colores, franja, tipografia)
// es propio de la web y vive en MeterGauge.css.
// Coordenadas en pixeles logicos del medidor nativo: 240 x 128.

const DEG = Math.PI / 180;

const CX = 120;
const CY = 140;
const R_BAND = 108; // radio de la franja de color
const R_TICK = 98; // los ticks salen de aca hacia adentro
const TICK_SHORT = 5;
const TICK_LONG = 11;
const R_LABEL = 126;
const R_NEEDLE = 100;

// Barrido de la escala: -50..+50 grados respecto de la vertical
const SCALE_DEG_FROM = -50;
const SCALE_DEG_TO = 50;

// La aguja tiene tope en -150..-30 (valores -10%..110%), igual que el firmware
const NEEDLE_DEG_FROM = -150;
const NEEDLE_DEG_TO = -30;
const NEEDLE_VAL_FROM = -10;
const NEEDLE_VAL_TO = 110;

// Orden de pintado: rojo, naranja, amarillo y verde encima (como setZones)
const ZONE_ORDER = ["red", "orange", "yellow", "green"];

const polar = (radius, deg) => [
  CX + Math.cos(deg * DEG) * radius,
  CY + Math.sin(deg * DEG) * radius,
];

const r3 = (v) => Number(v.toFixed(3));
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Arco de circunferencia entre dos porcentajes de la escala (0-100).
// Un solo subpath: evita el relleno raro del triangulado original.
function arcPath(radius, fromPct, toPct) {
  const [x0, y0] = polar(radius, fromPct - 50 - 90);
  const [x1, y1] = polar(radius, toPct - 50 - 90);
  return `M ${r3(x0)} ${r3(y0)} A ${radius} ${radius} 0 0 1 ${r3(x1)} ${r3(y1)}`;
}

// Ticks y posiciones de las 5 etiquetas: no dependen de las props
const TICKS = [];
for (let i = SCALE_DEG_FROM; i <= SCALE_DEG_TO; i += 5) {
  const major = i % 25 === 0;
  const [x1, y1] = polar(R_TICK, i - 90);
  const [x2, y2] = polar(R_TICK - (major ? TICK_LONG : TICK_SHORT), i - 90);
  TICKS.push({ deg: i, major, x1: r3(x1), y1: r3(y1), x2: r3(x2), y2: r3(y2) });
}

const LABEL_POS = [-50, -25, 0, 25, 50].map((deg) => {
  const [x, y] = polar(R_LABEL, deg - 90);
  return { deg, x: r3(x), y: r3(y) };
});

// Suaviza el movimiento de la aguja. Trabaja en % de escala, no en unidades
// del dato: asi RPM (miles) y km/h (cientos) tardan lo mismo en asentarse.
function useNeedle(targetPct) {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now) => {
      const dt = now - last;
      last = now;

      const diff = targetPct - shownRef.current;
      if (Math.abs(diff) < 0.05) {
        shownRef.current = targetPct;
        setShown(targetPct);
        return;
      }

      shownRef.current += diff * (1 - Math.exp(-dt / 110));
      setShown(shownRef.current);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetPct]);

  return shown;
}

export default function MeterGauge({
  value = 0,
  fullScale = 100,
  label = "",
  unit = "",
  decimals = 0,
  scaleLabels = ["0", "25", "50", "75", "100"],
  zones = null,
  className = "",
}) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const targetPct = clamp(
    (safeValue * 100) / (fullScale || 1),
    NEEDLE_VAL_FROM,
    NEEDLE_VAL_TO,
  );
  const shown = useNeedle(targetPct);

  const zonePaths = useMemo(
    () =>
      ZONE_ORDER.filter(
        (key) => zones?.[key] && zones[key][1] > zones[key][0],
      ).map((key) => ({
        key,
        d: arcPath(
          R_BAND,
          clamp(zones[key][0], 0, 100),
          clamp(zones[key][1], 0, 100),
        ),
      })),
    [zones],
  );

  const needleDeg =
    NEEDLE_DEG_FROM +
    ((shown - NEEDLE_VAL_FROM) * (NEEDLE_DEG_TO - NEEDLE_DEG_FROM)) /
      (NEEDLE_VAL_TO - NEEDLE_VAL_FROM);

  // Igual que updateNeedle(): la aguja arranca 20 px arriba del pivote
  const tail = [CX + 20 * Math.tan((needleDeg + 90) * DEG), CY - 20];
  const tip = polar(R_NEEDLE, needleDeg);

  return (
    <svg
      className={`tft-gauge ${className}`}
      viewBox="0 0 240 128"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${label} ${safeValue.toFixed(decimals)} ${unit}`}
    >
      <rect
        className="tft-gauge__face"
        x="0.5"
        y="0.5"
        width="239"
        height="127"
        rx="10"
      />

      {/* Pista de fondo + zonas de color */}
      <path className="tft-gauge__track" d={arcPath(R_BAND, 0, 100)} />
      {zonePaths.map((zone) => (
        <path
          key={zone.key}
          className={`tft-gauge__zone tft-gauge__zone--${zone.key}`}
          d={zone.d}
        />
      ))}

      {/* Ticks */}
      {TICKS.map((t) => (
        <line
          key={t.deg}
          className={
            t.major
              ? "tft-gauge__tick tft-gauge__tick--major"
              : "tft-gauge__tick"
          }
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
        />
      ))}

      {/* Valores de la escala */}
      {LABEL_POS.map((p, idx) =>
        scaleLabels[idx] ? (
          <text
            key={p.deg}
            className="tft-gauge__scale"
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {scaleLabels[idx]}
          </text>
        ) : null,
      )}

      {/* Titulo tenue al centro; la aguja pasa por encima */}
      <text
        className="tft-gauge__title"
        x={CX}
        y="98"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {label}
      </text>

      {/* Valor digital y unidad */}
      <text
        className="tft-gauge__value"
        x="14"
        y="116"
        dominantBaseline="central"
      >
        {safeValue.toFixed(decimals)}
      </text>
      <text
        className="tft-gauge__unit"
        x="226"
        y="116"
        textAnchor="end"
        dominantBaseline="central"
      >
        {unit}
      </text>

      {/* Aguja */}
      <line
        className="tft-gauge__needle"
        x1={r3(tail[0])}
        y1={r3(tail[1])}
        x2={r3(tip[0])}
        y2={r3(tip[1])}
      />
      <circle
        className="tft-gauge__hub"
        cx={r3(tail[0])}
        cy={r3(tail[1])}
        r="4"
      />
    </svg>
  );
}
