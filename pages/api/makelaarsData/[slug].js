// api/makelaarsData.js
import { getMakelaarInfo } from '../../../lib/data';

export default async function handler(req, res) {
  try {
    const { slug } = req.query;

    const makelaar = slug;

    if (!makelaar) {
      return res.status(400).json({ error: 'Missing makelaar slug /makelaarsData/makelaar1' });
    }

    const name = await getMakelaarInfo(makelaar);
    
    return res.status(200).json({ name });
  } catch (error) {
    console.error('API Route Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

