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

def extract_data(coords_page_1, pdf_path):
    extracted_data = {}
    line2 = 0
    line3 = 0
    # Extract data from page 1
    for key, rect in coords_page_1.items():
        text = extract_text(pdf_path, rect, 0)
        if "(" in text:
            text = text.replace("(", "-").replace(")", "")
        text = extract_text(pdf_path, rect, 0)
        if "(" in text:
            text = text.replace("(", "-").replace(")", "")
        if key == "line2":
            line2 = float(text)
        elif key == "line3":
            line3 = float(text)
        else:
            extracted_data[key] = text
    extracted_data["line2-3"] = line2 + line3
    return extracted_data

def scheduleK1_1065_extractor(pdf_path, spreadsheet_id):
    coords_page_1 = {
        "line1": (333, 83, 445, 95),
        "line2": (334, 109, 445, 120),
        "line3": (333, 133, 445, 142),
        "line4c": (334, 205, 446, 215),
        "linepercent": (196, 470, 291, 480),
    }

    cell_map = {
        "line1": "G55",
        "line2-3": "G56",
        "line4c": "G57",
        "linepercent": "G67",
    }

    extracted_data = extract_data(coords_page_1, pdf_path)
    print(f"Extracted data: {extracted_data}")
    
    google_sheets_credentials = os.getenv('GOOGLE_SHEETS_CREDENTIALS')
    google_sheets_url = f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit?usp=sharing'

    # Populate the Google Sheet
    google_sheet_populator = SheetPopulatorWithoutAI(google_sheets_credentials, google_sheets_url)
    google_sheet_populator.populate_sheet_without_ai(extracted_data, cell_map)

