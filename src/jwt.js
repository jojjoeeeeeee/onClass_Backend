import { CognitoJwtVerifier } from "aws-jwt-verify";

//need config
const verifier = CognitoJwtVerifier.create({
  userPoolId: "<user_pool_id>",
  tokenUse: "access",
  clientId: "<client_id>",
});

module.exports = {
  verify: async (req, res, next) => {
    var token = req.headers.authorization
      ? req.headers.authorization.split(" ")[1]
      : null;
    if (!token)
      return res
        .status(403)
        .json({ auth: false, message: "No token provided." });

    try {
      const payload = await verifier.verify(token);
      req.userEmail = payload.email
      next();
    } catch {
      return res.status(401).json({ auth: false, message: "Token is invalid" });
    }
  },
};
