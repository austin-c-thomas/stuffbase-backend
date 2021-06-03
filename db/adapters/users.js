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
    
    if (!user.isAdmin) {
      delete user.isAdmin;
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

    if (!user.isAdmin) {
      delete user.isAdmin;
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

    if (!user.isAdmin) {
      delete user.isAdmin;
    };

    delete user.password;
    return user;
  } catch (error) {
    throw error;
  };
};

const updateUser = async ({ id, email, password, displayName }) => {
  const { rows: [user] } = await client.query(`
    SELECT *
    FROM users
    WHERE id=$1;
  `, [id]);
  const emailCased = email.toLowerCase();
  const hashedPassword = user.password;

  // If the email or password is the same, dont re-encrypt it
  const sameEmail = emailCased === user.email;
  const sameDisplayName = displayName === user.displayName;
  const samePassword = await bcrypt.compare(password, hashedPassword);
  if (sameEmail && samePassword && sameDisplayName) {
    if (!user.isAdmin) {
      delete user.isAdmin;
    };

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

  if (!sameDisplayName) {
    updateFields.displayName = displayName;
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

    if (!user.isAdmin) {
      delete user.isAdmin;
    };
    
    delete updatedUser.password;
    return updatedUser;
  } catch (error) {
    throw error;
  };
};

const clearUserData = async (userId) => {
  try {
    const { rows: deletedBoxItems } = await client.query(`
      DELETE FROM box_items
      WHERE "userId"=$1
      RETURNING *;
    `, [userId]);

    const { rows: deletedBoxes } = await client.query(`
      DELETE FROM boxes
      WHERE "userId"=$1
      RETURNING *;
    `, [userId]);

    const { rows: deletedItems } = await client.query(`
      DELETE FROM items
      WHERE "userId"=$1
      RETURNING *;
    `, [userId]);

    const { rows: deletedStorageLocations } = await client.query(`
      DELETE FROM storage_locations
      WHERE "userId"=$1
      RETURNING*;
    `, [userId]);

    return { storage_locations: deletedStorageLocations, boxes: deletedBoxes, items: deletedItems, box_items: deletedBoxItems }
  } catch (error) {
    throw error;
  };
};

// Will also need to destroy everything attached to the user
const destroyUser = async (userId) => {
  try {
    const destroyedUserData = await clearUserData(userId);
    const { rows: [deletedUser] } = await client.query(`
      DELETE FROM users
      WHERE id=$1
      RETURNING *;
    `, [userId]);
    
    if(!deletedUser) {
      throw Error('Cannot delete a user that does not exist.')
    };

    return deletedUser;
  } catch (error) {
    throw error;
  };
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  getUser,
  updateUser,
  destroyUser,
}