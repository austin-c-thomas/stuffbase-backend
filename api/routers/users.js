const express = require('express');
const usersRouter = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const {
  createUser, 
  getUserByUsername,
} = require('../../db');

usersRouter.use((req, res, next) => {
  console.log('A request is being made to /users...');
  next();
});

// Register
usersRouter.post('/register', async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    const _user = await getUserByUsername(username);
    if (_user) {
      next({
        name: 'UserExistsError',
        message: 'A user with that username already exists.'
      });
      return;
    };
    
    const user = await createUser({
      username: username,
      email: email,
      password: password
    });

    const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '1w' });
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