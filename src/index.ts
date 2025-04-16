import axios from 'axios';
import * as cheerio from 'cheerio';
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';
import { Chart } from 'chart.js';
import { createCanvas } from 'canvas';

interface Violation {
  data: string;
  organizacao: string;
  tipoViolacao: string;
  descricao: string;
  valorMulta?: number;
}

async function scrapeAPDados(): Promise<Violation[]> {
  const url = 'https://apdados.org/violacoes';
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const violations: Violation[] = [];

    // Find the table and extract data
    $('table tr').each((i, row) => {
      if (i === 0) return; // Skip header row

      const cols = $(row).find('td');
      if (cols.length > 0) {
        const violation: Violation = {
          data: $(cols[0]).text().trim(),
          organizacao: $(cols[1]).text().trim(),
          tipoViolacao: $(cols[2]).text().trim(),
          descricao: $(cols[3]).text().trim(),
        };

        // Try to extract fine value if present
        const valorText = $(cols[4]).text().trim();
        if (valorText) {
          const valor = parseFloat(valorText.replace('R$', '').replace('.', '').replace(',', '.'));
          if (!isNaN(valor)) {
            violation.valorMulta = valor;
          }
        }

        violations.push(violation);
      }
    });

    return violations;
  } catch (error) {
    console.error('Error scraping data:', error);
    throw error;
  }
}

async function saveToCSV(violations: Violation[], filename: string) {
  const csvWriter = createObjectCsvWriter({
    path: filename,
    header: [
      { id: 'data', title: 'Data' },
      { id: 'organizacao', title: 'Organização' },
      { id: 'tipoViolacao', title: 'Tipo de Violação' },
      { id: 'descricao', title: 'Descrição' },
      { id: 'valorMulta', title: 'Valor da Multa' }
    ]
  });

  await csvWriter.writeRecords(violations);
}

function createVisualizations(violations: Violation[]) {
  // Create plots directory if it doesn't exist
  const plotsDir = path.join(__dirname, '..', 'plots');
  if (!fs.existsSync(plotsDir)) {
    fs.mkdirSync(plotsDir);
  }

  // 1. Violations per year
  const violationsByYear = violations.reduce((acc, violation) => {
    const year = new Date(violation.data).getFullYear();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // 2. Top organizations
  const orgCounts = violations.reduce((acc, violation) => {
    acc[violation.organizacao] = (acc[violation.organizacao] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topOrgs = Object.entries(orgCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // 3. Violation types distribution
  const violationTypes = violations.reduce((acc, violation) => {
    acc[violation.tipoViolacao] = (acc[violation.tipoViolacao] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Create charts using Chart.js and canvas
  const width = 800;
  const height = 400;

  // Violations per year chart
  const yearCanvas = createCanvas(width, height);
  const yearCtx = yearCanvas.getContext('2d');
  new Chart(yearCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(violationsByYear),
      datasets: [{
        label: 'Violations per Year',
        data: Object.values(violationsByYear),
        backgroundColor: 'rgba(54, 162, 235, 0.5)'
      }]
    },
    options: {
      responsive: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Save the chart
  const yearBuffer = yearCanvas.toBuffer('image/png');
  fs.writeFileSync(path.join(plotsDir, 'violations_per_year.png'), yearBuffer);

  // Top organizations chart
  const orgCanvas = createCanvas(width, height);
  const orgCtx = orgCanvas.getContext('2d');
  new Chart(orgCtx, {
    type: 'bar',
    data: {
      labels: topOrgs.map(([org]) => org),
      datasets: [{
        label: 'Top 10 Organizations',
        data: topOrgs.map(([, count]) => count),
        backgroundColor: 'rgba(255, 99, 132, 0.5)'
      }]
    },
    options: {
      responsive: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  const orgBuffer = orgCanvas.toBuffer('image/png');
  fs.writeFileSync(path.join(plotsDir, 'top_organizations.png'), orgBuffer);

  // Violation types chart
  const typesCanvas = createCanvas(width, height);
  const typesCtx = typesCanvas.getContext('2d');
  new Chart(typesCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(violationTypes),
      datasets: [{
        label: 'Types of Violations',
        data: Object.values(violationTypes),
        backgroundColor: 'rgba(75, 192, 192, 0.5)'
      }]
    },
    options: {
      responsive: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  const typesBuffer = typesCanvas.toBuffer('image/png');
  fs.writeFileSync(path.join(plotsDir, 'violation_types.png'), typesBuffer);
}

async function main() {
  try {
    console.log('Starting web scraping...');
    const violations = await scrapeAPDados();
    
    console.log(`Successfully scraped ${violations.length} violations`);
    
    // Save raw data
    await saveToCSV(violations, 'raw_violations.csv');
    console.log('Raw data saved to raw_violations.csv');
    
    // Create visualizations
    createVisualizations(violations);
    console.log('Visualizations created in the plots directory');
    
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

main(); 