// data.js
import { sql } from '@vercel/postgres';

export async function getMakelaarName(makelaar) {

  try {
    let data;
    let responseData;

    // Use a switch statement to handle different cases
    switch (makelaar) {
      case 'makelaar1':
        data = await sql`SELECT name FROM makelaar1`;
        responseData = data.rows[0].name;
        break;

      case 'makelaar2':
        data = await sql`SELECT name FROM makelaar2`;
        responseData = data.rows[0].name;
        break;

      case 'makelaar3':
        data = await sql`SELECT name FROM makelaar3`;
        responseData = data.rows[0].name;
        break;

      case 'makelaar4':
        data = await sql`SELECT name FROM makelaar4`;
        responseData = data.rows[0];
        break;

      case 'makelaar5':
        data = await sql`SELECT name FROM makelaar5`;
        responseData = data.rows[0];
        break;

      case 'makelaar6':
        data = await sql`SELECT name FROM makelaar6`;
        responseData = data.rows[0];
        break;

      case 'makelaar7':
        data = await sql`SELECT name FROM makelaar7`;
        responseData = data.rows[0];
        break;

      case 'makelaar8':
        data = await sql`SELECT name FROM makelaar8`;
        responseData = data.rows[0];
        break;

      default:
        // Handle the case where makelaar doesn't match any expected value
        throw new Error('Invalid makelaar value');
    }

    return responseData;

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch getMakelaarName');
  }
}
