const cognito = require("aws-jwt-verify");
const cognitoConfig = require('./cognitoConfig');

const CognitoJwtVerifier = cognito.CognitoJwtVerifier;

const verifier = {
  userPoolId: `${cognitoConfig.AWS_COGNITO_USER_POOL_ID}`,
  tokenUse: "access",
  clientId: `${cognitoConfig.AWS_COGNITO_CLIENT_ID}`,
};

module.exports = CognitoJwtVerifier.create(verifier);