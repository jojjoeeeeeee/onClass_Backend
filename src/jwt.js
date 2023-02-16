const verifier = require('./CognitoVerifier');

const verify = async (req, res, next) => {
  // var token = req.headers.authorization
  //   ? req.headers.authorization.split(" ")[1]
  //   : null;
  var token = 'eyJraWQiOiI2MHJ0Q0FcL2ZkNmpjbzUzdm1XV1JzZENmWlkrdTBsbVhRcmZtdTQ4U0R2Zz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI2OWMyMWU4OS02MTdkLTQwMDMtYmNlMS1jYmM4MDQ2MzVlYWUiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGhlYXN0LTEuYW1hem9uYXdzLmNvbVwvYXAtc291dGhlYXN0LTFfbk9kYjlGZ2g1IiwiY2xpZW50X2lkIjoiM3FkYXJrcjBhbmhxaGZvOTE2dXRwdGFrZW8iLCJvcmlnaW5fanRpIjoiY2VhYTM5YjUtMGUxNy00OGQ1LWI1ZmItNTNiZjE3YTY3ZDE1IiwiZXZlbnRfaWQiOiI2MGNiZjUxZi0zNzIxLTQ2MGQtOWY5Zi02YTgzNGMyZjk4ZDkiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6ImF3cy5jb2duaXRvLnNpZ25pbi51c2VyLmFkbWluIiwiYXV0aF90aW1lIjoxNjc2NTU4NDMwLCJleHAiOjE2NzY2NDQ4MzAsImlhdCI6MTY3NjU1ODQzMCwianRpIjoiYmRmMzg4NGQtMDNjNi00ZGEyLWE1NTctYmVjMmI0YjM5MmZkIiwidXNlcm5hbWUiOiJqb2pqb2VlZWVlZWUifQ.SWijX86v2x9jGAg95RU5iVMYAofDPtQtLdbs1AtRsUKbqv45MwSEv2LDg12vrHPj1BCS2KUsF2ZjafFGrgq8TJP5csE6Ij8wUifOYIinAeTEaoM1UcXFu-V0HsVhN_FTKMDvxObxzSvCy1Y16cl1jPeKOccLKFsCEpicjDLs53gRfSv3HGZy8w8oPuPX9JiwhCKp2CAPMnhsdKxqHrX-IluE2BjeWO5APcLarVeEAFMWRqn2vzm9V-DoQT62wCWWkN3eq19aUG0rbQ3MCry4Lw08u3SoBusOA54D-EH7xmoK-Yv3LNCQHOCN6cXbCc7nqCq1E8RaSyPmn6w11Vqr0Q'

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
