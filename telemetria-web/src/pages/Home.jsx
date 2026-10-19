import MeterGauge from "../components/MeterGauge";
import TftPanel from "../components/TftPanel";
import useTelemetry from "../mqtt/useTelemetry";
import "./Home.css";

// Valores por defecto: se usan hasta que el ESP32 publique algo real
const MAX_SPEED = 120;
const BAT_MIN = 10.5;
const BAT_MAX = 14;
const BAT_LOW = 11.5;

const SPEED_LABELS = ["0", "30", "60", "90", "120"];
const RPM_LABELS = ["0", "1500", "3000", "4500", "6000"];

// Zonas en % de fondo escala, igual que setZones() de MeterWidget
const SPEED_ZONES = {
  green: [0, 60],
  yellow: [60, 80],
  orange: [80, 90],
  red: [90, 100],
};

const RPM_ZONES = {
  green: [0, 55],
  yellow: [55, 70],
  orange: [70, 85],
  red: [85, 100],
};

const BAT_ZONES = [
  [0, ((BAT_LOW - BAT_MIN) / (BAT_MAX - BAT_MIN)) * 100, "red"],
  [((BAT_LOW - BAT_MIN) / (BAT_MAX - BAT_MIN)) * 100, 100, "green"],
];

const THR_ZONES = [
  [0, 60, "green"],
  [60, 85, "yellow"],
  [85, 100, "red"],
];

export default function Home() {
  const { data, source, status } = useTelemetry();

  const batPercent = ((data.bateria - BAT_MIN) / (BAT_MAX - BAT_MIN)) * 100;
  const batLow = data.bateria < BAT_LOW;
  const live = source === "esp32";

  return (
    <div className="home">
      <header className="home__header">
        <h2 className="home__title">Live Dashboard</h2>
        <p className="home__subtitle">
          Reflejo de la pantalla TFT física — widget MeterWidget (TFT_eSPI) sobre 320x240
        </p>
      </header>

      {/* CONTENEDOR QUE SIMULA LA PANTALLA FISICA */}
      <div className="tft-stage">
        <div className="tft-frame">
          <div className="tft-screen">
            <MeterGauge
              value={data.velocidad}
              fullScale={MAX_SPEED}
              label="KM/H"
              unit="km/h"
              scaleLabels={SPEED_LABELS}
              zones={SPEED_ZONES}
            />

            <TftPanel
              title="BAT"
              value={data.bateria.toFixed(1)}
              unit="V"
              footer={batLow ? "LOW" : "OK"}
              percent={batPercent}
              zones={BAT_ZONES}
            />

            <MeterGauge
              value={data.rpm}
              fullScale={data.maxRpm}
              label="RPM"
              unit="rpm"
              scaleLabels={RPM_LABELS}
              zones={RPM_ZONES}
            />

            <TftPanel
              title="THR"
              value={data.potenciometro}
              unit="%"
              footer="POT"
              percent={data.potenciometro}
              zones={THR_ZONES}
            />

            <div className="tft-screen__scanlines" aria-hidden="true" />
          </div>
        </div>
      </div>

      <footer className="home__footer">
        <span className={`home__badge home__badge--${live ? "live" : "mock"}`}>
          {live ? "ESP32" : "MOCK"}
        </span>
        <span>
          {status} · {live ? "MQTT" : "datos simulados"} · {data.velocidad} km/h · {data.rpm}{" "}
          rpm · thr {data.potenciometro}% · {data.bateria} v
        </span>
      </footer>
    </div>
  );
}
