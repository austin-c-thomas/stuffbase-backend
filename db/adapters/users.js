const client = require('../client');
const bcrypt = require('bcrypt');

const checkPasswordStrength = (password) => {
  if (password.length < 8) {
    
  }
}

const createUser = async ({ email, password, displayName }) => {

  // Password strength checker
  if (password.length < 8) {
    throw Error('Password must be at least 8 characters long.');
  };
  if (!password.match(/[a-z]/g)) {
    throw Error('Password must include at least one lowercase letter.');
  };
  if (!password.match(/[A-Z]/g)) {
    throw Error('Password must include at least one uppercase letter.');
  };
  if (!password.match(/[0-9]/g)) {
    throw Error('Password must include at least one number.');
  };

  const SALT_COUNT = 10;
  const hashedPassword = await bcrypt.hash(password, SALT_COUNT);
  try {
    const { rows: [user] } = await client.query(`
      INSERT INTO users(email, password, "displayName")
      VALUES($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
      RETURNING *;
    `, [email, hashedPassword, displayName]);

    if (user.password) {
      delete user.password;
    };

    return user;
  } catch (error) {
    throw error;
  };
};

const getUser = async ({ email, password }) => {
  try {
    const { rows: [user] } = await client.query(`
      SELECT *
      FROM users
      WHERE email=$1;
    `, [email]);
    
    const hashedPassword = user.password;
    const passwordsMatch = await bcrypt.compare(password, hashedPassword);
    if (!passwordsMatch) {
      throw Error('Password incorrect.');
    };

    delete user.password;
    return user;
  } catch (error) {
    throw error;
  };
};

// const updateUser = async () => {
//   try {

//   } catch (error) {
//     throw error;
//   };
// };

// Will also need to destroy everything attached to the user
// const destroyUser = async () => {
//   try {

//   } catch (error) {
//     throw error;
//   };
// };

module.exports = {
  createUser,
  getUser,
}