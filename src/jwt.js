const verifier = require('./CognitoVerifier');

const verify = async (req, res, next) => {
  // var token = req.headers.authorization
  //   ? req.headers.authorization.split(" ")[1]
  //   : null;
  var token = "eyJraWQiOiI2MHJ0Q0FcL2ZkNmpjbzUzdm1XV1JzZENmWlkrdTBsbVhRcmZtdTQ4U0R2Zz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI2OWMyMWU4OS02MTdkLTQwMDMtYmNlMS1jYmM4MDQ2MzVlYWUiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGhlYXN0LTEuYW1hem9uYXdzLmNvbVwvYXAtc291dGhlYXN0LTFfbk9kYjlGZ2g1IiwiY2xpZW50X2lkIjoiM3FkYXJrcjBhbmhxaGZvOTE2dXRwdGFrZW8iLCJvcmlnaW5fanRpIjoiYmExYTcwM2UtNTI4Yy00ZmYwLTk1ZjktMDhiMGIxNWZmZTJkIiwiZXZlbnRfaWQiOiIyZDA4YjQ1Zi02NTRmLTRlMGItOWY3MS0zZTA5YjYyMjg1ZDMiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6ImF3cy5jb2duaXRvLnNpZ25pbi51c2VyLmFkbWluIiwiYXV0aF90aW1lIjoxNjgwNzIyMTgwLCJleHAiOjE2ODA4MDg1ODAsImlhdCI6MTY4MDcyMjE4MCwianRpIjoiYmU3NWFlOWMtYTFiMy00YzVkLTk2ZDItMjcxNzIxNTA5ZDgzIiwidXNlcm5hbWUiOiJqb2pqb2VlZWVlZWUifQ.Qw_tHN6_UrOzfqRBkbJB3-B3Rjyuhnd_atfM6O4kt0CqJDH8OAVMIpOKoR5dwZ7FDecEbD5cyWIYEOSzzv2F_tYU9UT46swXskDWsV70PLyj-xCTnjlx8DGDIH7f-97jEmID9wNZEehFR56TX1EbJzAATgGTIPx-DSf43TR3fG8XLWkXW7Q9I8SqELLJvMZH1lICocy0tTyP1yS2PGdi8K4b_a-MoToKHd6R4dDrsvyvukFhMaCkjhSClVUw7QTMWEzOxLCOPrTINVzbfJnAZUwkoJWhaist29y_RYiPctrzwJOcYuXoFuK_qRwCgODYAxH-qpp_qEcbVxpEATl65A"

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
