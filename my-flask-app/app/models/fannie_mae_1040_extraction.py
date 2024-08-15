from .fannie_mae_operations.extraction_scheduleB import scheduleB_extractor
from .fannie_mae_operations.extraction_scheduleC import scheduleC_extractor
from .fannie_mae_operations.extraction_scheduleD import scheduleD_extractor
from .fannie_mae_operations.extraction_scheduleE import scheduleE_extractor
from .fannie_mae_operations.extraction_scheduleF import scheduleF_extractor
from .fannie_mae_operations.extraction_form1065 import form1065_extractor
from .fannie_mae_operations.extraction_form1120 import form1120_extractor
from .fannie_mae_operations.extraction_form1120S import form1120S_extractor
from .fannie_mae_operations.extraction_scheduleK1_1065 import scheduleK1_1065_extractor
from .fannie_mae_operations.extraction_scheduleK1_1120S import scheduleK1_1120S_extractor
from .fannie_mae_operations.splitter import main_process_batch_splitter
from ..config import get_config
import os
import tempfile

config = get_config(os.getenv('APP_ENV', 'default'))

def process_1040_document(project_id, location, processor_id, pdf_name, file_path, spreadsheet_id):
    tmpdirname = tempfile.mkdtemp()
    
    output_files = main_process_batch_splitter(
        project_id=project_id,
        location=location,
        processor_id=processor_id,
        pdf_name=pdf_name,
        file_path=file_path,
        output_files=tmpdirname
    )
    for local_file, _ in output_files:
        if 'schedule_B.pdf' in local_file:
            scheduleB_extractor(local_file, spreadsheet_id)
        elif 'schedule_C.pdf' in local_file:
            scheduleC_extractor(local_file, spreadsheet_id)
        elif 'form_1040' in local_file:
            scheduleD_extractor(local_file, spreadsheet_id)
        elif 'schedule_E.pdf' in local_file:
            scheduleE_extractor(local_file, spreadsheet_id)
        elif 'schedule_F.pdf' in local_file:
            scheduleF_extractor(local_file, spreadsheet_id)
        elif 'form_1065.pdf' in local_file:
            form1065_extractor(local_file, spreadsheet_id)
        elif 'form_1120.pdf' in local_file:
            form1120_extractor(local_file, spreadsheet_id)
        elif 'form_1120S.pdf' in local_file:
            form1120S_extractor(local_file, spreadsheet_id)
        elif 'schedule_K-1_form-1065' in local_file:
            scheduleK1_1065_extractor(local_file, spreadsheet_id)
        elif 'schedule_K-1_form-1120S' in local_file:
            scheduleK1_1120S_extractor(local_file, spreadsheet_id)