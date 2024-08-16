from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.services.document_processing_w2_paystub import process_document_w2_paystub
from app.services.document_processing_fannie_mae import process_document_fannie_mae
import os

# Define allowed extensions
ALLOWED_EXTENSIONS = {'pdf'}

api_blueprint = Blueprint('api', __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@api_blueprint.route('/process', methods=['POST'])
def process_documents():
    spreadsheet_id = request.form.get('spreadsheetId')

    # Check if we're processing a single file or multiple files
    if 'file' in request.files:
        # Single file processing (for uploadDocumentA)
        file = request.files['file']
        document_type = request.form.get('document_type')
        if not document_type:
            return jsonify({'error': f'No document type provided: {document_type}'}), 400
        
        results = process_single_file(file, document_type, spreadsheet_id)
    else:
        # Multiple files processing (for uploadDocumentBC)
        files = request.files.getlist('files')
        document_types = request.form.getlist('document_types')

        if not files or not document_types:
            return jsonify({'error': 'No files or document types provided'}), 400

        if len(files) != len(document_types):
            return jsonify({'error': f'Mismatch between files and document types: {files}, {document_types}'}), 400

        results = []
        for file, doc_type in zip(files, document_types):
            result = process_single_file(file, doc_type, spreadsheet_id)
            results.extend(result)

    if not results:
        return jsonify({'error': 'No valid files processed'}), 400

    return jsonify({'message': 'Documents processed', 'results': results}), 200

def process_single_file(file, document_type, spreadsheet_id):
    if file.filename == '':
        return [{'error': 'No selected file', 'filename': 'Empty'}]

    if file and allowed_file(file.filename):
        upload_folder = current_app.config['UPLOAD_FOLDER']
        filename = secure_filename(file.filename)
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)

        try:
            if document_type in ['paystub', 'w2', 'eoy_paystub']:
                process_document_w2_paystub(file_path, 'application/pdf', document_type, spreadsheet_id)
            elif document_type == '1040':
                process_document_fannie_mae(file_path, document_type, file.filename, spreadsheet_id)
            else:
                return [{'filename': file.filename, 'error': f'Invalid document type: {document_type}'}]
            
            return [{'filename': file.filename, 'status': 'processed'}]
        except Exception as e:
            return [{'filename': file.filename, 'error': str(e)}]
        finally:
            # Ensure the file is deleted after processing
            if os.path.exists(file_path):
                os.remove(file_path)
    else:
        return [{'filename': file.filename, 'error': 'Invalid file type'}]

@api_blueprint.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200