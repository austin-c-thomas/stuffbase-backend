const client = require('../client');
const bcrypt = require('bcrypt');

const createUser = async ({ email, password, displayName }) => {
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

module.exports = {
  createUser,
}