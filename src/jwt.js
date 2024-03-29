const verifier = require('./CognitoVerifier');

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
    req.username = payload.username;
    next();
  } catch {
    return res
      .status(401)
      .json({ result: "nOK", message: "Token is invalid", data: {} });
  }
};

exports.verify = verify;
