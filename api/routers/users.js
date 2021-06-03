const express = require('express');
const usersRouter = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const { 
  requireUser, 
  getTokenFromRequest 
} = require('../utils');

const {
  createUser, 
  getUserByEmail,
  getUser,
  getUserById,
  getStorageLocationsByUserId,
  getBoxesByUserId,
  getItemsByUserId,
} = require('../../db');

usersRouter.use((req, res, next) => {
  console.log('A request is being made to /users...');
  next();
});

// Register
usersRouter.post('/register', async (req, res, next) => {
  const { email, password, displayName } = req.body;
  try {
    // Check if the user already exists
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
usersRouter.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    next({
      name: 'MissingCredentialsError',
      message: 'Please supply both an email and password'
    });
  };

  try {
    const user = await getUser({ email, password });
    if (user) {
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1w' });
      res.send({
        message: 'You have successfully logged in!',
        user,
        token,
      });
    } else {
      next({
        name: 'IncorrectCredentialsError',
        message: 'Email or password is incorrect.',
      });
    };
  } catch ({ name, message }) {
    next({ name, message });
  };
});

// Me
usersRouter.get('/me', requireUser, async (req, res, next) => {
  const token = getTokenFromRequest(req);
  const { id } = jwt.verify(token, JWT_SECRET);

  try {
    const user = await getUserById(id);
    const userStorageLocations = await getStorageLocationsByUserId(id);
    const userBoxes = await getBoxesByUserId(id);
    const userItems = await getItemsByUserId(id);

    userData = {
      ...user,
      storage_locations: userStorageLocations ? userStorageLocations : [],
      boxes: userBoxes ? userBoxes : [],
      items: userItems ? userItems : [],
    };

    if (id == req.user.id) {
      res.send(userData);
    };
  } catch ({ name, message }) {
    next({ name, message });
  };
});

// Patch
usersRouter.patch('/:userId', requireUser, async (req, res, next) => {
  
})


// Admin Routes
// Get all users

module.exports = usersRouter;