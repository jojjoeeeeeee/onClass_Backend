const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');

require('dotenv').config({ path: './src/.env' })

app.use(helmet());

const corsOptions = {
  exposedHeaders: 'Authorization',
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// app.use(express.static(__dirname + "/uploaded"));
app.use('/api', require('./src/middlewares/api'));

const port = process.env.SERVER_PORT;
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
