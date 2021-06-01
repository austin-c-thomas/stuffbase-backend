const client = require('../client');
const bcrypt = require('bcrypt');
const { passwordStrengthCheck } = require('../../utils');

const createUser = async ({ email, password, displayName }) => {
  // Check that password meets strength parameters
  passwordStrengthCheck(password);
  
  // Ensure uniqueness by lowercasing email
  const emailCased = email.toLowerCase();

  // Password and email encrypter
  const SALT_COUNT = 10;
  const hashedPassword = await bcrypt.hash(password, SALT_COUNT);
  const hashedEmail = await bcrypt.hash(emailCased, SALT_COUNT);

  try {
    const { rows: [user] } = await client.query(`
      INSERT INTO users(email, password, "displayName")
      VALUES($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
      RETURNING *;
    `, [hashedEmail, hashedPassword, displayName]);

    if (user.password) {
      delete user.password;
    };

    if (user.email) {
      user.email = emailCased;
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

    // delete user.password;
    return user;
  } catch (error) {
    throw error;
  };
};

const getUser = async ({ id, email, password }) => {
  const emailCased = email.toLowerCase();

  try {
    const { rows: [user] } = await client.query(`
      SELECT *
      FROM users
      WHERE id=$1;
    `, [id]);

    const hashedPassword = user.password;
    const hashedEmail = user.email;

    const passwordsMatch = await bcrypt.compare(password, hashedPassword);
    if (!passwordsMatch) {
      throw Error('Password incorrect.');
    };

    const emailsMatch = await bcrypt.compare(emailCased, hashedEmail);
    if (!emailsMatch) {
      throw Error('Email incorrect.');
    };

    user.email = emailCased;
    delete user.password;
    return user;
  } catch (error) {
    throw error;
  };
};


const updateUser = async ({ id, email, password }) => {
  const user = await getUserById(id);
  const emailCased = email.toLowerCase();
  const hashedEmail = user.email;
  const hashedPassword = user.password;

  // If the email or password is the same, dont re-encrypt it
  const sameEmail = await bcrypt.compare(emailCased, hashedEmail);
  const samePassword = await bcrypt.compare(password, hashedPassword);
  if (sameEmail && samePassword) {
    user.email = emailCased;
    delete user.password;
    return user;
  };

  // If a field has changed, it must be re-encrypted before updated the DB
  const updateFields = {};
  const SALT_COUNT = 10;
  let newHashedEmail;
  let newHashedPassword;

  if (!sameEmail) {
    newHashedEmail = await bcrypt.hash(emailCased, SALT_COUNT);
    updateFields.email = newHashedEmail;
  };

  if (!samePassword) {
    // Check that new password meets strength parameters
    passwordStrengthCheck(password);
    newHashedPassword = await bcrypt.hash(password, SALT_COUNT);
    updateFields.password = newHashedPassword;
  };

  // Only update the fields that have changed
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
    
    updatedUser.email = emailCased;
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
  getUser,
  updateUser,
}