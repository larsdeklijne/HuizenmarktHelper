const { db } = require('@vercel/postgres');
const { sql } = require('slonik');

const {
    homes1,
    homes2,
    homes3,
    homes4,
    homes5,
    homes6,
    homes7,
    homes8,
    users
} = require('../lib/placeholder-data.js');
const bcrypt = require('bcrypt');

async function seedUsers(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    // Create the "users" table if it doesn't exist
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `;

    console.log(`Created "users" table`);

    console.log(users);

    // Insert data into the "users" table
    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return client.sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
      }),
    );

    console.log(`Seeded ${insertedUsers.length} users`);

    return {
      createTable,
      users: insertedUsers,
    };
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

async function seedTable(client, tableName, homes) {
    try {
      // Create the table if it doesn't exist
      const createTableQuery = await client.query(`
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          name TEXT NOT NULL,
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          place TEXT NOT NULL,
          street TEXT NOT NULL,
          housenumber INT NOT NULL,
          url VARCHAR(255) NOT NULL,
          price INT NOT NULL,
          created_on DATE NOT NULL,
          available BOOLEAN NOT NULL
        )
      `);
      console.log(`Created "${tableName}" table`);
  
      // Insert data into the table
      const insertedHomes = await Promise.all(
        homes.map(async (home) => {
          const insertQuery = `
            INSERT INTO "${tableName}" (name, id, place, street, housenumber, url, price, created_on, available)
            VALUES ('${home.name}', '${home.id}', '${home.place}', '${home.street}', ${home.housenumber}, '${home.url}', ${home.price}, '${home.created_on}', ${home.available})
            ON CONFLICT (id) DO NOTHING
          `;
          console.log(`Insert query for ${tableName}:`, insertQuery);
  
          return client.query(insertQuery);
        }),
      );
  
      console.log(`Seeded ${insertedHomes.length} ${tableName}`);
  
      return {
        createTable: createTableQuery,
        homes: insertedHomes,
      };
    } catch (error) {
      console.error(`Error seeding ${tableName}:`, error);
      throw error;
    }
  }
  

async function main() {
    const client = await db.connect();
  
    // Seed the users table
    await seedUsers(client);
  
    // create data object to loop through it
    const tablesData = {
      makelaar1: homes1,
      makelaar2: homes2,
      makelaar3: homes3,
      makelaar4: homes4,
      makelaar5: homes5,
      makelaar6: homes6,
      makelaar7: homes7,
      makelaar8: homes8,
    };
  
    for (const [tableName, homes] of Object.entries(tablesData)) {
      await seedTable(client, tableName, homes);
    }
  
    await client.end();
  }

main().catch((err) => {
  console.error(
    'An error occurred while attempting to seed the database:',
    err,
  );
});