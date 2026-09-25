mongoose = require('mongoose');
mongoose.connect('mongodb+srv://patilprajwal9942_db_user:Pass123@cluster0.vfgxmrl.mongodb.net/UrbanGlow?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('DB connected'))
  .catch(err => console.error('DB error:', err));