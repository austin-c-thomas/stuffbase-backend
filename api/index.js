const express = require('express');
const apiRouter = express.Router();
const jwt = require('jsonwebtoken');
const { getUserById } = require('../db');
const { JWT_SECRET } = process.env;

// Middleware
// Request authentication
apiRouter.use(async (req, res, next) => {
  const prefix = 'Bearer ';
  const auth = req.header('Authorization');

  if(!auth) {
    next();
  } else if (auth.startsWith(prefix)) {
    const token = auth.slice(prefix.length);
    try {
      const { id } = jwt.verify(token, JWT_SECRET);
      if (id) {
        req.user = await getUserById(id);
        next();
      };
    } catch ({ name, message }) {
      next({ name, message });
    };
  } else {
    next({
      name: 'AuthorizationHeaderError',
      message: `Authorization token must begin with "${prefix}"`,
    });
  };
});

apiRouter.use((req, res, next) => {
  if (req.user) {
    console.log('User is set: ', req.user);
  };

  next();
});

// Routers
const healthRouter = require('./routers/health');
apiRouter.use('/health', healthRouter);

module.exports = apiRouter;