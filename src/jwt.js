const cognito = require("aws-jwt-verify");

const CognitoJwtVerifier = cognito.CognitoJwtVerifier;

//need config
const verifier = CognitoJwtVerifier.create({
  userPoolId: `${process.env.AWS_COGNITO_USER_POOL_ID}`,
  tokenUse: "access",
  clientId: `${process.env.AWS_COGNITO_CLIENT_ID}`,
});

const verify = async (req, res, next) => {
  var token = req.headers.authorization
    ? req.headers.authorization.split(" ")[1]
    : null;
  if (!token)
    return res
      .status(403)
      .json({ result: "Not found", message: "No token provided.", data: {} });

  try {
    const payload = await verifier.verify(token);
    req.userEmail = payload.email;
    next();
  } catch {
    return res
      .status(401)
      .json({ result: "nOK", message: "Token is invalid", data: {} });
  }
};

exports.verify = verify;
