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

def extract_line_of_2_value(text_block):
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
        if text == "":
            text = "0"
        if key == "line89":
            extracted_data[key] = extract_line_of_2_value(text)
        else:
            extracted_data[key] = text
    
    for key, rect in coords_page_2.items():
        text = extract_text(pdf_path, rect, 5)
        if "(" in text:
            text = text.replace("(", "-").replace(")", "")
        extracted_data[key] = text

    return extracted_data

def form1120_extractor(pdf_path, spreadsheet_id):
    coords_page_1 = {
        "line30": (504, 553, 575, 563),
        "line31": (504, 565, 575, 575),
        "line89": (504, 265, 576, 287),
        "line10": (504, 289, 575, 299),
        "line20": (504, 409, 576, 419),
        "line21": (505, 422, 576, 430),
        "line26": (504, 481, 576, 490),
        "line29c": (505, 518, 575, 550)
    }
    
    coords_page_2 = {
        "line17d": (497, 325, 575, 335),
        "line5c": (173, 627, 237, 635)
    }


    cell_map = {
        "line30": "G100",
        "line31": "G101",
        "line89": "G102",
        "line10": "G103",
        "line20": "G104",
        "line21": "G105",
        "line26": "G106",
        "line29c": "G107",
        "line17d": "G108",
        "line5c": "G109"
    }

    extracted_data = extract_data(coords_page_1, coords_page_2, pdf_path)
    print(f"Extracted data: {extracted_data}")
    
    google_sheets_credentials = os.getenv('GOOGLE_SHEETS_CREDENTIALS')
    google_sheets_url = f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit?usp=sharing'

    # Populate the Google Sheet
    google_sheet_populator = SheetPopulatorWithoutAI(google_sheets_credentials, google_sheets_url)
    google_sheet_populator.populate_sheet_without_ai(extracted_data, cell_map)

