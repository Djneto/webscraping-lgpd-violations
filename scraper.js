const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://apdados.org/violacoes", {
    waitUntil: "networkidle0",
  });

  // Espera pela tabela com seletor mais específico
  await page.waitForSelector("table.table");

  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("table.table tbody tr"));

    return rows.map((row) => {
      const cols = row.querySelectorAll("td");
      return {
        date: cols[0]?.innerText.trim(),
        state: cols[1]?.innerText.trim(),
        sanctions: cols[2]?.innerText.trim(),
        issuer: cols[3]?.innerText.trim(),
        status: cols[4]?.innerText.trim(),
        penalty: cols[5]?.innerText.trim(),
        value: cols[6]?.innerText.trim(),
        convictions: cols[7]?.innerText.trim(),
        segment: cols[8]?.innerText.trim(),
        law: cols[9]?.innerText.trim(),
        article: cols[10]?.innerText.trim(),
        description: cols[11]?.innerText.trim(),
        notes: cols[12]?.innerText.trim(),
        link: cols[13]?.querySelector("a")?.href || "",
      };
    });
  });

  fs.writeFileSync("lgpd_violations.json", JSON.stringify(data, null, 2));
  console.log(`✅ ${data.length} registros salvos em lgpd_violations.json`);

  await browser.close();
})();
