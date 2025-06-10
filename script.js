import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyAXZKdkx72F2GvM7qaynr5r9agAMAiVX2s",
  authDomain: "commonpjt-fd9ed.firebaseapp.com",
  databaseURL: "https://commonpjt-fd9ed-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "commonpjt-fd9ed",
  storageBucket: "commonpjt-fd9ed.firebasestorage.app",
  messagingSenderId: "653463134970",
  appId: "1:653463134970:web:8301b6f3a2bde8da201f43"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// 데이터 로딩
const dbRef = ref(database);
onValue(dbRef, (snapshot) => {
  const data = snapshot.val();
  displayFormattedSensorData(data);
}, handleError);

// 데이터 출력 함수
function displayFormattedSensorData(data) {
  const dataContainer = document.getElementById('data-container');
  const loadingElement = document.getElementById('loading');
  loadingElement.style.display = 'none';

  if (!data || typeof data !== 'object') {
    dataContainer.innerHTML = '<p class="no-data">No data found.</p>';
    return;
  }

  let html = '';

  for (const [studentName, modules] of Object.entries(data)) {
    // info와 sensehat가 모두 없으면 출력하지 않음
    if (!modules.info && !modules.sensehat) continue;

    html += `<div class="module-card">`;
    html += `<div class="module-header"><h2 class="module-title">${studentName}</h2></div>`;

    // info 구역만 출력
    if (modules.info) {
      const infoObj = typeof modules.info === 'string' ? JSON.parse(modules.info) : modules.info;
      html += `<div class="module-section">`;
      html += `<div class="section-title">📋 info</div>`;
      html += `<div class="sensor-grid">`;
      for (const [key, value] of Object.entries(infoObj)) {
        const label = getLocalizedSensorName(key);
        const formattedValue = formatSensorValue(value, key);
        html += `
          <div class="sensor-item">
            <div class="sensor-icon">${getSensorIcon(key)}</div>
            <div class="sensor-info">
              <div class="sensor-name">${label}</div>
              <div class="sensor-value">${formattedValue}</div>
            </div>
          </div>`;
      }
      html += `</div></div>`;
    }

    // sensehat 구역만 출력
    if (modules.sensehat) {
      const sensehatObj = typeof modules.sensehat === 'string' ? JSON.parse(modules.sensehat) : modules.sensehat;
      html += `<div class="module-section">`;
      html += `<div class="section-title">🎛️ SenseHAT</div>`;
      html += `<div class="sensor-grid">`;
      for (const [key, value] of Object.entries(sensehatObj)) {
        const label = getLocalizedSensorName(key);
        const formattedValue = formatSensorValue(value, key);
        html += `
          <div class="sensor-item">
            <div class="sensor-icon">${getSensorIcon(key)}</div>
            <div class="sensor-info">
              <div class="sensor-name">${label}</div>
              <div class="sensor-value">${formattedValue}</div>
              ${getSensorGraphic(key, value)}
            </div>
          </div>`;
      }
      html += `</div></div>`;
    }

    html += `</div>`; // module-card 끝
  }

  dataContainer.innerHTML = html;
}

// 센서 그래픽 출력 함수
function getSensorGraphic(sensorKey, value) {
  const name = sensorKey.toLowerCase();

  // 값이 객체이고 키가 하나만 있을 때(예: {humidity: 25.1})
  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value);
    if (keys.length === 1) {
      const innerKey = keys[0];
      const innerValue = value[innerKey];
      // 온도 게이지
      if (innerKey.toLowerCase().includes('temp') && typeof innerValue === 'number') {
        const percent = Math.min(Math.max((innerValue + 10) / 50, 0), 1) * 100;
        return `<div class="gauge-bar gauge-temp"><div style="width:${percent}%"></div></div>`;
      }
      // 습도 게이지
      if (innerKey.toLowerCase().includes('humid') && typeof innerValue === 'number') {
        const percent = Math.min(Math.max(innerValue / 100, 0), 1) * 100;
        return `<div class="gauge-bar gauge-humid"><div style="width:${percent}%"></div></div>`;
      }
      // 기압 게이지
      if (innerKey.toLowerCase().includes('pressure') && typeof innerValue === 'number') {
        const percent = Math.min(Math.max((innerValue - 950) / 100, 0), 1) * 100;
        return `<div class="gauge-bar gauge-pressure"><div style="width:${percent}%"></div></div>`;
      }
      return '';
    }
  }

  // 기존 코드 (값이 숫자일 때)
  if (name.includes('temp') && typeof value === 'number') {
    const percent = Math.min(Math.max((value + 10) / 50, 0), 1) * 100;
    return `<div class="gauge-bar gauge-temp"><div style="width:${percent}%"></div></div>`;
  }
  if (name.includes('humid') && typeof value === 'number') {
    const percent = Math.min(Math.max(value / 100, 0), 1) * 100;
    return `<div class="gauge-bar gauge-humid"><div style="width:${percent}%"></div></div>`;
  }
  if (name.includes('pressure') && typeof value === 'number') {
    const percent = Math.min(Math.max((value - 950) / 100, 0), 1) * 100;
    return `<div class="gauge-bar gauge-pressure"><div style="width:${percent}%"></div></div>`;
  }
  // 3축 센서(자이로, 가속도 등)는 그래픽 출력 없이 빈 문자열 반환
  if ((name.includes('gyro') || name.includes('accel') || name.includes('magnet')) && typeof value === 'object') {
    return '';
  }
  return '';
}

// 에러 처리 함수
function handleError(error) {
  const dataContainer = document.getElementById('data-container');
  const loadingElement = document.getElementById('loading');
  loadingElement.style.display = 'none';
  dataContainer.innerHTML = `<p class="error">Error loading data: ${error.message}</p>`;
  console.error('Firebase error:', error);
}

// 센서 이름 한글 매핑 객체
const SENSOR_NAME_MAP = {
  temp: '온도',
  temperature: '온도',
  humid: '습도',
  humidity: '습도',
  pressure: '기압',
  gyro: '자이로',
  gyroscope: '자이로',
  accel: '가속도',
  accelerometer: '가속도',
  magnet: '자기장',
  magnetometer: '자기장',
  led: 'LED',
  joystick: '조이스틱',
  light: '조도',
  sound: '소리'
  // 필요시 추가
};

// 센서 이름을 한글로 반환
function getLocalizedSensorName(sensorKey) {
  const key = sensorKey.toLowerCase();
  // 매핑 객체에서 키워드가 포함된 항목을 찾아 반환
  for (const mapKey in SENSOR_NAME_MAP) {
    if (key.includes(mapKey)) {
      return SENSOR_NAME_MAP[mapKey];
    }
  }
  return sensorKey;
}

// 센서 값을 포맷 처리
function formatSensorValue(value, sensorName) {
  if (typeof value === 'object' && value !== null) {
    // 3축 센서
    if ('x' in value && 'y' in value && 'z' in value) {
      return `X: ${value.x}, Y: ${value.y}, Z: ${value.z}`;
    }
    // 값이 하나만 있는 객체 (예: {humidity: 25.1})
    const keys = Object.keys(value);
    if (keys.length === 1) {
      const innerKey = keys[0];
      const innerValue = value[innerKey];
      // 단위 붙이기
      if (innerKey.toLowerCase().includes('temp')) return `${innerValue}°C`;
      if (innerKey.toLowerCase().includes('humid')) return `${innerValue}%`;
      if (innerKey.toLowerCase().includes('pressure')) return `${innerValue} hPa`;
      return innerValue;
    }
    return JSON.stringify(value);
  }

  const name = sensorName.toLowerCase();
  if (name.includes('temp')) return `${value}°C`;
  if (name.includes('humid')) return `${value}%`;
  if (name.includes('pressure')) return `${value} hPa`;

  return value;
}

// 센서에 맞는 아이콘 반환
function getSensorIcon(sensorName) {
  const name = sensorName.toLowerCase();

  if (name.includes('temp')) return '🌡️';
  if (name.includes('humid')) return '💧';
  if (name.includes('pressure')) return '📊';
  if (name.includes('gyro')) return '🔄';
  if (name.includes('accel')) return '📈';
  if (name.includes('magnet')) return '🧭';
  if (name.includes('joy')) return '🕹️';
  if (name.includes('led')) return '💡';

  return '📌';
}

// 모듈에 맞는 아이콘 반환
function getModuleIcon(moduleName) {
  const icons = {
    'SenseHAT': '🎛️',
    'LED': '💡',
    'Temperature': '🌡️',
    'Humidity': '💧',
    'Pressure': '📊',
    'Motion': '🏃',
    'Light': '☀️',
    'default': '📱'
  };

  for (const [key, icon] of Object.entries(icons)) {
    if (moduleName.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }
  return icons.default;
}