# Configuração do ESP32 com Cartão SD

Este documento descreve como configurar o ESP32 para servir a interface web do Aquarium Monitor a partir de um cartão microSD.

## Requisitos de Hardware

- ESP32 (ESP32-WROOM-32 ou similar)
- Módulo de cartão microSD (SPI)
- Cartão microSD (FAT32, mínimo 4GB recomendado)
- Sensores: DS18B20 (temperatura), refratômetro, medidor de energia

## Estrutura de Arquivos no Cartão SD

Após executar `npm run build`, copie o conteúdo da pasta `dist/` para a raiz do cartão SD:

```
/
├── index.html
├── assets/
│   ├── index-XXXXX.js
│   └── index-XXXXX.css
└── robots.txt
```

## Endpoints da API (ESP32 deve implementar)

### GET /api/sensors
Retorna dados dos sensores em tempo real.

```json
{
  "temperature": 25.5,
  "temperatureSetpoint": 26.0,
  "salinity": 1.025,
  "relays": [
    {
      "id": 0,
      "state": true,
      "autoMode": true,
      "timerEnabled": false,
      "timerOnHour": 0,
      "timerOnMinute": 0,
      "timerOffHour": 0,
      "timerOffMinute": 0
    }
  ],
  "energy": {
    "currentWatts": 85,
    "dailyKwh": 1.2,
    "monthlyKwh": 32.5,
    "cost": 24.80
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /api/relay/:id
Alterna o estado de um relé.

**Request Body:**
```json
{
  "state": true
}
```

### POST /api/relay/:id/timer
Configura o timer de um relé.

**Request Body:**
```json
{
  "timerEnabled": true,
  "onHour": 8,
  "onMinute": 0,
  "offHour": 20,
  "offMinute": 0
}
```

### POST /api/relay/:id/name
Atualiza o nome de um relé.

**Request Body:**
```json
{
  "name": "Iluminação Principal"
}
```

### POST /api/temperature/setpoint
Define o setpoint de temperatura.

**Request Body:**
```json
{
  "setpoint": 26.0
}
```

### GET /api/config
Retorna a configuração salva na EEPROM.

```json
{
  "tempMin": 24.0,
  "tempMax": 28.0,
  "tempSetpoint": 26.0,
  "tempHysteresis": 0.5,
  "phMin": 8.0,
  "phMax": 8.4,
  "phAlertEnabled": true,
  "salinityMin": 1.023,
  "salinityMax": 1.027,
  "salinityAlertEnabled": true,
  "tdsMin": 150,
  "tdsMax": 250,
  "tdsAlertEnabled": true,
  "refreshInterval": 3000,
  "alertsEnabled": true,
  "soundEnabled": true,
  "autoModeEnabled": true
}
```

### POST /api/config
Salva a configuração na EEPROM.

### POST /api/config/reset
Reseta para as configurações de fábrica.

## Código Arduino ESP32 (Exemplo)

```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <SD.h>
#include <ArduinoJson.h>

WebServer server(80);

// Servir arquivos do SD card
void handleFileRequest() {
  String path = server.uri();
  if (path.endsWith("/")) path += "index.html";
  
  File file = SD.open(path);
  if (!file) {
    server.send(404, "text/plain", "File not found");
    return;
  }
  
  String contentType = getContentType(path);
  server.streamFile(file, contentType);
  file.close();
}

void setup() {
  // Inicializar SD card
  if (!SD.begin(5)) { // CS pin = 5
    Serial.println("SD Card initialization failed!");
    return;
  }
  
  // Configurar rotas da API
  server.on("/api/sensors", HTTP_GET, handleSensors);
  server.on("/api/config", HTTP_GET, handleGetConfig);
  server.on("/api/config", HTTP_POST, handlePostConfig);
  // ... outras rotas
  
  // Servir arquivos estáticos do SD
  server.onNotFound(handleFileRequest);
  
  server.begin();
}
```

## Dicas de Otimização

1. **Compressão Gzip**: Compacte os arquivos JS/CSS e sirva com `Content-Encoding: gzip`
2. **Cache Headers**: Adicione headers de cache para arquivos estáticos
3. **Cartão SD Rápido**: Use cartão Class 10 ou superior
4. **WiFi**: Configure IP estático para conexão mais rápida

## Conexões Típicas

```
ESP32          SD Card Module
------         --------------
GPIO5  ------>  CS
GPIO23 ------>  MOSI
GPIO19 ------>  MISO
GPIO18 ------>  CLK
3.3V   ------>  VCC
GND    ------>  GND
```

## Troubleshooting

- **Página não carrega**: Verifique se os arquivos estão na raiz do SD
- **API não responde**: Verifique se o ESP32 está conectado ao WiFi
- **Dados não atualizam**: Verifique o intervalo de polling (3 segundos)
