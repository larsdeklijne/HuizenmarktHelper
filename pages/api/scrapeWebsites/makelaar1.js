import puppeteer from 'puppeteer';
const fs = require('fs');

export default async function handler(req, res) {
  try {

    const apiResponse = await fetch(process.env.URL + '/api/makelaarsData/makelaar1');
    const makelaarData = await apiResponse.json();

    const name = makelaarData.name.name;
    const url = makelaarData.name.url;

    // Use Puppeteer to scrape the website and capture a screenshot
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    // generate unique number
    var date = new Date;
    var seconds = date.getSeconds();
    var minutes = date.getMinutes();
    var hour = date.getHours();

    var timeCombined = seconds + '.' + minutes + '.' + hour;

    // Getting an array of all elements with class 'item'
    const elements = await page.$$eval('.al4woning', elements => {
      const contextData = [];
      elements.forEach(element => {
          const html = element.innerHTML;
          const jsonRegex = /<script type="application\/ld\+json">\s*({[^]+?"@context"[^]+?})\s*<\/script>/;
          const match = html.match(jsonRegex);
          if (match && match[1]) {
              contextData.push(JSON.parse(match[1]));
          }
      });
      return contextData;
  });

    // call function to check elements array for new data, if yes write to JSON file
    checkElementsAndWrite(elements);

    // Capture a screenshot
    await page.screenshot({
      path: 'screenshots/'+name+''+timeCombined+'.jpg',
      fullPage: true 
    })

    // Close the browser
    await browser.close();

    return res.status(200).json({ makelaarData });

  } catch (error) {
    console.error('Scraping Error:', error);
    res.status(500).json({ error: 'Er is wat fout gegaan' });
  }
}



function checkElementsAndWrite(elements){
  
  // Define the file path
  const filePath = 'huizenJSON/makelaar1.json';

  // Initialize an empty array to store data
  let existingData = [];

  try {
      // Read the existing data from the file if it exists
      if (fs.existsSync(filePath)) {
          const dataFromFile = fs.readFileSync(filePath, 'utf8');
          // Check if the file is empty
          if (dataFromFile.trim() !== '') {
              existingData = JSON.parse(dataFromFile);
          }
      }
  } catch (err) {
      console.error('Error reading file:', err);
  }

  // Function to check if a house already exists based on URL
  const houseExists = (url) => {
      return existingData.some((house) => house.url === url);
  };

  // Iterate over each element in the elements array
  elements.forEach((element, index) => {
      // Extract required fields from the element JSON object
      const { address, description, url } = element;
      const { streetAddress, addressLocality, postalCode } = address;
      const priceMatch = description.match(/€\s*([\d,.]+)/);
      const price = priceMatch ? priceMatch[1] : null;

      // Check if the house already exists in the data
      if (!houseExists(url)) {
          // Prepare data object to be appended
          const dataToAppend = {
              streetAddress,
              addressLocality,
              postalCode,
              price,
              url,
              dateAdded: new Date().toISOString() // Add current date and time
          };

          // Append data to the existing array
          existingData.push(dataToAppend);

          // Log a notification for the new house added
          console.log(`New house added: ${streetAddress}, ${addressLocality}`);
      }
  });

  // Convert the updated array to JSON string
  const updatedJsonData = JSON.stringify(existingData, null, 2);

  // Write the updated JSON data back to the file
  fs.writeFile(filePath, updatedJsonData, (err) => {
      if (err) {
          console.error(`Error writing file ${filePath}:`, err);
      } else {
          console.log(`Data saved to ${filePath}`);
      }
  });

}