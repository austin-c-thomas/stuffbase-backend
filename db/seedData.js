const client = require('./client');

const { createUser } = require('./adapters/users');
const { createStorageLocation } = require('./adapters/storage_locations');

const dropTables = async () => {
  try {
    console.log('Dropping tables...');
    await client.query(`
      DROP TABLE IF EXISTS box_items;
      DROP TABLE IF EXISTS items;
      DROP TABLE IF EXISTS boxes;
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
        location VARCHAR(255) DEFAULT 'Home',
        note VARCHAR(255)
      );
    `)

    await client.query(`
      CREATE TABLE boxes (
        id SERIAL PRIMARY KEY,
        label VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(255) DEFAULT 'Box(small)',
        "locationId" INTEGER REFERENCES storage_locations(id)
      );
    `);

    await client.query(`
    CREATE TABLE items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      description VARCHAR(255) NOT NULL,
      category VARCHAR(255) DEFAULT 'MISC',
      "imageURL" VARCHAR(255),
      "locationId" INTEGER REFERENCES storage_locations(id)
    );
  `);

    await client.query(`
      CREATE TABLE box_items (
        id SERIAL PRIMARY KEY,
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
      email: 'testUser@test.com', 
      password: 'iLoveStuffBase1', 
      displayName: 'Test User'
    });
    
    console.log('Finished creating initial users.')
  } catch (error) {
    console.error('Error creating initial users.');
    throw error;
  };
};

const createInitialStorageLocations = async () => {
  try {
    console.log('Creating initial storage locations...');
    await createStorageLocation({
      userId: 1,
      name: 'Small outdoor closet',
      note: 'Left side of patio',
    });

    await createStorageLocation({
      userId: 1,
      name: 'Large outdoor closet',
      location: 'Home',
      note: 'Right side of patio',
    });

    await createStorageLocation({
      userId: 1,
      name: '5x5 Storage Unit',
      location: 'Remote',
    });

    console.log('Finished creating initial storage locations.')
  } catch (error) {
    console.error('Error creating initial storage locations.');
    throw error;
  };
}

const rebuildDB = async () => {
  try {
    client.connect();
    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialStorageLocations();
  } catch (error) {
    console.error('Error during rebuildDB.');
    throw error;
  };
};

module.exports = {
  rebuildDB,
};