import puppeteer from 'puppeteer';
const fs = require('fs');

export default async function handler(req, res) {
  try {

    const apiResponse = await fetch(process.env.URL + '/api/makelaarsData/makelaar1');
    const makelaarData = await apiResponse.json();

    const name = makelaarData.name.name;
    const url = makelaarData.name.url;

    // scrape website of makelaar1
    // save houses data in elements array
    // with elements array input call function checkElementsAndWrite()
    // if house value doesnt exist in JSON file, write to it
    scrapeWebsite(name, url);

    return res.status(200).json({ makelaarData });

  } catch (error) {
    console.error('Scraping Error:', error);
    res.status(500).json({ error: 'Er is wat fout gegaan' });
  }
}

async function scrapeWebsite(name, url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    async function scrapePage(pageUrl) {
        await page.goto(pageUrl);

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
        checkElementsAndWrite(elements, pageUrl.split('.nl')[0]);

        return elements;
    }

    // Function to scrape all pages
    async function scrapeAllPages() {
        let currentPage = 1;
        let allElements = [];

        while (true) {
            const pageUrl = `${url}pagina-${currentPage}/`;
            const pageElements = await scrapePage(pageUrl);
            allElements = allElements.concat(pageElements);

            // Check if there is a next page
            const nextPageButton = await page.$('.next-page');
            if (!nextPageButton) {
                break; // If there's no next page button, exit the loop
            }

            currentPage++;
            await nextPageButton.click();
            await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        }

        return allElements;
    }

    const allElements = await scrapeAllPages();

    await browser.close();
}

function checkElementsAndWrite(elements, urlBeforeNl) {

    // Get current date and time
    const currentDate = new Date();

    // Get day, month, year, hour, and minute
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const hour = String(currentDate.getHours()).padStart(2, '0');
    const minute = String(currentDate.getMinutes()).padStart(2, '0');

    // Construct the formatted date string
    const formattedDate = `${day}-${month}-${year}:${hour}:${minute}`;

    // Define the file paths
    const makelaar1FilePath = 'huizenJSON/makelaar1.json';
    const betaalbareHuizenFilePath = 'huizenJSON/betaalbareHuizen.json';

    // Initialize empty arrays to store data
    let existingDataMakelaar1 = [];
    let existingDataBetaalbaar = [];

    try {
        // Read the existing data from the "makelaar1.json" file if it exists
        if (fs.existsSync(makelaar1FilePath)) {
            const dataFromFile = fs.readFileSync(makelaar1FilePath, 'utf8');
            if (dataFromFile.trim() !== '') {
                existingDataMakelaar1 = JSON.parse(dataFromFile);
            }
        }

        // Read the existing data from the "betaalbareHuizen.json" file if it exists
        if (fs.existsSync(betaalbareHuizenFilePath)) {
            const dataFromFile = fs.readFileSync(betaalbareHuizenFilePath, 'utf8');
            if (dataFromFile.trim() !== '') {
                existingDataBetaalbaar = JSON.parse(dataFromFile);
            }
        }
    } catch (err) {
        console.error('Error reading file:', err);
    }

    // Function to check if a house already exists based on URL
    const houseExists = (url, data) => {
        return data.some((house) => house.url === url);
    };

    // Iterate over each element in the elements array
    elements.forEach((element, index) => {
        // Extract required fields from the element JSON object
        const { address, description, url } = element;
        const { streetAddress, addressLocality, postalCode } = address;
        const priceMatch = description.match(/€\s*([\d,.]+)/);
        let price = null;
        if (priceMatch) {
            // Remove thousands separators and parse the price as float
            price = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'));
        }

        const fullUrl = urlBeforeNl + ".nl" + url;

        // Prepare data object to be appended
        const dataToAppend = {
            streetAddress,
            addressLocality,
            postalCode,
            price,
            url,
            fullUrl,
            dateAdded: formattedDate
        };

        // Add data to the appropriate file based on the price
        if (price <= 275000 && !houseExists(url, existingDataBetaalbaar)) {
            existingDataBetaalbaar.push(dataToAppend);
            console.log(`New affordable house added: ${streetAddress}, ${addressLocality}`);
        }

        if (!houseExists(url, existingDataMakelaar1)) {
            existingDataMakelaar1.push(dataToAppend);
            console.log(`New house added: ${streetAddress}, ${addressLocality}`);
        }
    });

    // Convert the updated arrays to JSON strings
    const updatedJsonDataMakelaar1 = JSON.stringify(existingDataMakelaar1, null, 2);
    const updatedJsonDataBetaalbaar = JSON.stringify(existingDataBetaalbaar, null, 2);

    // Write the updated JSON data back to the files
    fs.writeFile(makelaar1FilePath, updatedJsonDataMakelaar1, (err) => {
        if (err) {
            console.error(`Error writing file ${makelaar1FilePath}:`, err);
        } else {
            console.log(`Data saved to ${makelaar1FilePath}`);
        }
    });

    fs.writeFile(betaalbareHuizenFilePath, updatedJsonDataBetaalbaar, (err) => {
        if (err) {
            console.error(`Error writing file ${betaalbareHuizenFilePath}:`, err);
        } else {
            console.log(`Data saved to ${betaalbareHuizenFilePath}`);
        }
    });
}