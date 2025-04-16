const { createObjectCsvWriter } = require("csv-writer");
const data = require("./lgpd_violations.json");
const fs = require("fs");

// Helper: parse date safely
function parseDate(dateStr) {
  const [day, month, year] = dateStr.split("/");
  return { day, month, year };
}

// 1. Violações por ano e mês
const violationsPerMonth = {};
data.forEach((item) => {
  const { month, year } = parseDate(item.date);
  const key = `${year}-${month}`;
  violationsPerMonth[key] = (violationsPerMonth[key] || 0) + 1;
});

// 1.1. Violações por ano
const violationsPerYear = {};
data.forEach((item) => {
  const { year } = parseDate(item.date);
  violationsPerYear[year] = (violationsPerYear[year] || 0) + 1;
});

// 2. Violações por estado
const stateCount = {};
data.forEach((item) => {
  const state = item.state || "Desconhecido";
  stateCount[state] = (stateCount[state] || 0) + 1;
});

// 3. Artigos mais violados
const articleCount = {};
data.forEach((item) => {
  const article = item.article || "Desconhecido";
  articleCount[article] = (articleCount[article] || 0) + 1;
});

// 4. Total de valor de multas por ano
const valuePerYear = {};
data.forEach((item) => {
  const { year } = parseDate(item.date);
  const raw =
    item.value?.replace("R$", "").replace(/\./g, "").replace(",", ".") || "0";
  const value = parseFloat(raw);
  if (!isNaN(value)) {
    valuePerYear[year] = (valuePerYear[year] || 0) + value;
  }
});

// 5. Segmentos mais afetados
const segmentCount = {};
data.forEach((item) => {
  const segment = item.segment || "Desconhecido";
  segmentCount[segment] = (segmentCount[segment] || 0) + 1;
});

// 6. Palavras-chave mais comuns nas descrições
const keywordFreq = {};
data.forEach((item) => {
  const desc = item.description || "";
  const words = desc
    .toLowerCase()
    .replace(/[.,;:"“”]/g, "")
    .split(/\s+/);
  words.forEach((word) => {
    if (word.length > 3) {
      // ignora palavras pequenas
      keywordFreq[word] = (keywordFreq[word] || 0) + 1;
    }
  });
});

// 7. Status das sanções
const statusCount = {};
data.forEach((item) => {
  const status = item.status || "Desconhecido";
  statusCount[status] = (statusCount[status] || 0) + 1;
});

console.log("\nViolações por mês:");
console.table(violationsPerMonth);

console.log("\nViolações por ano:");
console.table(violationsPerYear);

console.log("\nViolações por estado:");
console.table(stateCount);

console.log("\nArtigos mais violados:");
console.table(
  Object.entries(articleCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
);

console.log("\nTotal de multas por ano (R$):");
console.table(valuePerYear);

console.log("\nSegmentos mais afetados:");
console.table(
  Object.entries(segmentCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
);

console.log("\nPalavras mais frequentes nas descrições:");
console.table(
  Object.entries(keywordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
);

console.log("\nStatus das sanções:");
console.table(statusCount);

let output = "# 📊 Relatório de Violações à LGPD\n\n";
output += "_Dados analisados automaticamente a partir do arquivo JSON._\n";

// Helper para formatar tabelas em Markdown
function formatMarkdownTable(title, obj, sort = false, top = null) {
  output += `\n## ${title}\n\n`;
  output += "| Item | Quantidade |\n";
  output += "|------|------------|\n";
  let entries = Object.entries(obj);
  if (sort) entries = entries.sort((a, b) => b[1] - a[1]);
  if (top !== null) entries = entries.slice(0, top);
  entries.forEach(([key, value]) => {
    output += `| ${key} | ${value} |\n`;
  });
}

// Gerar as seções formatadas
formatMarkdownTable("Violações por mês", violationsPerMonth, true);
formatMarkdownTable("Violações por ano", violationsPerYear, true);
formatMarkdownTable("Violações por estado", stateCount, true);
formatMarkdownTable("Artigos mais violados", articleCount, true, 10);
formatMarkdownTable("Total de multas por ano (R$)", valuePerYear, true);
formatMarkdownTable("Segmentos mais afetados", segmentCount, true, 10);
formatMarkdownTable(
  "🧠 Palavras mais frequentes nas descrições",
  keywordFreq,
  true,
  15
);
formatMarkdownTable("⚖️ Status das sanções", statusCount, true);

// Salvar o arquivo
fs.writeFileSync("relatorio_lgpd.md", output, "utf-8");

console.log(
  "✅ Relatório em Markdown gerado com sucesso em 'relatorio_lgpd.md'"
);

// Função para gerar CSV
function generateCsv(data, filename, header) {
  const csvWriter = createObjectCsvWriter({
    path: filename,
    header: header,
  });

  const records = Object.entries(data).map(([key, value]) => ({
    item: key,
    quantidade: value,
  }));

  csvWriter
    .writeRecords(records)
    .then(() => console.log(`✅ CSV gerado com sucesso: ${filename}`))
    .catch((err) => console.error("Erro ao gerar o CSV:", err));
}

// Gerar CSVs
generateCsv(violationsPerMonth, "violations_per_month.csv", [
  { id: "item", title: "Item" },
  { id: "quantidade", title: "Quantidade" },
]);

generateCsv(violationsPerYear, "violations_per_year.csv", [
  { id: "item", title: "Item" },
  { id: "quantidade", title: "Quantidade" },
]);

generateCsv(stateCount, "violations_per_state.csv", [
  { id: "item", title: "Item" },
  { id: "quantidade", title: "Quantidade" },
]);

generateCsv(articleCount, "violations_per_article.csv", [
  { id: "item", title: "Item" },
  { id: "quantidade", title: "Quantidade" },
]);

generateCsv(valuePerYear, "violations_value_per_year.csv", [
  { id: "item", title: "Item" },
  { id: "quantidade", title: "Quantidade" },
]);

generateCsv(segmentCount, "violations_per_segment.csv", [
  { id: "item", title: "Item" },
  { id: "quantidade", title: "Quantidade" },
]);

generateCsv(keywordFreq, "violations_keywords.csv", [
  { id: "item", title: "Item" },
  { id: "quantidade", title: "Quantidade" },
]);

generateCsv(statusCount, "violations_status.csv", [
  { id: "item", title: "Item" },
  { id: "quantidade", title: "Quantidade" },
]);
