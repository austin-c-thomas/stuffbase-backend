const client = require('../client');
const bcrypt = require('bcrypt');
const { passwordStrengthCheck, validateEmailFormat } = require('../../utils');

const createUser = async ({ email, password, displayName }) => {
  // Check that password meets strength parameters
  passwordStrengthCheck(password);
  // Ensure uniqueness by lowercasing email & check format
  const emailCased = email.toLowerCase();
  validateEmailFormat(email);

  // Password encrypter
  const SALT_COUNT = 10;
  const hashedPassword = await bcrypt.hash(password, SALT_COUNT);

  try {
    const { rows: [user] } = await client.query(`
      INSERT INTO users(email, password, "displayName")
      VALUES($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
      RETURNING *;
    `, [emailCased, hashedPassword, displayName]);
    
    if (!user) {
      throw Error('A user with that email already exists.');
    };

    if (user.password) {
      delete user.password;
    };

    return user;
  } catch (error) {
    throw error;
  };
};

const getUserById = async (id) => {
  try {
    const { rows: [user] } = await client.query(`
      SELECT *
      FROM users
      WHERE id=$1;
    `, [id]);

    if(!user) {
      throw Error('There is no user with that ID.');
    };

    delete user.password;
    return user;
  } catch (error) {
    throw error;
  };
};

const getUserByEmail = async (email) => {
  const emailCased = email.toLowerCase();
  try {
    const { rows: [user] } = await client.query(`
      SELECT *
      FROM users
      WHERE email=$1;
    `, [emailCased]);

    return user;
  } catch (error) {
    throw error;
  };
};

const getUser = async ({ email, password }) => {
  const emailCased = email.toLowerCase();

  try {
    const user = await getUserByEmail(emailCased);
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

const updateUser = async ({ id, email, password }) => {
  const { rows: [user] } = await client.query(`
    SELECT *
    FROM users
    WHERE id=$1;
  `, [id]);
  const emailCased = email.toLowerCase();
  const hashedPassword = user.password;

  // If the email or password is the same, dont re-encrypt it
  const sameEmail = emailCased === user.email;
  const samePassword = await bcrypt.compare(password, hashedPassword);
  if (sameEmail && samePassword) {
    delete user.password;
    return user;
  };

  // If the password has changed, it must be re-encrypted before updated the DB
  const updateFields = {};
  const SALT_COUNT = 10;
  let newHashedPassword;

  if (!sameEmail) {
    validateEmailFormat(email);
    updateFields.email = emailCased;
  };

  if (!samePassword) {
    // Check that new password meets strength parameters
    passwordStrengthCheck(password);
    newHashedPassword = await bcrypt.hash(password, SALT_COUNT);
    updateFields.password = newHashedPassword;
  };

  // // Only update the fields that have changed
  const setString = Object.keys(updateFields).map((key, index) => {
    return `"${key}"=$${index + 1}`
  }).join(', ');

  try {
    const { rows: [updatedUser] } = await client.query(`
      UPDATE users
      SET ${setString}
      WHERE id=${id}
      RETURNING *;
    `, Object.values(updateFields));
    
    delete updatedUser.password;
    return updatedUser;
  } catch (error) {
    throw error;
  };
};

// Will also need to destroy everything attached to the user
// const destroyUser = async () => {
//   try {

//   } catch (error) {
//     throw error;
//   };
// };

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  getUser,
  updateUser,
}