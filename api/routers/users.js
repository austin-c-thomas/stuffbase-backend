const express = require('express');
const usersRouter = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const {
  createUser,
} = require('../../db');
const { passwordStrengthCheck } = require('../../utils');

usersRouter.use((req, res, next) => {
  console.log('A request is being made to /users...');
  next();
});

// Register
usersRouter.post('/register', (req, res, next) => {
  const { email, password, displayName } = req.body;
  try {
    passwordStrengthCheck(password);
  } catch ({ name, message }) {
    next({ name, message });
  };
});
// Login

// Admin Routes
// Get all users

module.exports = usersRouter;