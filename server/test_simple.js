const { spawn } = require('child_process');
const axios = require('axios');

console.log('Starting server...');

const server = spawn('node', ['server.js'], {
  cwd: 'D:\\ASK UrbanGlow\\server',
  stdio: 'pipe',
  env: { ...process.env, PORT: '5000' }
});

setTimeout(async () => {
  try {
    // Test 1: Login
    console.log('\n=== TEST 1: Login ===');
    const loginResp = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'prasad@gmail.com',
      password: 'Pass@123'
    }, {
      withCredentials: true
    });
    console.log('Login Status:', loginResp.status);
    console.log('Login Data success:', loginResp.data.success);
    console.log('Set-Cookie header:', loginResp.headers['set-cookie'] ? loginResp.headers['set-cookie'][0] : 'none');
    
    // Test 2: Protected /me endpoint
    console.log('\n=== TEST 2: Protected /me endpoint ===');
    const meResp = await axios.get('http://localhost:5000/api/auth/me', {
      withCredentials: true
    });
    console.log('/me Status:', meResp.status);
    console.log('/me Data:', JSON.stringify(meResp.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.status || error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('CORS headers:', error.response.headers['access-control-allow-origin']);
      console.error('Set-Cookie from response:', error.response.headers['set-cookie'] ? error.response.headers['set-cookie'][0] : 'none');
    }
  }
  server.kill();
  process.exit(0);
}, 8000);