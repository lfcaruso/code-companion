# Configuração do ESP32 com Cartão SD

Este documento descreve como configurar o ESP32 para servir a interface web do Aquarium Monitor a partir de um cartão microSD, com armazenamento completo de dados no cartão - **sem necessidade de banco de dados externo**.

## 🎯 Benefícios do Armazenamento Embarcado

- **Portabilidade Total**: Leve o ESP32 para qualquer local e acesse de qualquer computador
- **Sem Dependências**: Não precisa instalar banco de dados ou servidores
- **Backup Simples**: Basta copiar os arquivos do cartão SD
- **Funciona Offline**: Apenas conecte na rede local

## Requisitos de Hardware

- ESP32 (ESP32-WROOM-32 ou similar)
- Módulo de cartão microSD (SPI)
- Cartão microSD (FAT32, mínimo 4GB recomendado, Class 10+)
- Sensores: DS18B20 (temperatura), refratômetro, medidor de energia

## Estrutura de Arquivos no Cartão SD

Após executar `npm run build`, copie o conteúdo da pasta `dist/` para a raiz do cartão SD e crie a estrutura de dados:

```
/
├── index.html              (Interface web)
├── assets/
│   ├── index-XXXXX.js
│   └── index-XXXXX.css
├── robots.txt
│
└── data/                   (Dados persistentes - criado automaticamente)
    ├── config.json         (Configurações do sistema)
    ├── relays.json         (Nomes e configurações dos relés)
    ├── parameters.json     (Parâmetros manuais atuais)
    │
    └── history/            (Histórico de dados por mês)
        ├── temp_2024-01.json
        ├── temp_2024-02.json
        ├── params_2024-01.json
        ├── energy_2024-01.json
        └── ...
```

## Formatos de Arquivos de Dados

### config.json (Configurações)
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
  "refreshInterval": 3000,
  "alertsEnabled": true,
  "soundEnabled": true,
  "autoModeEnabled": true
}
```

### parameters.json (Parâmetros Manuais Atuais)
```json
{
  "ph": 8.2,
  "salinity": 1.025,
  "tds": 180,
  "kh": 9.0,
  "calcium": 420,
  "magnesium": 1350,
  "nitrate": 5,
  "phosphate": 0.03,
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

### parameters_history.json (Histórico de 30 dias)
```json
{
  "entries": [
    {
      "timestamp": "2024-01-10T10:30:00Z",
      "ph": 8.2,
      "salinity": 1.025,
      "kh": 9.0,
      "calcium": 420
    },
    {
      "timestamp": "2024-01-11T14:00:00Z",
      "nitrate": 5,
      "phosphate": 0.03
    }
  ],
  "lastCleanup": "2024-01-15T00:00:00Z"
}
```

### relays.json (Configuração dos Relés)
```json
[
  { "id": 0, "name": "Aquecedor", "icon": "thermometer", "isFixed": true },
  { "id": 1, "name": "Resfriamento", "icon": "snowflake", "isFixed": true },
  { "id": 2, "name": "Iluminação", "icon": "lightbulb", "isFixed": false },
  { "id": 3, "name": "Bomba Principal", "icon": "waves", "isFixed": false }
]
```

### history/temp_YYYY-MM.json (Histórico de Temperatura)
```json
{
  "type": "temperature",
  "year": 2024,
  "month": 1,
  "entries": [
    { "timestamp": "2024-01-15T00:00:00Z", "value": 25.5 },
    { "timestamp": "2024-01-15T00:05:00Z", "value": 25.6 },
    { "timestamp": "2024-01-15T00:10:00Z", "value": 25.5 }
  ]
}
```

## Endpoints da API (ESP32 deve implementar)

### Sensores e Controle

#### GET /api/sensors
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

#### POST /api/relay/:id
Alterna o estado de um relé.

```json
{ "state": true }
```

#### POST /api/relay/:id/timer
Configura o timer de um relé.

```json
{
  "timerEnabled": true,
  "onHour": 8,
  "onMinute": 0,
  "offHour": 20,
  "offMinute": 0
}
```

#### POST /api/relay/:id/name
Atualiza o nome de um relé (salva em relays.json).

```json
{ "name": "Iluminação Principal" }
```

### Configuração

#### GET /api/config
Retorna a configuração salva (config.json).

#### POST /api/config
Salva a configuração (config.json).

#### POST /api/config/reset
Reseta para as configurações de fábrica.

### Persistência de Dados (SD Card)

#### GET /api/data/parameters
Retorna parâmetros manuais atuais (parameters.json).

#### POST /api/data/parameters
Salva parâmetros manuais atuais (parameters.json).

```json
{
  "ph": 8.2,
  "salinity": 1.025,
  "tds": 180,
  "kh": 9.0,
  "calcium": 420,
  "magnesium": 1350,
  "nitrate": 5,
  "phosphate": 0.03,
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

#### GET /api/data/parameters/history
Retorna histórico de parâmetros manuais dos últimos 30 dias.

```json
{
  "entries": [
    {
      "timestamp": "2024-01-10T10:30:00Z",
      "ph": 8.2,
      "salinity": 1.025,
      "kh": 9.0
    }
  ],
  "lastCleanup": "2024-01-15T00:00:00Z"
}
```

#### POST /api/data/parameters/history
Adiciona uma entrada ao histórico de parâmetros (appends to history).

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "ph": 8.2,
  "kh": 9.0,
  "calcium": 420
}
```

#### POST /api/data/parameters/history/cleanup
Remove entradas com mais de 30 dias do histórico. Retorna contagem de registros removidos.

```json
{ "deletedCount": 15 }
```

#### GET /api/data/history/:type/:year/:month
Retorna histórico de um tipo específico para um mês (temperatura, energia, etc.).
- Tipos: `temperature`, `energy`
- Exemplo: `GET /api/data/history/temperature/2024/1`

#### POST /api/data/history/:type
Adiciona uma entrada ao histórico por tipo (cria arquivo do mês se não existir).

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "value": 25.5
}
```

#### DELETE /api/data/history/:type/:year/:month
Remove um arquivo de histórico específico.

#### GET /api/data/relays
Retorna configurações dos relés (relays.json).

#### POST /api/data/relays
Salva configurações dos relés (relays.json).

#### GET /api/data/export
Exporta todos os dados como arquivo ZIP para backup.

#### POST /api/data/import
Importa dados de um arquivo ZIP (FormData com campo 'file').

## Código Arduino ESP32 (Exemplo Completo para ESP32-WROOM)

Este código implementa todas as funcionalidades necessárias para integração perfeita com a interface web.

```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <SD.h>
#include <SPI.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <time.h>

// ========== CONFIGURAÇÃO DE HARDWARE ==========
#define SD_CS       5     // Chip Select do SD Card
#define ONE_WIRE_BUS 4    // Sensor DS18B20
#define EEPROM_SIZE 512   // Tamanho da EEPROM

// Pinos dos Relés (ajuste conforme seu hardware)
const int RELAY_PINS[10] = {
  13,   // Relé 0 - Aquecedor
  12,   // Relé 1 - Resfriamento (cooler/chiller)
  14,   // Relé 2 - Iluminação
  27,   // Relé 3 - Bomba Principal
  26,   // Relé 4 - Skimmer
  25,   // Relé 5 - Bomba Dosadora
  33,   // Relé 6 - UV
  32,   // Relé 7 - Wavemaker
  15,   // Relé 8 - Alimentador
  2     // Relé 9 - Reserva
};

// ========== OBJETOS GLOBAIS ==========
WebServer server(80);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// ========== ESTRUTURAS DE DADOS ==========
struct Config {
  float tempSetpoint = 26.0;
  float tempHysteresis = 0.5;
  float tempMin = 24.0;
  float tempMax = 28.0;
  float phMin = 8.0;
  float phMax = 8.4;
  float salinityMin = 1.023;
  float salinityMax = 1.027;
  int refreshInterval = 3;
  bool alertsEnabled = true;
  bool autoModeEnabled = true;
};

struct RelayState {
  bool state = false;
  bool autoMode = false;
  bool timerEnabled = false;
  int timerOnHour = 0;
  int timerOnMinute = 0;
  int timerOffHour = 0;
  int timerOffMinute = 0;
};

struct EnergyData {
  float currentWatts = 0;
  float dailyKwh = 0;
  float monthlyKwh = 0;
  float cost = 0;
};

// ========== VARIÁVEIS GLOBAIS ==========
Config config;
RelayState relays[10];
EnergyData energy;
float currentTemperature = 25.0;
unsigned long lastTempRead = 0;
unsigned long lastHistorySave = 0;
const char* ssid = "SUA_REDE_WIFI";
const char* password = "SUA_SENHA_WIFI";

WebServer server(80);

// Funções auxiliares
// ========== FUNÇÕES AUXILIARES ==========

String getContentType(String filename) {
  if (filename.endsWith(".html")) return "text/html";
  if (filename.endsWith(".css")) return "text/css";
  if (filename.endsWith(".js")) return "application/javascript";
  if (filename.endsWith(".json")) return "application/json";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".ico")) return "image/x-icon";
  if (filename.endsWith(".gz")) return "application/gzip";
  return "text/plain";
}

void ensureDir(String path) {
  if (!SD.exists(path)) {
    SD.mkdir(path);
  }
}

String readJsonFile(String path) {
  if (!SD.exists(path)) return "{}";
  File file = SD.open(path, FILE_READ);
  if (!file) return "{}";
  String content = file.readString();
  file.close();
  return content;
}

bool writeJsonFile(String path, String content) {
  File file = SD.open(path, FILE_WRITE);
  if (!file) return false;
  file.print(content);
  file.close();
  return true;
}

String getISOTimestamp() {
  time_t now = time(nullptr);
  struct tm* t = localtime(&now);
  char buf[25];
  sprintf(buf, "%04d-%02d-%02dT%02d:%02d:%02dZ",
    t->tm_year + 1900, t->tm_mon + 1, t->tm_mday,
    t->tm_hour, t->tm_min, t->tm_sec);
  return String(buf);
}

// ========== CONTROLE DE TEMPERATURA COM HISTERESE ==========

void updateTemperatureControl() {
  if (!config.autoModeEnabled) return;
  
  // Lógica de histerese para aquecedor (Relé 0)
  // Liga quando temp < setpoint - hysteresis
  // Desliga quando temp > setpoint
  if (currentTemperature < (config.tempSetpoint - config.tempHysteresis)) {
    if (!relays[0].state) {
      relays[0].state = true;
      digitalWrite(RELAY_PINS[0], HIGH);
      Serial.println("🔥 Aquecedor LIGADO");
    }
  } else if (currentTemperature >= config.tempSetpoint) {
    if (relays[0].state) {
      relays[0].state = false;
      digitalWrite(RELAY_PINS[0], LOW);
      Serial.println("🔥 Aquecedor DESLIGADO");
    }
  }

  // Lógica de histerese para resfriamento (Relé 1)
  // Liga quando temp > setpoint + hysteresis
  // Desliga quando temp < setpoint
  if (currentTemperature > (config.tempSetpoint + config.tempHysteresis)) {
    if (!relays[1].state) {
      relays[1].state = true;
      digitalWrite(RELAY_PINS[1], HIGH);
      Serial.println("❄️ Resfriamento LIGADO");
    }
  } else if (currentTemperature <= config.tempSetpoint) {
    if (relays[1].state) {
      relays[1].state = false;
      digitalWrite(RELAY_PINS[1], LOW);
      Serial.println("❄️ Resfriamento DESLIGADO");
    }
  }
}

// ========== CONTROLE DE TIMERS DOS RELÉS ==========

void updateRelayTimers() {
  time_t now = time(nullptr);
  struct tm* t = localtime(&now);
  int currentMinutes = t->tm_hour * 60 + t->tm_min;

  for (int i = 2; i < 10; i++) {  // Relés 2-9 (0-1 são controlados por temperatura)
    if (!relays[i].timerEnabled) continue;

    int onMinutes = relays[i].timerOnHour * 60 + relays[i].timerOnMinute;
    int offMinutes = relays[i].timerOffHour * 60 + relays[i].timerOffMinute;

    bool shouldBeOn;
    if (onMinutes < offMinutes) {
      // Período normal (ex: 08:00 - 20:00)
      shouldBeOn = (currentMinutes >= onMinutes && currentMinutes < offMinutes);
    } else {
      // Período que cruza meia-noite (ex: 22:00 - 06:00)
      shouldBeOn = (currentMinutes >= onMinutes || currentMinutes < offMinutes);
    }

    if (shouldBeOn != relays[i].state) {
      relays[i].state = shouldBeOn;
      digitalWrite(RELAY_PINS[i], shouldBeOn ? HIGH : LOW);
      Serial.printf("⏰ Relé %d %s pelo timer\n", i, shouldBeOn ? "LIGADO" : "DESLIGADO");
    }
  }
}

// ========== LEITURA DE SENSORES ==========

void readSensors() {
  if (millis() - lastTempRead >= 1000) {  // Lê a cada 1 segundo
    sensors.requestTemperatures();
    float temp = sensors.getTempCByIndex(0);
    if (temp != DEVICE_DISCONNECTED_C && temp > -50 && temp < 100) {
      currentTemperature = temp;
    }
    lastTempRead = millis();
  }
}

// ========== API HANDLERS ==========

void handleGetSensors() {
  StaticJsonDocument<1024> doc;
  
  doc["temperature"] = currentTemperature;
  doc["temperatureSetpoint"] = config.tempSetpoint;
  doc["salinity"] = 1.025;  // Valor manual, retornar do parameters.json

  JsonArray relayArray = doc.createNestedArray("relays");
  for (int i = 0; i < 10; i++) {
    JsonObject r = relayArray.createNestedObject();
    r["id"] = i;
    r["state"] = relays[i].state;
    r["autoMode"] = (i < 2) ? config.autoModeEnabled : relays[i].autoMode;
    r["timerEnabled"] = relays[i].timerEnabled;
    r["timerOnHour"] = relays[i].timerOnHour;
    r["timerOnMinute"] = relays[i].timerOnMinute;
    r["timerOffHour"] = relays[i].timerOffHour;
    r["timerOffMinute"] = relays[i].timerOffMinute;
  }

  JsonObject energyObj = doc.createNestedObject("energy");
  energyObj["currentWatts"] = energy.currentWatts;
  energyObj["dailyKwh"] = energy.dailyKwh;
  energyObj["monthlyKwh"] = energy.monthlyKwh;
  energyObj["cost"] = energy.cost;

  doc["timestamp"] = getISOTimestamp();

  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);

  // Auto-save histórico a cada 5 minutos
  if (millis() - lastHistorySave > 300000) {
    saveTemperatureToHistory();
    lastHistorySave = millis();
  }
}

void handlePostRelay() {
  int id = server.pathArg(0).toInt();
  if (id < 0 || id > 9) {
    server.send(400, "application/json", "{\"error\":\"Invalid relay ID\"}");
    return;
  }

  StaticJsonDocument<64> doc;
  deserializeJson(doc, server.arg("plain"));
  
  bool newState = doc["state"];
  relays[id].state = newState;
  digitalWrite(RELAY_PINS[id], newState ? HIGH : LOW);

  Serial.printf("📍 Relé %d alterado para %s via API\n", id, newState ? "LIGADO" : "DESLIGADO");
  server.send(200, "application/json", "{\"success\":true}");
}

void handlePostRelayTimer() {
  int id = server.pathArg(0).toInt();
  if (id < 0 || id > 9) {
    server.send(400, "application/json", "{\"error\":\"Invalid relay ID\"}");
    return;
  }

  StaticJsonDocument<128> doc;
  deserializeJson(doc, server.arg("plain"));

  relays[id].timerEnabled = doc["timerEnabled"];
  relays[id].timerOnHour = doc["onHour"];
  relays[id].timerOnMinute = doc["onMinute"];
  relays[id].timerOffHour = doc["offHour"];
  relays[id].timerOffMinute = doc["offMinute"];

  saveRelaysToSD();
  server.send(200, "application/json", "{\"success\":true}");
}

void handlePostTemperatureSetpoint() {
  StaticJsonDocument<64> doc;
  deserializeJson(doc, server.arg("plain"));
  
  config.tempSetpoint = doc["setpoint"];
  saveConfigToEEPROM();
  
  Serial.printf("🎯 Novo setpoint: %.1f°C\n", config.tempSetpoint);
  server.send(200, "application/json", "{\"success\":true}");
}

void handleGetConfig() {
  StaticJsonDocument<512> doc;
  doc["tempMin"] = config.tempMin;
  doc["tempMax"] = config.tempMax;
  doc["tempSetpoint"] = config.tempSetpoint;
  doc["tempHysteresis"] = config.tempHysteresis;
  doc["phMin"] = config.phMin;
  doc["phMax"] = config.phMax;
  doc["phAlertEnabled"] = true;
  doc["salinityMin"] = config.salinityMin;
  doc["salinityMax"] = config.salinityMax;
  doc["salinityAlertEnabled"] = true;
  doc["tdsMin"] = 100;
  doc["tdsMax"] = 400;
  doc["tdsAlertEnabled"] = true;
  doc["refreshInterval"] = config.refreshInterval;
  doc["alertsEnabled"] = config.alertsEnabled;
  doc["soundEnabled"] = false;
  doc["autoModeEnabled"] = config.autoModeEnabled;

  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void handlePostConfig() {
  StaticJsonDocument<512> doc;
  deserializeJson(doc, server.arg("plain"));

  config.tempMin = doc["tempMin"] | config.tempMin;
  config.tempMax = doc["tempMax"] | config.tempMax;
  config.tempSetpoint = doc["tempSetpoint"] | config.tempSetpoint;
  config.tempHysteresis = doc["tempHysteresis"] | config.tempHysteresis;
  config.phMin = doc["phMin"] | config.phMin;
  config.phMax = doc["phMax"] | config.phMax;
  config.salinityMin = doc["salinityMin"] | config.salinityMin;
  config.salinityMax = doc["salinityMax"] | config.salinityMax;
  config.refreshInterval = doc["refreshInterval"] | config.refreshInterval;
  config.alertsEnabled = doc["alertsEnabled"] | config.alertsEnabled;
  config.autoModeEnabled = doc["autoModeEnabled"] | config.autoModeEnabled;

  saveConfigToEEPROM();
  server.send(200, "application/json", "{\"success\":true}");
}

void handleResetConfig() {
  config = Config();  // Reset para valores padrão
  saveConfigToEEPROM();
  handleGetConfig();
}

void handleGetParameters() {
  ensureDir("/data");
  String content = readJsonFile("/data/parameters.json");
  server.send(200, "application/json", content);
}

void handlePostParameters() {
  ensureDir("/data");
  if (writeJsonFile("/data/parameters.json", server.arg("plain"))) {
    
    // Salvar no histórico também
    StaticJsonDocument<256> doc;
    deserializeJson(doc, server.arg("plain"));
    
    saveParameterHistory("ph", doc["ph"]);
    saveParameterHistory("kh", doc["kh"]);
    saveParameterHistory("calcium", doc["calcium"]);
    saveParameterHistory("magnesium", doc["magnesium"]);
    saveParameterHistory("nitrate", doc["nitrate"]);
    saveParameterHistory("phosphate", doc["phosphate"]);
    
    server.send(200, "application/json", "{\"success\":true}");
  } else {
    server.send(500, "application/json", "{\"error\":\"Failed to save\"}");
  }
}

void handleGetHistory() {
  String type = server.pathArg(0);
  String year = server.pathArg(1);
  String month = server.pathArg(2);
  
  String path = "/data/history/" + type + "_" + year + "-" + 
                (month.length() == 1 ? "0" : "") + month + ".json";
  
  if (!SD.exists(path)) {
    // Retorna estrutura vazia
    server.send(200, "application/json", 
      "{\"type\":\"" + type + "\",\"year\":" + year + 
      ",\"month\":" + month + ",\"entries\":[]}");
    return;
  }
  
  String content = readJsonFile(path);
  server.send(200, "application/json", content);
}

void handlePostHistory() {
  String type = server.pathArg(0);
  
  // Obter data atual
  time_t now = time(nullptr);
  struct tm* timeinfo = localtime(&now);
  int year = timeinfo->tm_year + 1900;
  int month = timeinfo->tm_mon + 1;
  
  String filename = type + "_" + String(year) + "-" + 
                    (month < 10 ? "0" : "") + String(month) + ".json";
  String path = "/data/history/" + filename;
  
  ensureDir("/data");
  ensureDir("/data/history");
  
  // Ler histórico existente ou criar novo
  StaticJsonDocument<8192> doc;
  if (SD.exists(path)) {
    String existing = readJsonFile(path);
    deserializeJson(doc, existing);
  } else {
    doc["type"] = type;
    doc["year"] = year;
    doc["month"] = month;
    doc.createNestedArray("entries");
  }
  
  // Adicionar nova entrada
  StaticJsonDocument<128> entry;
  deserializeJson(entry, server.arg("plain"));
  
  JsonArray entries = doc["entries"];
  JsonObject newEntry = entries.createNestedObject();
  newEntry["timestamp"] = entry["timestamp"];
  newEntry["value"] = entry["value"];
  
  // Limitar tamanho (manter últimas 1000 entradas por arquivo)
  while (entries.size() > 1000) {
    entries.remove(0);
  }
  
  String output;
  serializeJson(doc, output);
  
  if (writeJsonFile(path, output)) {
    server.send(200, "application/json", "{\"success\":true}");
  } else {
    server.send(500, "application/json", "{\"error\":\"Failed to save\"}");
  }
}

void handleGetRelays() {
  ensureDir("/data");
  String content = readJsonFile("/data/relays.json");
  if (content == "{}") {
    // Retornar configuração padrão
    content = "[{\"id\":0,\"name\":\"Aquecedor\",\"icon\":\"thermometer\",\"isFixed\":true},"
              "{\"id\":1,\"name\":\"Resfriamento\",\"icon\":\"snowflake\",\"isFixed\":true},"
              "{\"id\":2,\"name\":\"Iluminação\",\"icon\":\"lightbulb\",\"isFixed\":false},"
              "{\"id\":3,\"name\":\"Bomba\",\"icon\":\"waves\",\"isFixed\":false}]";
  }
  server.send(200, "application/json", content);
}

void handlePostRelays() {
  ensureDir("/data");
  if (writeJsonFile("/data/relays.json", server.arg("plain"))) {
    server.send(200, "application/json", "{\"success\":true}");
  } else {
    server.send(500, "application/json", "{\"error\":\"Failed to save\"}");
  }
}

// ========== EEPROM E SD HELPERS ==========

void saveConfigToEEPROM() {
  EEPROM.put(0, config);
  EEPROM.commit();
  Serial.println("💾 Configuração salva na EEPROM");
}

void loadConfigFromEEPROM() {
  EEPROM.get(0, config);
  // Validar valores
  if (isnan(config.tempSetpoint) || config.tempSetpoint < 10 || config.tempSetpoint > 40) {
    config = Config();  // Reset para valores padrão
  }
  Serial.printf("📖 Config carregada: setpoint=%.1f, histerese=%.1f\n", 
    config.tempSetpoint, config.tempHysteresis);
}

void saveRelaysToSD() {
  StaticJsonDocument<1024> doc;
  JsonArray arr = doc.to<JsonArray>();
  
  for (int i = 0; i < 10; i++) {
    JsonObject r = arr.createNestedObject();
    r["id"] = i;
    r["timerEnabled"] = relays[i].timerEnabled;
    r["timerOnHour"] = relays[i].timerOnHour;
    r["timerOnMinute"] = relays[i].timerOnMinute;
    r["timerOffHour"] = relays[i].timerOffHour;
    r["timerOffMinute"] = relays[i].timerOffMinute;
  }
  
  String output;
  serializeJson(doc, output);
  writeJsonFile("/data/relays_state.json", output);
}

void loadRelaysFromSD() {
  String content = readJsonFile("/data/relays_state.json");
  if (content == "{}") return;
  
  StaticJsonDocument<1024> doc;
  deserializeJson(doc, content);
  
  JsonArray arr = doc.as<JsonArray>();
  for (JsonObject r : arr) {
    int id = r["id"];
    if (id >= 0 && id < 10) {
      relays[id].timerEnabled = r["timerEnabled"];
      relays[id].timerOnHour = r["timerOnHour"];
      relays[id].timerOnMinute = r["timerOnMinute"];
      relays[id].timerOffHour = r["timerOffHour"];
      relays[id].timerOffMinute = r["timerOffMinute"];
    }
  }
}

void saveTemperatureToHistory() {
  ensureDir("/data");
  ensureDir("/data/history");
  
  time_t now = time(nullptr);
  struct tm* t = localtime(&now);
  
  String filename = String("temp_") + String(t->tm_year + 1900) + "-" +
    (t->tm_mon + 1 < 10 ? "0" : "") + String(t->tm_mon + 1) + ".json";
  String path = "/data/history/" + filename;
  
  StaticJsonDocument<8192> doc;
  if (SD.exists(path)) {
    String existing = readJsonFile(path);
    deserializeJson(doc, existing);
  } else {
    doc["type"] = "temperature";
    doc["year"] = t->tm_year + 1900;
    doc["month"] = t->tm_mon + 1;
    doc.createNestedArray("entries");
  }
  
  JsonArray entries = doc["entries"];
  JsonObject entry = entries.createNestedObject();
  entry["timestamp"] = getISOTimestamp();
  entry["value"] = currentTemperature;
  
  // Limitar tamanho
  while (entries.size() > 1000) {
    entries.remove(0);
  }
  
  String output;
  serializeJson(doc, output);
  writeJsonFile(path, output);
}

// ========== SERVIR ARQUIVOS ESTÁTICOS ==========

void handleFileRequest() {
  String path = server.uri();
  if (path.endsWith("/")) path += "index.html";
  
  // SPA routing: retornar index.html para rotas não-API sem extensão
  if (!SD.exists(path) && !path.startsWith("/api/") && !path.contains(".")) {
    path = "/index.html";
  }
  
  File file = SD.open(path);
  if (!file) {
    server.send(404, "text/plain", "File not found: " + path);
    return;
  }
  
  String contentType = getContentType(path);
  
  // Cache headers para assets
  if (path.startsWith("/assets/")) {
    server.sendHeader("Cache-Control", "public, max-age=31536000");
  }
  
  server.streamFile(file, contentType);
  file.close();
}

// ========== SETUP ==========

void setup() {
  Serial.begin(115200);
  Serial.println("\n🐠 Aquarium Monitor ESP32 v1.0");
  
  // Inicializar EEPROM
  EEPROM.begin(EEPROM_SIZE);
  loadConfigFromEEPROM();
  
  // Inicializar pinos dos relés
  for (int i = 0; i < 10; i++) {
    pinMode(RELAY_PINS[i], OUTPUT);
    digitalWrite(RELAY_PINS[i], LOW);
  }
  Serial.println("✓ Relés inicializados");
  
  // Inicializar sensor de temperatura
  sensors.begin();
  sensors.setResolution(12);  // 12-bit = 0.0625°C precisão
  Serial.printf("✓ Sensor DS18B20 encontrado: %d\n", sensors.getDeviceCount());
  
  // Inicializar SD card
  if (!SD.begin(SD_CS)) {
    Serial.println("✗ Falha ao inicializar SD Card!");
    return;
  }
  Serial.println("✓ SD Card inicializado");
  
  // Criar estrutura de diretórios
  ensureDir("/data");
  ensureDir("/data/history");
  
  // Carregar configuração dos relés do SD
  loadRelaysFromSD();
  
  // Conectar WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.printf("✓ WiFi conectado: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n✗ Falha na conexão WiFi");
  }
  
  // Configurar NTP (fuso horário Brasil -3h)
  configTime(-3 * 3600, 0, "pool.ntp.org", "time.google.com");
  
  // ========== ROTAS DA API ==========
  
  // Sensores (leitura em tempo real)
  server.on("/api/sensors", HTTP_GET, handleGetSensors);
  
  // Controle de Relés
  server.on("/api/relay/(\\d+)", HTTP_POST, handlePostRelay);
  server.on("/api/relay/(\\d+)/timer", HTTP_POST, handlePostRelayTimer);
  
  // Setpoint de Temperatura (controle direto)
  server.on("/api/temperature/setpoint", HTTP_POST, handlePostTemperatureSetpoint);
  
  // Configuração (EEPROM)
  server.on("/api/config", HTTP_GET, handleGetConfig);
  server.on("/api/config", HTTP_POST, handlePostConfig);
  server.on("/api/config/reset", HTTP_POST, handleResetConfig);
  
  // Persistência de dados (SD Card)
  server.on("/api/data/parameters", HTTP_GET, handleGetParameters);
  server.on("/api/data/parameters", HTTP_POST, handlePostParameters);
  server.on("/api/data/parameters/history", HTTP_GET, handleGetParametersHistory);
  server.on("/api/data/parameters/history", HTTP_POST, handlePostParametersHistory);
  server.on("/api/data/parameters/history/cleanup", HTTP_POST, handleCleanupParametersHistory);
  server.on("/api/data/relays", HTTP_GET, handleGetRelays);
  server.on("/api/data/relays", HTTP_POST, handlePostRelays);
  server.on("/api/data/history/(\\w+)/(\\d+)/(\\d+)", HTTP_GET, handleGetHistory);
  server.on("/api/data/history/(\\w+)", HTTP_POST, handlePostHistory);
  
  // Servir arquivos estáticos do SD
  server.onNotFound(handleFileRequest);
  
  server.begin();
  Serial.println("✓ Servidor HTTP iniciado na porta 80");
  Serial.println("======================================");
}

// ========== LOOP PRINCIPAL ==========

void loop() {
  server.handleClient();
  
  // Leitura de sensores
  readSensors();
  
  // Controle de temperatura com histerese
  updateTemperatureControl();
  
  // Controle de timers dos relés
  updateRelayTimers();
  
  // Pequeno delay para estabilidade
  delay(10);
}
```

## Bibliotecas Necessárias

Instale via Arduino IDE Library Manager ou PlatformIO:

```
- WiFi (built-in ESP32)
- WebServer (built-in ESP32)
- SD (built-in ESP32)
- SPI (built-in ESP32)
- EEPROM (built-in ESP32)
- ArduinoJson (by Benoit Blanchon) - v6.x ou v7.x
- OneWire (by Jim Studt)
- DallasTemperature (by Miles Burton)
```

## Dicas de Otimização

1. **Compressão Gzip**: Execute `npm run build` e compacte os arquivos JS/CSS
2. **Cache Headers**: Assets já tem cache de 1 ano configurado
3. **Cartão SD Rápido**: Use cartão Class 10 ou superior
4. **WiFi Estático**: Configure IP estático para conexão mais rápida
5. **Histórico**: O sistema limpa automaticamente entradas com mais de 30 dias

## Conexões de Hardware

### SD Card Module (SPI)
```
ESP32-WROOM    SD Card Module
-----------    --------------
GPIO5  ------>  CS
GPIO23 ------>  MOSI
GPIO19 ------>  MISO
GPIO18 ------>  SCK
3.3V   ------>  VCC
GND    ------>  GND
```

### Sensor DS18B20 (Temperatura)
```
ESP32-WROOM    DS18B20
-----------    -------
GPIO4  ------>  DATA (com resistor 4.7kΩ para 3.3V)
3.3V   ------>  VCC
GND    ------>  GND
```

### Relés (10 canais)
```
ESP32-WROOM    Módulo Relés
-----------    ------------
GPIO13 ------>  Relé 0 (Aquecedor)
GPIO12 ------>  Relé 1 (Resfriamento)
GPIO14 ------>  Relé 2 (Iluminação)
GPIO27 ------>  Relé 3 (Bomba Principal)
GPIO26 ------>  Relé 4 (Skimmer)
GPIO25 ------>  Relé 5 (Bomba Dosadora)
GPIO33 ------>  Relé 6 (UV)
GPIO32 ------>  Relé 7 (Wavemaker)
GPIO15 ------>  Relé 8 (Alimentador)
GPIO2  ------>  Relé 9 (Reserva)
5V/VIN ------>  VCC
GND    ------>  GND
```

## Backup e Restauração

### Fazer Backup
1. Remova o cartão SD do ESP32
2. Copie a pasta `/data` para seu computador
3. Ou use o endpoint `GET /api/data/export` para baixar um ZIP

### Restaurar Backup
1. Copie a pasta `/data` de volta para o cartão SD
2. Ou use o endpoint `POST /api/data/import` com o arquivo ZIP

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Página não carrega | Verifique se os arquivos do `dist/` estão na raiz do SD |
| API não responde | Verifique conexão WiFi e IP do ESP32 |
| Dados não salvam | Verifique se `/data` existe e há espaço no SD |
| Temperatura errada | Verifique conexão do DS18B20 e resistor de 4.7kΩ |
| Relé não liga | Verifique se o pino está correto e módulo alimentado |
| Lentidão | Use cartão SD Class 10+ e ative compressão gzip |
