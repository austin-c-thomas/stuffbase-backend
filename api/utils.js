const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const requireUser = (req, res, next) => {
  if (!req.user) {
    next({
      name: 'MissingUserError',
      message: 'You must be logged in to perform this action.',
    });
  };

  next();
};

const requireParams = ({ required }) => {
  return (req, res, next) => {
    const requestBody = req.body;
    if (required.length === 0) {
      next();
    } else {
      required.forEach((param) => {
        if (!requestBody[param]) {
          next({
            name: 'MissingFields',
            message: `You must supply all required fields in your request body. Missing: ${param}`,
          });
        };
      });

      next();
    };
  };
};

// const requireAdmin = (req, res, next) => {
//   if (!req.user.idAdmin) {
//     next({
//       name: 'UnauthorizedUserError',
//       message: 'You must be an administrator to perform this action.',
//     });
//   };
  
//   next();
// };

const getTokenFromRequest = (req, res, next) => {
  const auth = req.header('Authorization');
  const prefix = 'Bearer ';
  const token = auth.slice(prefix.length);
  return token;
};

const generateError = (errorName) => {
  let errorMessage = '';
  if (errorName === 'UnauthorizedUserError') errorMessage = 'You do not have permission to access that data.';
  if (errorName === 'MissingRequestBody') errorMessage = 'Your request must include a body.'
  if (errorName === 'DatabaseError') errorMessage = 'The database experienced an error while trying to process your request.';

  return ({
    error: errorName,
    message: errorMessage,
  });
}

module.exports = {
  requireUser,
  requireParams,
  getTokenFromRequest,
  generateError,
};
