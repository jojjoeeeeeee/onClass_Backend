const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const verifier = require("./src/CognitoVerifier");

require("dotenv").config({ path: "./src/.env" });

app.use(helmet());

const corsOptions = {
  origin: ['https://63a05429d8175d6fef2d5e06--incandescent-parfait-30d95b.netlify.app'],
  exposedHeaders: "Authorization",
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
