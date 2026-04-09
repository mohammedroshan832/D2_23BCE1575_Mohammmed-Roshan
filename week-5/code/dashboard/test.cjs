const puppeteer = require('puppeteer'); 
(async () => { 
  const browser = await puppeteer.launch(); 
  const page = await browser.newPage(); 
  page.on('console', msg => console.log('PAGE LOG:', msg.text())); 
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message)); 
  await page.goto('http://localhost:5173', {waitUntil: 'networkidle0'}); 
  
  await page.type('input[type="text"]', 'admin'); 
  await page.type('input[type="password"]', 'admin'); 
  await page.click('button'); 

  await new Promise(r => setTimeout(r, 2500));
  await browser.close(); 
})();
