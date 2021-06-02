const express = require('express');
const usersRouter = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const {
  createUser,
} = require('../../db');

usersRouter.use((req, res, next) => {
  console.log('A request is being made to /users...');
  next();
});

module.exports = usersRouter;