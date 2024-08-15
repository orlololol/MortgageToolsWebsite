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

def extract_line32(text_block):
    """Extracts the monetary value for lines containing 'Amortization' or 'Casualty' followed by 'Loss'."""
    lines = text_block.split('\n').lower()
    results = []
    results2 = 0
    for i, line in enumerate(lines):
        # Check for the presence of keywords in the current line
        if re.search(r'\bamortization\b', line, re.IGNORECASE) or \
            re.search(r'\bcasualty\b', line, re.IGNORECASE) and re.search(r'\bloss\b', line, re.IGNORECASE) or \
            re.search(r'\bdepletion\b', line, re.IGNORECASE):
            # Check if the next line exists and extract the monetary value
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                matches = re.findall(r'\d+[\.,\d+]*', next_line)
                if matches:
                    # Return the first match, removing commas and periods for clean numeric value
                    results.append(matches[0].replace(',', '').replace('.', ''))
        elif re.search(r'\bbusiness\b', line, re.IGNORECASE) and \
            re.search(r'\buse\b', line, re.IGNORECASE) \
            and re.search(r'\bof\b', line, re.IGNORECASE) \
            and re.search(r'\bhome\b', line, re.IGNORECASE):
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                matches = re.findall(r'\d+[\.,\d+]*', next_line)
                if matches:
                    results2 = matches[0].replace(',', '').replace('.', '')
    return sum(results), results2

def extract_data(coords_page_1, pdf_path):
    extracted_data = {}
    line3a = 0
    line3b = 0
    line4a = 0
    line4b = 0
    line6a = 0
    line6b = 0
    line5c = 0
    line8 = 0
    # Extract data from page 1
    for key, rect in coords_page_1.items():
        text = extract_text(pdf_path, rect, 0)
        if "(" in text:
            text = text.replace("(", "-").replace(")", "")
        if key == "line3a":
            line3a = float(text)
        elif key == "line3b":
            line3b = float(text)
        elif key == "line4a":
            line4a = float(text)
        elif key == "line4b":
            line4b = float(text)
        elif key == "line6a":
            line6a = float(text)
        elif key == "line6b":   
            line6b = float(text)
        elif key == "line5c":
            line5c = float(text)
        elif key == "line8":
            line8 = float(text)
        elif key == "line32":
            extracted_data[key], extracted_data["line32-2"] = extract_line32(text)
        else:
            extracted_data[key] = text
    extracted_data["line5c_8"] = str(line5c + line8)
    extracted_data["line3_4_6"] = str((line3a - line3b) + (line4a - line4b) + (line6a - line6b))
    return extracted_data

def scheduleF_extractor(pdf_path, spreadsheet_id):
    coords_page_1 = {
        "line34" : (512, 602, 577, 612),
        "line3a" : (275, 228, 344, 239),
        "line3b" : (507, 230, 577, 239),
        "line4a" : (274, 241, 344, 252),
        "line4b" : (504, 241, 577, 252),
        "line6a" : (275, 289, 345, 300),
        "line6b" : (506, 278, 576, 300),
        "line5c" : (506, 266, 576, 276),
        "line8" : (505, 325, 577, 336),
        "line14" : (231, 434, 303, 456),
        "line32" : (338, 518, 576, 588)
    }

    cell_map = {
        "line34" : "G36",
        "line3_4_6" : "G37",
        "line5c_8" : "G38",
        "line14" : "G39",
        "line32" : "G40",
        "line32-2" : "G41"
    }

    extracted_data = extract_data(coords_page_1, pdf_path)
    print(f"Extracted data: {extracted_data}")
    
    google_sheets_credentials = os.getenv('GOOGLE_SHEETS_CREDENTIALS')
    google_sheets_url = f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit?usp=sharing'

    # Populate the Google Sheet
    google_sheet_populator = SheetPopulatorWithoutAI(google_sheets_credentials, google_sheets_url)
    google_sheet_populator.populate_sheet_without_ai(extracted_data, cell_map)

