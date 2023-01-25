const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const verifier = require("./src/CognitoVerifier");

require("dotenv").config({ path: "./src/.env" });

app.use(helmet());

const corsOptions = {
  origin: 'http://ec2-54-255-229-73.ap-southeast-1.compute.amazonaws.com',
  methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
  preflightContinue: false,
	optionsSuccessStatus: 204,
  exposedHeaders: 'Authorization',
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/public/img", express.static(__dirname + "/public/img"));
app.use("/api", require("./src/middlewares/api"));

const port = process.env.SERVER_PORT;

verifier
  .hydrate()
  .catch((err) => {
    console.error(`Failed to hydrate JWT verifier: ${err}`);
    process.exit(1);
  })
  .then(() =>
    app.listen(port, () => {
      console.log(`server is running on port ${port}`);
    })
  );
