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
    console.log('Login Data:', JSON.stringify(loginResp.data, null, 2));
    
    // Check if cookie was set
    const cookie = loginResp.headers['set-cookie']?.[0];
    console.log('Set-Cookie:', cookie ? cookie.split(',')[0] : 'none');
    
    // Test 2: Protected /me endpoint
    console.log('\n=== TEST 2: Protected /me endpoint ===');
    const meResp = await axios.get('http://localhost:5000/api/auth/me', {
      withCredentials: true
    });
    console.log('/me Status:', meResp.status);
    console.log('/me Data:', JSON.stringify(meResp.data, null, 2));
    
    // Test 3: Logout
    console.log('\n=== TEST 3: Logout ===');
    const logoutResp = await axios.post('http://localhost:5000/api/auth/logout', {}, {
      withCredentials: true
    });
    console.log('Logout Status:', logoutResp.status);
    console.log('Logout Data:', JSON.stringify(logoutResp.data, null, 2));
    
    // Test 4: Try /me after logout
    console.log('\n=== TEST 4: /me after logout ===');
    try {
      const meAfterLogout = await axios.get('http://localhost:5000/api/auth/me', {
        withCredentials: true
      });
      console.log('/me after logout Status:', meAfterLogout.status);
    } catch (error) {
      console.log('/me after logout Error (expected):', error.response?.status);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.status || error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
  server.kill();
  process.exit(0);
}, 5000);