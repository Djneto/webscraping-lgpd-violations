# APDados LGPD Violations Scraper

This TypeScript application scrapes LGPD (Brazilian General Data Protection Law) violations data from the APDados website (https://apdados.org/violacoes) and creates visualizations of the data.

## Features

- Scrapes violation data including dates, organizations, violation types, and fines
- Saves data to CSV format
- Creates visualizations:
  - Number of violations per year
  - Top 10 organizations with most violations
  - Distribution of violation types

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

## Usage

1. Build the TypeScript code:
```bash
npm run build
```

2. Run the scraper:
```bash
npm start
```

For development with hot-reload:
```bash
npm run dev
```

## Output

The script will generate:
- `raw_violations.csv`: Contains all scraped data
- `plots/` directory with three PNG files:
  - `violations_per_year.png`
  - `top_organizations.png`
  - `violation_types.png`

## Notes

- The scraper respects the website's robots.txt and terms of service
- Uses appropriate headers to identify the scraper
- Includes error handling for network issues and data parsing

## License

MIT 