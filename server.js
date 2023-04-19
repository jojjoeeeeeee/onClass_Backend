const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const ApolloServer = require("@apollo/server").ApolloServer;
const expressMiddleware = require("@apollo/server/express4").expressMiddleware;
const ApolloServerPluginDrainHttpServer =
  require("@apollo/server/plugin/drainHttpServer").ApolloServerPluginDrainHttpServer;
const makeExecutableSchema =
  require("@graphql-tools/schema").makeExecutableSchema;
const ws = require("ws");
const useServer = require("graphql-ws/lib/use/ws").useServer;

const typeDefs = require("./src/graphql/schema/index").typeDefs;
const resolvers = require("./src/graphql/resolvers/index").resolvers;

const verifier = require("./src/CognitoVerifier");
const jwt = require("./src/jwt");

require("dotenv").config({ path: "./src/.env" });

//prod
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// test graphqli
// app.use(helmet.crossOriginOpenerPolicy());
// app.use(helmet.crossOriginResourcePolicy());
// app.use(helmet.dnsPrefetchControl());
// app.use(helmet.expectCt());
// app.use(helmet.frameguard());
// app.use(helmet.hidePoweredBy());
// app.use(helmet.hsts());
// app.use(helmet.ieNoOpen());
// app.use(helmet.noSniff());
// app.use(helmet.originAgentCluster());
// app.use(helmet.permittedCrossDomainPolicies());
// app.use(helmet.referrerPolicy());
// app.use(helmet.xssFilter());

const corsOptions = {
  origin: "http://ec2-54-255-229-73.ap-southeast-1.compute.amazonaws.com",
  methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  exposedHeaders: "Authorization",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/public/img", express.static(__dirname + "/public/img"));
app.use("/api", require("./src/middlewares/api"));

const httpServer = http.createServer(app);

const graphqlSchema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new ws.WebSocketServer({
  server: httpServer,
  path: "/graphql-apollo-subscription",
});

const serverCleanup = useServer({ schema: graphqlSchema }, wsServer);

const apollo_server = new ApolloServer({
  schema: graphqlSchema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

const port = process.env.SERVER_PORT;

verifier
  .hydrate()
  .catch((err) => {
    console.error(`Failed to hydrate JWT verifier: ${err}`);
    process.exit(1);
  })
  .then(
    async () => {
      await apollo_server.start();
      await new Promise((resolve) => {
        console.log(`server is running on port ${port}`);
        httpServer.listen({ port: port }, resolve);
      });

      app.use(
        "/graphql-apollo",
        jwt.verify,
        expressMiddleware(apollo_server, {
          context: async ({ req }) => ({ username: req.username }),
        })
      );
    }

    // app.listen(port, () => {
    //   console.log(`server is running on port ${port}`);
    // })
  );

// app.use('/subscription', jwt.verify, graphqlHttp({
//   schema: graphQlSchema,
//   rootValue: graphQlResolvers,
//   graphiql: {
//     headerEditorEnabled: true,
//   },
// }));
