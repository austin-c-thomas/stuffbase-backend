const client = require('./client');

const { createUser } = require('./adapters/users');

const dropTables = async () => {
  try {
    console.log('Dropping tables...');
    await client.query(`
      DROP TABLE IF EXISTS box_items;
      DROP TABLE IF EXISTS boxes;
      DROP TABLE IF EXISTS items;
      DROP TABLE IF EXISTS storage_locations;
      DROP TABLE IF EXISTS users;
    `);

    console.log('Finished dropping tables.');
  } catch (error) {
    console.error('Error dropping tables.');
    throw error;
  };
};

const createTables = async () => {
  try {
    console.log('Building tables...');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "displayName" VARCHAR(255) NOT NULL
      );
    `)

    await client.query(`
      CREATE TABLE storage_locations (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        name VARCHAR(255) UNIQUE NOT NULL,
        location VARCHAR(255) DEFAULT 'Home'
      );
    `)

    await client.query(`
      CREATE TABLE items (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        name VARCHAR(255) UNIQUE NOT NULL,
        description VARCHAR(255) NOT NULL,
        category VARCHAR(255) DEFAULT 'MISC',
        "imageURL" VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE boxes (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        label VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(255) DEFAULT 'Box(small)',
        "locationId" INTEGER REFERENCES storage_locations(id)
      );
    `);

    await client.query(`
      CREATE TABLE box_items (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        "boxId" INTEGER REFERENCES boxes(id),
        "itemId" INTEGER REFERENCES items(id)
      );
    `);

    console.log('Finished building tables.');
  } catch (error) {
    console.error('Error building tables.');
    throw error;
  };
};

const createInitialUsers = async () => {
  try {
    console.log('Creating initial users...');
    await createUser({
      email: 'austinthomas.dev@gmail.com',
      password: '12345678',
      displayName: 'Aus and Ash',
    });
  } catch (error) {
    console.error('Error creating initial users.');
    throw error;
  };
};

const rebuildDB = async () => {
  try {
    client.connect();
    await dropTables();
    await createTables();
    await createInitialUsers();
  } catch (error) {
    console.error('Error during rebuildDB.');
    throw error;
  };
};

module.exports = {
  rebuildDB,
};