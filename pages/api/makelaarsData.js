// api/makelaarsData.js
import { getMakelaarInfo } from '../../lib/data';

export default async function handler(req, res) {
  try {
    const makelaar = req.query.makelaar;

    if (!makelaar) {
      return res.status(400).json({ error: 'Missing makelaar parameter' });
    }

    const name = await getMakelaarInfo(makelaar);
    
    res.status(200).json({ name });
  } catch (error) {
    console.error('API Route Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

