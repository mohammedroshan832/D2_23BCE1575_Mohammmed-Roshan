const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Catch console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('requestfailed', request => {
        console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    console.log("Navigating to http://localhost:5173/data-entry...");
    await page.goto('http://localhost:5173/data-entry', { waitUntil: 'networkidle0' });

    console.log("Filling form...");
    // The Location input is the first required input under Water Quality Injection
    // It's the 7th input on the page theoretically. But we can select it by iterating over all inputs.
    await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        // Find pH input
        const phInput = inputs.find(el => el.placeholder === 'e.g. 7.2');
        if(phInput) {
            phInput.value = '22';
            phInput.dispatchEvent(new Event('input', { bubbles: true }));
            phInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Find Turbidity input
        const turbInput = inputs.find(el => el.placeholder === 'e.g. 2.5');
        if(turbInput) {
            turbInput.value = '22';
            turbInput.dispatchEvent(new Event('input', { bubbles: true }));
            turbInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Find Location / Target Body input
        const locInput = inputs.find(el => el.placeholder === 'e.g. Imphal River');
        if(locInput) {
            locInput.value = 'ssa';
            locInput.dispatchEvent(new Event('input', { bubbles: true }));
            locInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
    });

    console.log("Clicking submit...");
    
    // Intercept standard javascript alert
    page.on('dialog', async dialog => {
        console.log("ALERT FIRED:", dialog.message());
        await dialog.accept();
    });

    await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('Simulate Water Read'));
        if(btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 3000));
    await browser.close();
    console.log("Done.");
})();
