const client = require('./client');

const { createUser } = require('./adapters/users');
const { createStorageLocation } = require('./adapters/storage_locations');
const { createItem } = require('./adapters/items');
const { createBox } = require('./adapters/boxes');
const { createBoxItem } = require('./adapters/box_items');

const dropTables = async () => {
  try {
    // console.log('Dropping tables...');
    await client.query(`
      DROP TABLE IF EXISTS box_items;
      DROP TABLE IF EXISTS items;
      DROP TABLE IF EXISTS boxes;
      DROP TABLE IF EXISTS storage_locations;
      DROP TABLE IF EXISTS users;
    `);

    // console.log('Finished dropping tables.');
  } catch (error) {
    console.error('Error dropping tables.');
    throw error;
  };
};

const createTables = async () => {
  try {
    // console.log('Building tables...');
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
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) DEFAULT 'Home',
        note VARCHAR(255)
      );
    `)

    await client.query(`
      CREATE TABLE boxes (
        id SERIAL PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        description VARCHAR(255),
        category VARCHAR(255) DEFAULT 'MISC',
        "userId" INTEGER REFERENCES users(id),
        "locationId" INTEGER REFERENCES storage_locations(id)
      );
    `);

    await client.query(`
      CREATE TABLE items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description VARCHAR(255),
        category VARCHAR(255) DEFAULT 'MISC',
        quantity INTEGER DEFAULT 1,
        "imageURL" VARCHAR(255),
        "userId" INTEGER REFERENCES users(id),
        "locationId" INTEGER REFERENCES storage_locations(id)
      );
  `);

    await client.query(`
      CREATE TABLE box_items (
        "itemId" INTEGER REFERENCES items(id) PRIMARY KEY,
        "boxId" INTEGER REFERENCES boxes(id)
      );
    `);

    // console.log('Finished building tables.');
  } catch (error) {
    console.error('Error building tables.');
    throw error;
  };
};

const createInitialUsers = async () => {
  try {
    // console.log('Creating initial users...');
    await createUser({
      email: 'testuser@test.com', 
      password: 'iLoveStuffBase1', 
      displayName: 'TestUser1',
    });
    
    // console.log('Finished creating initial users.')
  } catch (error) {
    console.error('Error creating initial users.');
    throw error;
  };
};

const createInitialStorageLocations = async () => {
  try {
    // console.log('Creating initial storage locations...');
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

    // console.log('Finished creating initial storage locations.')
  } catch (error) {
    console.error('Error creating initial storage locations.');
    throw error;
  };
};

const createInitialItems = async () => {
  try {
    // console.log('Creating initial items...');
    await createItem({
      name: 'Christmas Tree',
      description: 'Fake white Christmas Tree',
      category: 'Decor',
      userId: 1,
      locationId: 3,
    });

    await createItem({
      name: '6 Gallon Carboy',
      category: 'Homebrew',
      userId: 1,
      locationId: 3,
    });

    await createItem({
      name: 'SS Fermenter',
      description: 'Stainless steel 7 gal fermenter',
      category: 'Homebrew',
      userId: 1,
      locationId: 3,
    });

    await createItem({
      name: `8' Wavestorm`,
      description: 'Blue softtop surfboard',
      category: 'Outdoors',
      userId: 1,
      locationId: 2,
    });

    await createItem({
      name: 'Nespresso',
      category: 'Kitchen',
      userId: 1,
      locationId: 1,
    });

    await createItem({
      name: 'Coffee Maker',
      category: 'Kitchen',
      userId: 1,
      locationId: 1,
    });

    await createItem({
      name: 'Air Fryer',
      category: 'Kitchen',
      userId: 1,
      locationId: 1,
    });

    await createItem({
      name: 'Blender',
      category: 'Kitchen',
      userId: 1,
      locationId: 1,
    });

    await createItem({
      name: 'PBW',
      category: 'Homebrew',
      userId: 1,
      locationId: 3,
    });

    await createItem({
      name: 'Talking Gravestone',
      category: 'Decor',
      userId: 1,
      locationId: 3,
    });

    await createItem({
      name: 'Christmas Wreath',
      category: 'Decor',
      userId: 1,
      locationId: 1,
    });

    await createItem({
      name: 'Halloween Lights',
      category: 'Decor',
      userId: 1,
      locationId: 1,
    });

    // console.log('Finished creating initial items.');
  } catch (error) {
    console.error('Error creating initial items.');
    throw error;
  };
};

createInitialBoxes = async () => {
  try {
    // console.log('Creating initial boxes...');
    await createBox({
      label: 'Halloween Decor',
      description: '2 x 4 Plastic Tub',
      category: 'Decor',
      userId: 1,
      locationId: 3,
    });

    await createBox({
      label: 'Kitchen 1',
      description: 'Cardboard Box (lg)',
      category: 'Kitchen',
      userId: 1,
      locationId: 3,
    });

    await createBox({
      label: 'Kitchen 2',
      description: 'Cardboard Box (lg)',
      category: 'Kitchen',
      userId: 1,
      locationId: 3,
    });

    await createBox({
      label: 'His MISC',
      description: '2 x 4 Plastic Tub',
      userId: 1,
      locationId: 3,
    });

    await createBox({
      label: 'Her MISC',
      description: '2 x 4 Plastic Tub',
      userId: 1,
      locationId: 3,
    });

    // console.log('Finished creating initial boxes.')
  } catch (error) {
    console.error('Error creating initial boxes.');
    throw error;
  };
};

const createInitialBoxItems = async () => {
  try {
    // console.log('Creating initial box items...');
    await createBoxItem({
      boxId: 1,
      itemId: 10,
    });

    await createBoxItem({
      boxId: 1,
      itemId: 12,
    });

    await createBoxItem({
      boxId: 2,
      itemId: 5,
    });

    await createBoxItem({
      boxId: 2,
      itemId: 6,
    });

    await createBoxItem({
      boxId: 2,
      itemId: 7,
    });

    // console.log('Finished creating initial box items.');
  } catch (error) {
    console.error('Error creating initial box items.');
    throw error;
  };
};

const rebuildDB = async () => {
  try {
    client.connect();
    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialStorageLocations();
    await createInitialItems();
    await createInitialBoxes();
    await createInitialBoxItems();
  } catch (error) {
    console.error('Error during rebuildDB.');
    throw error;
  };
};

module.exports = {
  rebuildDB,
};