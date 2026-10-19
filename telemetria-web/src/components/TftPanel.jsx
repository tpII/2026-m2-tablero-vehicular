import "./TftPanel.css";

// Panel digital: titulo, valor grande, barra con zonas de color y estado.
// Todo se mide en pixeles logicos del display (320 de ancho) con la unidad
// --px, definida en Home.css. Los colores salen de las variables de
// MeterGauge.css.

const ZONE_COLORS = {
  red: "var(--z-red)",
  orange: "var(--z-orange)",
  yellow: "var(--z-yellow)",
  green: "var(--z-green)",
};

// Color del texto de estado segun lo que diga el pie del panel
const FOOTER_TONE = { OK: "ok", LOW: "warn" };

function TftBar({ percent, zones = [], height = 10 }) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="tft-bar" style={{ height: `calc(${height} * var(--px))` }}>
      <div className="tft-bar__zones">
        {zones.map(([from, to, zone]) => (
          <span
            key={`${zone}-${from}`}
            className="tft-bar__zone"
            style={{
              left: `${from}%`,
              width: `${to - from}%`,
              backgroundColor: ZONE_COLORS[zone],
            }}
          />
        ))}
      </div>
      <span className="tft-bar__marker" style={{ left: `${clamped}%` }} />
    </div>
  );
}

export default function TftPanel({
  title,
  value,
  unit = "",
  footer,
  percent = 0,
  zones = [],
  barHeight = 10,
}) {
  const tone = FOOTER_TONE[footer] ?? "neutral";

  return (
    <section className="tft-panel">
      <div className="tft-panel__head">
        <span className="tft-text tft-text--f2">{title}</span>
      </div>

      <div className="tft-panel__value">
        <span className="tft-text tft-text--f3">{value}</span>
        {unit && (
          <span className="tft-text tft-text--f2 tft-panel__unit">{unit}</span>
        )}
      </div>

      <TftBar percent={percent} zones={zones} height={barHeight} />

      {footer && (
        <div className={`tft-panel__foot tft-panel__foot--${tone}`}>
          <span className="tft-text tft-text--f2">{footer}</span>
        </div>
      )}
    </section>
  );
}
