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

## Código Arduino ESP32 (Exemplo Completo)

```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <SD.h>
#include <ArduinoJson.h>
#include <time.h>

WebServer server(80);

// Pinos
#define SD_CS 5
#define TEMP_SENSOR 4

// Funções auxiliares
String getContentType(String filename) {
  if (filename.endsWith(".html")) return "text/html";
  if (filename.endsWith(".css")) return "text/css";
  if (filename.endsWith(".js")) return "application/javascript";
  if (filename.endsWith(".json")) return "application/json";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".ico")) return "image/x-icon";
  return "text/plain";
}

// Criar diretório se não existir
void ensureDir(String path) {
  if (!SD.exists(path)) {
    SD.mkdir(path);
  }
}

// Ler arquivo JSON do SD
String readJsonFile(String path) {
  if (!SD.exists(path)) return "{}";
  
  File file = SD.open(path, FILE_READ);
  if (!file) return "{}";
  
  String content = file.readString();
  file.close();
  return content;
}

// Escrever arquivo JSON no SD
bool writeJsonFile(String path, String content) {
  File file = SD.open(path, FILE_WRITE);
  if (!file) return false;
  
  file.print(content);
  file.close();
  return true;
}

// Servir arquivos estáticos do SD card
void handleFileRequest() {
  String path = server.uri();
  if (path.endsWith("/")) path += "index.html";
  
  if (!SD.exists(path)) {
    // Tentar index.html para SPA routing
    if (!path.startsWith("/api/") && !path.contains(".")) {
      path = "/index.html";
    }
  }
  
  File file = SD.open(path);
  if (!file) {
    server.send(404, "text/plain", "File not found");
    return;
  }
  
  String contentType = getContentType(path);
  
  // Cache para assets estáticos
  if (path.startsWith("/assets/")) {
    server.sendHeader("Cache-Control", "public, max-age=31536000");
  }
  
  server.streamFile(file, contentType);
  file.close();
}

// ========== API Handlers ==========

void handleGetSensors() {
  StaticJsonDocument<512> doc;
  
  // Ler temperatura do sensor
  doc["temperature"] = readTemperature();
  doc["temperatureSetpoint"] = getSetpoint();
  doc["salinity"] = getSalinity();
  
  // Ler estado dos relés
  JsonArray relays = doc.createNestedArray("relays");
  for (int i = 0; i < 4; i++) {
    JsonObject relay = relays.createNestedObject();
    relay["id"] = i;
    relay["state"] = getRelayState(i);
    relay["autoMode"] = getRelayAutoMode(i);
    relay["timerEnabled"] = getRelayTimerEnabled(i);
    relay["timerOnHour"] = getRelayTimerOnHour(i);
    relay["timerOnMinute"] = getRelayTimerOnMinute(i);
    relay["timerOffHour"] = getRelayTimerOffHour(i);
    relay["timerOffMinute"] = getRelayTimerOffMinute(i);
  }
  
  // Energia
  JsonObject energy = doc.createNestedObject("energy");
  energy["currentWatts"] = getCurrentWatts();
  energy["dailyKwh"] = getDailyKwh();
  energy["monthlyKwh"] = getMonthlyKwh();
  energy["cost"] = getEnergyCost();
  
  doc["timestamp"] = getISOTimestamp();
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
  
  // Auto-save histórico a cada 5 minutos
  static unsigned long lastHistorySave = 0;
  if (millis() - lastHistorySave > 300000) {
    saveTemperatureHistory(doc["temperature"]);
    saveEnergyHistory(doc["energy"]["currentWatts"]);
    lastHistorySave = millis();
  }
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

void setup() {
  Serial.begin(115200);
  
  // Inicializar SD card
  if (!SD.begin(SD_CS)) {
    Serial.println("SD Card initialization failed!");
    return;
  }
  Serial.println("SD Card initialized.");
  
  // Criar estrutura de diretórios
  ensureDir("/data");
  ensureDir("/data/history");
  
  // Conectar WiFi
  WiFi.begin("SSID", "PASSWORD");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected: " + WiFi.localIP().toString());
  
  // Configurar NTP para timestamps
  configTime(-3 * 3600, 0, "pool.ntp.org");
  
  // ========== Rotas da API ==========
  
  // Sensores
  server.on("/api/sensors", HTTP_GET, handleGetSensors);
  
  // Relés
  server.on("/api/relay/(\\d+)", HTTP_POST, handlePostRelay);
  server.on("/api/relay/(\\d+)/timer", HTTP_POST, handlePostRelayTimer);
  server.on("/api/relay/(\\d+)/name", HTTP_POST, handlePostRelayName);
  
  // Configuração
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
  server.on("/api/data/history/(\\w+)/(\\d+)/(\\d+)", HTTP_DELETE, handleDeleteHistory);
  server.on("/api/data/export", HTTP_GET, handleExportData);
  server.on("/api/data/import", HTTP_POST, handleImportData);
  
  // Servir arquivos estáticos do SD
  server.onNotFound(handleFileRequest);
  
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
  
  // Outras tarefas...
  updateRelayTimers();
  updateTemperatureControl();
}
```

## Dicas de Otimização

1. **Compressão Gzip**: Compacte os arquivos JS/CSS e sirva com `Content-Encoding: gzip`
2. **Cache Headers**: Já implementado no exemplo (1 ano para assets)
3. **Cartão SD Rápido**: Use cartão Class 10 ou superior para melhor performance
4. **WiFi**: Configure IP estático para conexão mais rápida
5. **Limpeza de Histórico**: Implemente rotação automática (ex: manter últimos 12 meses)

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

## Backup e Restauração

### Fazer Backup
1. Remova o cartão SD do ESP32
2. Copie a pasta `/data` para seu computador
3. Ou use o endpoint `GET /api/data/export` para baixar um ZIP

### Restaurar Backup
1. Copie a pasta `/data` de volta para o cartão SD
2. Ou use o endpoint `POST /api/data/import` com o arquivo ZIP

## Troubleshooting

- **Página não carrega**: Verifique se os arquivos estão na raiz do SD
- **API não responde**: Verifique se o ESP32 está conectado ao WiFi
- **Dados não salvam**: Verifique se a pasta `/data` existe e há espaço no SD
- **Histórico não aparece**: Verifique os arquivos em `/data/history/`
- **Lentidão**: Use cartão SD Class 10 e ative compressão gzip
