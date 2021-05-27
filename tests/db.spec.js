require('dotenv').config();
const client = require('../db/client');
const { rebuildDB } = require('../db/seedData');

describe('Database', () => {
  beforeAll(async () => {
    await rebuildDB();
  });

  afterAll(() => {
    client.end();
  });
});