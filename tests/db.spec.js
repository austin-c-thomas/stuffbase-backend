require('dotenv').config();
const client = require('../db/client');
const { rebuildDB } = require('../db/seedData');

const { createUser } = require('../db/adapters/users');
const { expect, describe, it, beforeAll } = require('@jest/globals');

describe('Database', () => {
  beforeAll(async () => {
    await rebuildDB();
  });

  afterAll(() => {
    client.end();
  });

  // Users
  describe('Users', () => {
    describe('createUser', () => {
      const userToCreate = {email: 'user@test.com', password: 'ilovestuffbase', displayName: 'Test User'};
      let createdUser = null;
      beforeAll(async () => {
        createdUser = await createUser(userToCreate);
      });

      it('Adds a new user to the database', () => {
        expect(createdUser).toBeTruthy();
      });

      it('Stores the hashed password in the database', async () => {
        const { rows: [dbUser] } = await client.query(`
          SELECT * FROM users
          WHERE id=$1;
        `, [createdUser.id]);
        expect(dbUser.password).toBeTruthy();
        expect(dbUser.password).not.toBe(userToCreate.password);
      });

      it(`Returns the user's information without the password`, () => {
        expect(createdUser.password).not.toBeTruthy();
      });
    });
  });
});