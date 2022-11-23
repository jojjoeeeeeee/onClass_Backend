const mongoose = require('mongoose');

mongoose
  .connect(`${process.env.DB_HOST}`, {
    auth : {
      username: process.env.DB_AUTH_USER,
      password: process.env.DB_AUTH_PASSWORD
    }
  })
  .then(() => console.log('DB Connected!')).catch((e) => console.log(`mongoose error: ${e}`));

mongoose.connection.on('connected', () => {
  console.log('Mongoose default connection open');
});

mongoose.connection.on('error', (err) => {
  console.log('Mongoose default connection error: ' + err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose default connection disconnected');
});

process.on('SIGINT', () => {
  mongoose.connection.close( () => {
    console.log(
      'Mongoose default connection disconnected through app termination'
    );
    process.exit(0);
  });
});
