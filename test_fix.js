const c = require('./server/controllers/authController');
console.log('login is function:', typeof c.login);
console.log('All exported functions:', Object.keys(c));