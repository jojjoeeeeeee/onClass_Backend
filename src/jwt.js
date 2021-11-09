const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
var publicKEY = fs.readFileSync(path.join(__dirname + '/public.key'), 'utf8');
var privateKEY = fs.readFileSync(path.join(__dirname + '/private.key'), 'utf8');

var i = 'Cosci'; // Issuer (Software organization who issues the token)
var s = 'phakkharachate.jon@gmail.com'; // Subject (intended user of the token)
var a = `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`; // Audience (Domain within which this token will live and function)

module.exports = {
  sign: (payload, expiresIn) => {
    // Token signing options
    var signOptions = {
      issuer: i,
      subject: s,
      audience: a,
      expiresIn: expiresIn,
      algorithm: 'RS256',
    };
    return jwt.sign(payload, privateKEY, signOptions);
  },
  verify: (req, res, next) => {
    var token = req.headers.authorization
      ? req.headers.authorization.split(' ')[1]
      : null;
    if (!token)
      return res
        .status(403)
        .json({ auth: false, message: 'No token provided.' });

    var verifyOptions = {
      issuer: i,
      subject: s,
      audience: a,
      expiresIn: '24h',
      algorithm: ['RS256'],
    };

    jwt.verify(token, publicKEY, verifyOptions, (err, decoded) => {
      if (err) {
        if (err.name == 'TokenExpiredError') {
          return res
            .status(401)
            .json({ auth: false, message: 'token expired' });
        } else {
          return res.status(500).json({ auth: false, message: err });
        }
      }

      // if everything good, save to request for use in other routes
      req.userId = decoded.id;
      next();
    });
  },
};
