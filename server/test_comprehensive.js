const { spawn } = require('child_process');
const axios = require('axios');

console.log('Starting server...');

const server = spawn('node', ['server.js'], {
  cwd: 'D:\\ASK UrbanGlow\\server',
  stdio: 'pipe',
  env: { ...process.env, PORT: '5000' }
});

let serverOutput = '';
let serverError = '';

server.stdout.on('data', (data) => {
  serverOutput += data.toString();
});

server.stderr.on('data', (data) => {
  serverError += data.toString();
});

server.on('close', (code) => {
  console.log('Server exited with code', code);
  if (serverError) console.error('SERVER ERROR OUTPUT:', serverError);
});

setTimeout(async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'prasad@gmail.com',
      password: 'Pass@123'
    }, {
      withCredentials: true
    });
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.status || error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
  server.kill();
  process.exit(0);
}, 8000);