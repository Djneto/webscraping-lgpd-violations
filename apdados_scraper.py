import requests
from bs4 import BeautifulSoup
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import time
import re

def scrape_apdados():
    # URL of the website
    url = "https://apdados.org/violacoes"
    
    # Add headers to mimic a browser request
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        # Make the request
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the table
        table = soup.find('table')
        if not table:
            raise Exception("Table not found on the page")
        
        # Extract table headers
        headers = [th.text.strip() for th in table.find_all('th')]
        
        # Extract table rows
        data = []
        for row in table.find_all('tr')[1:]:  # Skip header row
            cols = row.find_all('td')
            if cols:
                row_data = [col.text.strip() for col in cols]
                data.append(row_data)
        
        # Create DataFrame
        df = pd.DataFrame(data, columns=headers)
        
        return df
    
    except requests.exceptions.RequestException as e:
        print(f"Error accessing the website: {e}")
        return None

def clean_data(df):
    if df is None:
        return None
    
    # Make a copy of the DataFrame
    df_clean = df.copy()
    
    # Convert date column to datetime if it exists
    date_columns = [col for col in df_clean.columns if 'data' in col.lower()]
    for col in date_columns:
        df_clean[col] = pd.to_datetime(df_clean[col], errors='coerce')
    
    # Clean numeric columns
    numeric_columns = [col for col in df_clean.columns if 'valor' in col.lower() or 'multa' in col.lower()]
    for col in numeric_columns:
        df_clean[col] = df_clean[col].str.replace('R$', '').str.replace('.', '').str.replace(',', '.').astype(float)
    
    return df_clean

def analyze_data(df):
    if df is None:
        return
    
    # Create a directory for plots if it doesn't exist
    import os
    if not os.path.exists('plots'):
        os.makedirs('plots')
    
    # 1. Number of violations per year
    if 'Data' in df.columns:
        df['Year'] = pd.to_datetime(df['Data']).dt.year
        violations_per_year = df['Year'].value_counts().sort_index()
        
        plt.figure(figsize=(10, 6))
        violations_per_year.plot(kind='bar')
        plt.title('Number of Violations per Year')
        plt.xlabel('Year')
        plt.ylabel('Number of Violations')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig('plots/violations_per_year.png')
        plt.close()
    
    # 2. Top organizations with most violations
    if 'Organização' in df.columns:
        top_orgs = df['Organização'].value_counts().head(10)
        
        plt.figure(figsize=(12, 6))
        top_orgs.plot(kind='bar')
        plt.title('Top 10 Organizations with Most Violations')
        plt.xlabel('Organization')
        plt.ylabel('Number of Violations')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig('plots/top_organizations.png')
        plt.close()
    
    # 3. Distribution of types of violations
    if 'Tipo de Violação' in df.columns:
        violation_types = df['Tipo de Violação'].value_counts()
        
        plt.figure(figsize=(12, 6))
        violation_types.plot(kind='bar')
        plt.title('Distribution of Types of Violations')
        plt.xlabel('Type of Violation')
        plt.ylabel('Count')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig('plots/violation_types.png')
        plt.close()

def main():
    print("Starting web scraping...")
    df = scrape_apdados()
    
    if df is not None:
        print("Data successfully scraped!")
        print(f"Number of records: {len(df)}")
        
        # Clean the data
        df_clean = clean_data(df)
        
        # Save raw and cleaned data
        df.to_csv('raw_violations_data.csv', index=False)
        df_clean.to_csv('cleaned_violations_data.csv', index=False)
        
        # Perform analysis and create visualizations
        analyze_data(df_clean)
        print("Analysis complete! Check the 'plots' directory for visualizations.")
    else:
        print("Failed to scrape data from the website.")

if __name__ == "__main__":
    main() 