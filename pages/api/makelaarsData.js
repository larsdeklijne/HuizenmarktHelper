// api/makelaarsData.js
import { getMakelaarName } from '../../lib/data';

export default async function handler(req, res) {
  const makelaar = "makelaar3";

  try {
    const name = await getMakelaarName(makelaar);
    res.status(200).json({ name });
  } catch (error) {
    console.error('API Route Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
