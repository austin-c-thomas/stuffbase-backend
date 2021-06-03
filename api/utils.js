const requireUser = (req, res, next) => {
  if (!req.user) {
    next({
      name: 'MissingUserError',
      message: 'You must be logged in to perform this action.',
    });
  };

  next();
};

const getTokenFromRequest = (req, res, next) => {
  const auth = req.header('Authorization');
  const prefix = 'Bearer ';
  const token = auth.slice(prefix.length);
  return token;
};

module.exports = {
  requireUser,
  getTokenFromRequest,
};