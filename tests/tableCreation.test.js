const puppeteer = require('puppeteer');

describe('Table Creation Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false }); // Set to true for headless mode
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should navigate to database page, create a table, and verify it appears', async () => {
    // Navigate to the database page
    await page.goto('http://localhost:3000/database');

    // Wait for the page to load (wait for the header or main content)
    await page.waitForSelector('h1');

    // Click the "Crear Tabla" button on the page
    const createButton = await page.$x('//button[text()="Crear Tabla"]');
    await createButton[0].click(); // Click the first "Crear Tabla" button (page button)

    // Wait for the modal to appear
    await page.waitForSelector('h3');

    // Enter the table name in the input field
    await page.type('input[placeholder="Ingrese el nombre de la tabla..."]', 'TestTable');

    // Click the "Crear Tabla" button in the modal to submit
    const submitButton = await page.$x('//button[text()="Crear Tabla"]');
    await submitButton[1].click(); // Click the second "Crear Tabla" button (modal submit)

    // Wait for the table creation to complete (wait for refresh or success message)
    await page.waitForTimeout(3000); // Adjust based on app response time

    // Verify that the new table appears in the list
    const tableElements = await page.$x('//h3[text()="TestTable"]');
    expect(tableElements.length).toBeGreaterThan(0);
  });
});