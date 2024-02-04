import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  try {
    // Call /api/makelaarsData?makelaar=makelaar6
    const apiResponse = await fetch('/api/makelaarsData?makelaar=makelaar6');
    const makelaarData = await apiResponse.json();

    console.log(makelaarData);

    // Extract URL from the response
    const { url } = makelaarData.url;

    // Use Puppeteer to scrape the website and capture a screenshot
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    // Capture a screenshot
    const screenshotPath = '/screenshots/screenshot.png';
    await page.screenshot({ path: screenshotPath });

    // Close the browser
    await browser.close();

    // Respond with the screenshot file
    res.status(200).sendFile(screenshotPath, { root: '.' });
  } catch (error) {
    console.error('Scraping Error:', error);
    res.status(500).json({ error: 'Failed to capture screenshot' });
  }
}
