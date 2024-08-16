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
        matches = re.findall(r'\d+[\.,\d+]*', line)
        matches = [float(match) for match in matches if len(match) >= 1]
        results.extend([float(match) for match in matches])
    return str(sum([float(result) for result in results])) if results else None

def extract_data(coords_page_1, coords_page_2, pdf_path):
    extracted_data = {}
    # Extract data from page 1
    for key, rect in coords_page_1.items():
        text = extract_text(pdf_path, rect, 0)
        if "(" in text:
            text = text.replace("(", "-").replace(")", "")
        if key == "line567":
            extracted_data[key] = extract_line_of_3_value(text)
        else:
            extracted_data[key] = text
    for key, rect in coords_page_2.items():
        text = extract_text(pdf_path, rect, 0)
        if "(" in text:
            text = text.replace("(", "-").replace(")", "")
        extracted_data[key] = text

    return extracted_data

def form1065_extractor(pdf_path, spreadsheet_id):
    coords_page_1 = {
        "line4": (504, 277, 576, 287),
        "line567": (505, 289, 576, 322),
        "line16c": (504, 422, 575, 442),
        "line17": (505, 444, 576, 454),
        "line21": (505, 494, 577, 503)
    }
    
    coords_page_2 = {
        "line16d": (504, 409, 577, 420),
        "line4b": (175, 651, 223, 660),
    }

    cell_map = {
        "line4": "G59",
        "line567": "G60",
        "line16c": "G61",
        "line17": "G62",
        "line21": "G63",
        "line16d": "G64",
        "line4b": "G65"
    }

    extracted_data = extract_data(coords_page_1, coords_page_2, pdf_path)
    print(f"Extracted data: {extracted_data}")
    
    google_sheets_credentials = os.getenv('GOOGLE_SHEETS_CREDENTIALS')
    google_sheets_url = f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit?usp=sharing'

    # Populate the Google Sheet
    google_sheet_populator = SheetPopulatorWithoutAI(google_sheets_credentials, google_sheets_url)
    google_sheet_populator.populate_sheet_without_ai(extracted_data, cell_map)

