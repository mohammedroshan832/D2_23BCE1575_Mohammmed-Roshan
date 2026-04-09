const puppeteer = require('puppeteer'); 
(async () => { 
  const browser = await puppeteer.launch(); 
  const page = await browser.newPage(); 
  page.on('console', msg => console.log('PAGE LOG:', msg.text())); 
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message)); 
  await page.goto('http://localhost:5173', {waitUntil: 'networkidle2'}); 
  // Select first input (username)
  await page.type('input', 'admin'); 
  // find button and click
  await page.click('button'); 
  // wait and see errors
  await new Promise(r => setTimeout(r, 2000));
  await browser.close(); 
})();
