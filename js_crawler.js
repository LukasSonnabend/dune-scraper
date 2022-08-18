const puppeteer = require("puppeteer");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: "out.csv",
});

function Sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

(async () => {
  all_data = [];

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  //remove timeout
  await page.setDefaultNavigationTimeout(0);

  await page.goto("https://dune.xyz/auth/login?next=https://dune.xyz/queries");
  // Set login Name
  const loginName = "";
  // Set password
  const loginPassword = "";
  await page.type(
    "label.fields_field__miUQe:nth-child(4) > div:nth-child(2) > div:nth-child(1) > input:nth-child(1)",
    loginName
  );
  await page.type(
    "label.fields_field__miUQe:nth-child(5) > div:nth-child(2) > div:nth-child(1) > input:nth-child(1)",
    loginPassword
  );
  await page.click("button.button_button__VllXE");
  //wait for login
  await Sleep(4000);

  // do query

  const base_no = 6_775_000;
  // set limit hier
  const limit = 10000;
  // num loops
  const loops = 5;

  for (let i = 0; i < loops; i++) {
    const base_query = `SELECT * FROM nft.trades Order by block_time Limit ${limit} Offset ${
      base_no + i * limit
    }`;
    await page.type("textarea.ace_text-input", base_query);
    await page.focus('textarea.ace_text-input');
    await page.keyboard.down('Control');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Control');
    await Sleep(500);
    // click run

    // wait for visible r
    // await page.click(".table_footer__3Po9w > li:nth-child(6) > button:nth-child(1)");
    await page.waitForSelector("table", { timeout: 0 });
    console.log("shits there");

    // loop to handle all pages of query
    for (let j = 0; j < Math.ceil(limit / 25); j++) {
      const result = await page.evaluate(() => {
        const rows = document.querySelectorAll("table > tbody > tr");
        return Array.from(rows, (row) => {
          const columns = row.querySelectorAll("td");
          return Array.from(columns, (column) => column.innerText);
        });
      });
      // click next page
      all_data = all_data.concat(result);
      console.log(result);

      // on last loop no next page
      if (j !== Math.ceil(limit / 25)) {
        const elements = await page.$x('/html/body/div/div/main/div/section/div/div[1]/section[2]/div/div[2]/div[1]/div/ul/li[6]/button')
        await elements[0].click()
      }
    }
    // next query
    // clear input
    await page.focus('textarea.ace_text-input');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
  }

  //write to csv
  const fs = require("fs");
  const writeStream = fs.createWriteStream(`${base_no}-${base_no+(limit*loops)}.csv`);
  for (let i = 0; i < all_data.length; i++) {
    // "escape data to prevent csv errors"
    const data_point_escaped = all_data[i].map((x) => '"' + x + '"');
    writeStream.write(data_point_escaped.join(",") + "\n");
  }

  await browser.close();
})();
