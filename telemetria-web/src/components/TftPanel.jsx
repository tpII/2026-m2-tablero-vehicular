import "./TftPanel.css";

// Widget digital con el mismo lenguaje grafico del MeterWidget:
// marco gris, cara blanca, borde negro y texto negro.
// Todo se mide en pixeles logicos del display (320x240) usando la unidad --px.

const ZONE_COLORS = {
  red: "#ff0000",
  orange: "#ffa500",
  yellow: "#ffff00",
  green: "#00ff00",
};

function TftBar({ percent, zones = [], height = 12 }) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="tft-bar" style={{ height: `calc(${height} * var(--px))` }}>
      {zones.map(([from, to, zone]) => (
        <span
          key={zone}
          className="tft-bar__zone"
          style={{
            left: `${from}%`,
            width: `${to - from}%`,
            backgroundColor: ZONE_COLORS[zone],
          }}
        />
      ))}
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
  barHeight = 12,
}) {
  return (
    <section className="tft-panel">
      <div className="tft-panel__head">
        <span className="tft-text tft-text--f2">{title}</span>
      </div>

      <div className="tft-panel__value">
        <span className="tft-text tft-text--f3">{value}</span>
        {unit && <span className="tft-text tft-text--f2 tft-panel__unit">{unit}</span>}
      </div>

      <TftBar percent={percent} zones={zones} height={barHeight} />

      {footer && (
        <div className="tft-panel__foot">
          <span className="tft-text tft-text--f2">{footer}</span>
        </div>
      )}
    </section>
  );
}
