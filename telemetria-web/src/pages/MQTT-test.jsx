import { useState, useEffect } from 'react';
import mqtt from 'mqtt';

export default function MQTTTest() {
  const [client, setClient] = useState(null);
  const [connectStatus, setConnectStatus] = useState('Desconectado');
  const [brokerUrl, setBrokerUrl] = useState('ws://localhost:9001');
  const [topic, setTopic] = useState('vehiculo/m2/telemetria');
  const [messages, setMessages] = useState([]);

  const handleConnect = () => {
    setConnectStatus('Conectando...');
    const mqttClient = mqtt.connect(brokerUrl);

    mqttClient.on('connect', () => {
      setConnectStatus('Conectado');
      mqttClient.subscribe(topic);
    });

    mqttClient.on('error', (err) => {
      console.error('Error:', err);
      setConnectStatus('Error de Conexión');
      mqttClient.end();
    });

    mqttClient.on('message', (receivedTopic, message) => {
      const newMessage = {
        topic: receivedTopic,
        payload: message.toString(),
        time: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [newMessage, ...prev]);
    });

    setClient(mqttClient);
  };

  const handleDisconnect = () => {
    if (client) {
      client.end();
      setClient(null);
      setConnectStatus('Desconectado');
    }
  };

  // Función nueva para enviar datos de prueba desde la misma app
  const handlePublishTest = () => {
    if (client && connectStatus === 'Conectado') {
      const testData = {
        velocidad: Math.floor(Math.random() * 120), // Velocidad aleatoria 0-120
        rpm: Math.floor(Math.random() * 6000),      // RPM aleatorio 0-6000
        bateria: 12.4
      };
      // Publicamos el JSON convertido a texto en el mismo tópico
      client.publish(topic, JSON.stringify(testData));
    }
  };

  useEffect(() => {
    return () => {
      if (client) client.end();
    };
  }, [client]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h2>Consola de Pruebas MQTT (Local)</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Broker (WebSocket URL):</label>
          <input
            type="text"
            value={brokerUrl}
            onChange={(e) => setBrokerUrl(e.target.value)}
            disabled={connectStatus === 'Conectado'}
            style={{ padding: '0.5rem', width: '250px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tópico:</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={connectStatus === 'Conectado'}
            style={{ padding: '0.5rem', width: '250px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <button
          onClick={handleConnect}
          disabled={connectStatus === 'Conectado' || connectStatus === 'Conectando...'}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}
        >
          Conectar
        </button>
        <button
          onClick={handleDisconnect}
          disabled={connectStatus === 'Desconectado'}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none' }}
        >
          Desconectar
        </button>

        {/* Botón de prueba agregado */}
        <button
          onClick={handlePublishTest}
          disabled={connectStatus !== 'Conectado'}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#2196F3', color: 'white', border: 'none', marginLeft: 'auto' }}
        >
          🚀 Enviar Dato de Prueba
        </button>
      </div>

      <span style={{
        fontWeight: 'bold',
        display: 'block',
        marginBottom: '1rem',
        color: connectStatus === 'Conectado' ? '#4CAF50' : connectStatus === 'Error de Conexión' ? '#f44336' : 'gray'
      }}>
        Estado: {connectStatus}
      </span>

      <div style={{ backgroundColor: '#2b2b2b', color: '#a9b7c6', padding: '1rem', borderRadius: '5px', height: '350px', overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <p style={{ color: '#888' }}>Esperando mensajes...</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: '1rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#cc7832' }}>[{msg.time}] </span>
              <span style={{ color: '#9876aa' }}>{msg.topic}</span><br />
              <strong style={{ color: '#6a8759' }}>{msg.payload}</strong>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
