const knex = require('knex');
require('dotenv').config();

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: { min: 0, max: 1 },
});

async function testConnection() {
  try {
    console.log('Testing connection to:', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@'));
    const result = await db.raw('SELECT 1+1 AS result');
    console.log('Connection successful:', result.rows);
  } catch (error) {
    console.error('Connection failed:');
    console.error(error);
  } finally {
    await db.destroy();
  }
}

testConnection();
