const express = require('express');
const usersRouter = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const {
  createUser, 
  getUserByEmail,
} = require('../../db');

usersRouter.use((req, res, next) => {
  console.log('A request is being made to /users...');
  next();
});

// Register
usersRouter.post('/register', async (req, res, next) => {
  const { email, password, displayName } = req.body;
  try {
    const _user = await getUserByEmail(email);
    if (_user) {
      next({
        name: 'UserExistsError',
        message: 'A user with that email already exists.'
      });
      return;
    };
    
    const user = await createUser({
      email: email,
      password: password,
      displayName: displayName
    });

    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '1w' });
    res.send({
      message: 'Thank you for signing up!',
      user,
      token,
    });
  } catch ({ name, message }) {
    next({ name, message });
  };
});

// Login

// Admin Routes
// Get all users

module.exports = usersRouter;