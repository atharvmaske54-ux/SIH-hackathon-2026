const http = require('http');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testEndpoint(name, path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(`${BASE_URL}${path}`);
    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pass = res.statusCode >= 200 && res.statusCode < 300 && json.success !== false;
          console.log(`[${pass ? 'PASS ✅' : 'FAIL ❌'}] ${name} (${method} ${path}) -> HTTP ${res.statusCode}`);
          if (!pass) console.log('   Response:', data);
          resolve(pass);
        } catch (e) {
          console.log(`[FAIL ❌] ${name} (${method} ${path}) -> Parse Error HTTP ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`[FAIL ❌] ${name} (${method} ${path}) -> Request Error: ${err.message}`);
      resolve(false);
    });

    if (postData) req.write(postData);
    req.end();
  });
}

async function runAllTests() {
  console.log('====================================================');
  console.log('🚀 SAFE-ROUTE FULL USER-SIDE BACKEND SUITE VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function check(name, path, method, body, headers) {
    total++;
    const res = await testEndpoint(name, path, method, body, headers);
    if (res) passed++;
  }

  // 1. Health Check
  total++;
  const healthRes = await new Promise(resolve => {
    http.get('http://localhost:5000/health', res => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
  if (healthRes) { passed++; console.log('[PASS ✅] System Health Check (GET /health) -> HTTP 200'); }
  else { console.log('[FAIL ❌] System Health Check (GET /health)'); }

  // 2. Auth APIs
  await check('User Login', '/auth/login', 'POST', { email: 'ananya@student.uom.edu', password: 'password123' });
  await check('User Profile Fetch', '/auth/profile', 'GET');
  await check('User Profile Update', '/auth/profile', 'PUT', { phone: '+91 98200 99999', homeAddress: 'Hostel 3, Kalina' });
  await check('Emergency Contacts List', '/auth/contacts', 'GET');
  await check('Add Emergency Contact', '/auth/contacts', 'POST', { name: 'Priya Verma', phone: '+91 98200 11999', relation: 'Friend' });

  // 3. Emergency SOS System
  await check('Trigger Instant SOS', '/sos/trigger', 'POST', { mode: 'instant', latitude: 18.9298, longitude: 72.8335, batteryLevel: '92%' });
  await check('Update Live Location SOS', '/sos/location-update', 'POST', { latitude: 18.9300, longitude: 72.8340 });
  await check('Get Active SOS Status', '/sos/active', 'GET');
  await check('Cancel SOS', '/sos/cancel', 'POST', { reason: 'Safe in hostel' });
  await check('Get SOS History', '/sos/history', 'GET');

  // 4. Fake Call Simulation
  await check('Get Fake Call Presets', '/fake-call/presets', 'GET');
  await check('Trigger Fake Call', '/fake-call/trigger', 'POST', { callerPresetId: 'preset-mom', delaySeconds: 5 });

  // 5. Safe Companion Journey
  await check('Start Companion Timer', '/companion/start', 'POST', { destinationName: 'Hostel 3 Gate', durationMinutes: 20 });
  await check('Companion Status', '/companion/status', 'GET');
  await check('Companion Check-in', '/companion/check-in', 'POST', { extendMinutes: 10 });
  await check('Complete Companion Journey', '/companion/complete', 'POST');

  // 6. Incidents API
  await check('Public Incidents Feed', '/incidents', 'GET');
  await check('Submit Incident Report', '/incidents', 'POST', { type: 'Harassment', description: 'Verbal harassment near gate', isAnonymous: true });
  await check('Track My Reports', '/incidents/my-reports', 'GET');

  // 7. Safety Map & Safe Routing
  await check('Heatmap Data', '/map/heatmap', 'GET');
  await check('Geofences Data', '/map/geofences', 'GET');
  await check('Calculate Safe Route', '/map/safe-route', 'POST', { origin: { latitude: 18.9298, longitude: 72.8333 }, destination: { latitude: 19.0734, longitude: 72.8631 } });

  // 8. AI Risk Assessment
  await check('Evaluate Zone Risk Score', '/risk/evaluate', 'POST', { latitude: 18.9298, longitude: 72.8335, timeOfDay: 'night' });
  await check('Get Risk Zone Clusters', '/risk/zones', 'GET');

  // 9. Community Alerts
  await check('Get Community Safety Alerts', '/alerts', 'GET');
  await check('Mark Alert Read', '/alerts/read', 'POST', { alertId: 'ALERT-101' });

  // 10. Admin Telemetry
  await check('System Telemetry Metrics', '/admin/telemetry', 'GET', null, { 'x-user-role': 'super_admin' });

  console.log('\n====================================================');
  console.log(`📊 SUITE RESULT: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
  console.log('====================================================\n');
}

runAllTests();
