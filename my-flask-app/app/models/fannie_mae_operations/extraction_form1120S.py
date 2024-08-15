from ...utils.pdf_extraction_util import extract_text, extract_amortization_value
from ...utils.google_sheets_util import SheetPopulatorWithoutAI
from ...config import get_config
import os
import fitz  # PyMuPDF
import re

# Get the current environment ('development', 'testing', 'production')
env = os.getenv('APP_ENV', 'default')

# Get the configuration for the current environment
config = get_config(env)

def extract_text(pdf_path, coords, page_number):
    """Extract text from specified coordinates and page."""
    document = fitz.open(pdf_path)
    page = document.load_page(page_number)
    rect = fitz.Rect(coords)
    text = page.get_textbox(rect)
    document.close()
    print(f"Extracted text: {text.strip()}")
    return text.strip()

def extract_line_of_3_value(text_block):
    """Extracts the monetary value for lines containing 'Amortization' or 'Casualty' followed by 'Loss'."""
    lines = text_block.split('\n')
    results = []
    for i, line in enumerate(lines):
        results.append(line.replace(',', '').replace('.', '')) 
    return sum([int(result) for result in results]) if results else None

def extract_data(coords_page_1, coords_page_2, coords_page_3, pdf_path):
    extracted_data = {}
    line4 = 0
    line5 = 0
    # Extract data from page 1
    for key, rect in coords_page_1.items():
        text = extract_text(pdf_path, rect, 0)
        if "(" in text:
            text = text.replace("(", "-").replace(")", "")
        if key == "line4":
            line4 = float(text)
        elif key == "line5":
            line5 = float(text)
        else:
            extracted_data[key] = text
    extracted_data["line4-5"] = str(line4+line5)

    for key, rect in coords_page_2.items():
        text = extract_text(pdf_path, rect, 0)
        if "(" in text:
            text = text.replace("(", "-").replace(")", "")
        extracted_data[key] = text
    
    for key, rect in coords_page_3.items():
        text = extract_text(pdf_path, rect, 0)
        if "(" in text:
            text = text.replace("(", "-").replace(")", "")
        extracted_data[key] = text

    return extracted_data

def form1120S_extractor(pdf_path, spreadsheet_id):
    coords_page_1 = {
        "line4" : (497, 265, 576, 275),
        "line5" : (497, 277, 576, 287),
        "line14" : (498, 385, 575, 395),
        "line15" : (497, 397, 576, 407),
        "line20" : (498, 458, 576, 466)
    }
    
    coords_page_2 = {
        "line17d" : (497, 421, 576, 431)
    }

    coords_page_3 = {
        "line3b" : (167, 194, 222, 203),
        "line3b2" : (65, 204, 223, 215)
    }


    cell_map = {
        "line4-5": "G79",
        "line14": "G80",
        "line15": "G81",
        "line20": "G82",
        "line17d": "G83",
        "line3b": "G84",
    }

    extracted_data = extract_data(coords_page_1, coords_page_2, coords_page_3, pdf_path)
    print(f"Extracted data: {extracted_data}")
    
    google_sheets_credentials = os.getenv('GOOGLE_SHEETS_CREDENTIALS')
    google_sheets_url = f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit?usp=sharing'

    # Populate the Google Sheet
    google_sheet_populator = SheetPopulatorWithoutAI(google_sheets_credentials, google_sheets_url)
    google_sheet_populator.populate_sheet_without_ai(extracted_data, cell_map)

