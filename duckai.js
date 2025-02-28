#!/usr/bin/env node

const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

const searchText = process.argv[2];
const url = 'https://duck.ai';
const textareaSearchBox = '[name="user-prompt"]';
const buttonSubmit = '[aria-label="Send"]';
const textMessage = '[heading="o3-mini "] > div:nth-child(2)'; // change heading name if other model is used
const totalLoopCount = 60;
const printIntervalTime = 1000;
const cookie1 = {
  name: 'dcm',
  value: '8', // 3: GPT-4o mini; 1: Haiku; 5: Llama; 6: Mixtral; 8: o3-mini
  domain: 'duckduckgo.com',
  path: '/'
};
const cookie2 = {
  name: 'dcs',
  value: '0', // 0: disable recent chats; 1: enable recent chats
  domain: 'duckduckgo.com',
  path: '/'
}

chromium.launch({ headless: true, timeout: 10000 }).then(async browser => {
  // Set page
  const context = await browser.newContext();
  await context.addCookies([cookie1]);
  await context.addCookies([cookie2]);
  const page = await context.newPage();

  // Start page
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Reload page
  await page.reload();

  // Submit question
  await page.fill(textareaSearchBox, searchText);
  await page.click(buttonSubmit);

  // Get reply
  var prevResult = '';
  for (let i = 0; i < totalLoopCount; i++) {
    await new Promise((resolve) => setTimeout(resolve, printIntervalTime));

    var result = await page.locator(textMessage).innerHTML();
    // Remove <p>
    result = result.replace(/<p>/g, '');
    // Convert <li> to -
    result = result.replace(/<li>/g, '- ');
    // Remove remaining HTML tags
    result = result.replace(/<\/?[^>]+(>|$)/g, "");

    // Decode HTML using temporary element
    const decodedResult = await page.evaluate(encoded => {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = encoded;
        return textarea.value;
    }, result);

    console.clear();
    console.log('----------\n' + decodedResult);
    if (prevResult == result && i != (totalLoopCount - 1)) {
      i = (totalLoopCount - 1);
    }
    prevResult = result
  }

  // Close browser
  await browser.close();
});
