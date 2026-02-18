"""
OCR Worker Tasks
Celery tasks for processing PDFs with OCR and extracting product information
"""

import os
import re
import logging
import tempfile
from io import BytesIO

import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from celery import Celery, Task
from minio import Minio
from minio.error import S3Error
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from dotenv import load_dotenv
import json
from typing import Dict, List, Any

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Celery
app = Celery(
    'ocr_worker',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1'),
)

app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)


class DatabaseContextTask(Task):
    """Base task with database connection context"""
    
    def __call__(self, *args, **kwargs):
        self.db_conn = None
        try:
            return super().__call__(*args, **kwargs)
        finally:
            if self.db_conn:
                self.db_conn.close()
    
    def get_db_connection(self):
        if not self.db_conn:
            self.db_conn = psycopg2.connect(
                dsn=os.getenv('DATABASE_URL')
            )
        return self.db_conn


app.Task = DatabaseContextTask


def get_minio_client() -> Minio:
    """Initialize MinIO client"""
    return Minio(
        endpoint=os.getenv('MINIO_ENDPOINT', 'minio:9000').replace('http://', '').replace('https://', ''),
        access_key=os.getenv('MINIO_ACCESS_KEY', 'minioadmin'),
        secret_key=os.getenv('MINIO_SECRET_KEY', 'minioadmin'),
        secure=False,
    )


def download_file_from_minio(bucket: str, object_name: str) -> bytes:
    """Download file from MinIO"""
    client = get_minio_client()
    response = client.get_object(bucket, object_name)
    data = response.read()
    response.close()
    return data


def extract_text_from_pdf(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """Extract text from PDF using PyMuPDF and OCR"""
    pages_data = []
    
    try:
        # Open PDF from bytes
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_data = {
                'page': page_num + 1,
                'text': '',
                'ocr_text': '',
                'images': [],
            }
            
            # Try to extract text directly first
            text = page.get_text()
            page_data['text'] = text
            
            # If no text, perform OCR on images
            image_list = page.get_images(full=True)
            if not text or len(text.strip()) < 50:
                # Convert page to image and OCR
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
                img_data = pix.tobytes("ppm")
                img = Image.open(BytesIO(img_data))
                
                ocr_text = pytesseract.image_to_string(img, lang='spa+eng')
                page_data['ocr_text'] = ocr_text
                
                if not text:
                    page_data['text'] = ocr_text
            
            pages_data.append(page_data)
        
        doc.close()
        return pages_data
    
    except Exception as e:
        logger.error(f"PDF extraction error: {str(e)}")
        raise


def extract_product_info(text: str) -> List[Dict[str, Any]]:
    """Extract product information from OCR text using regex and heuristics"""
    candidates = []
    
    # Split text into lines
    lines = text.split('\n')
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line or len(line) < 5:
            continue
        
        # Look for patterns that might indicate product info
        # Pattern 1: Lines with $ (price indicator)
        price_match = re.search(r'\$?\s*(\d+[.,]\d{2})', line)
        
        # Pattern 2: SKU/product codes (alphanumeric combinations)
        sku_match = re.search(r'\b([A-Z]{2,}\d{2,}|[A-Z0-9]{4,})\b', line)
        
        confidence = 0.0
        extracted_data = {
            'title': line,
            'price': None,
            'sku': None,
            'raw_line': line,
        }
        
        if price_match:
            try:
                price_str = price_match.group(1).replace(',', '.')
                extracted_data['price'] = float(price_str)
                confidence += 0.5
            except:
                pass
        
        if sku_match:
            extracted_data['sku'] = sku_match.group(1)
            confidence += 0.3
        
        if len(line) > 10 and len(line) < 200:  # Reasonable product name length
            confidence += 0.2
        
        if confidence > 0.3:  # Only include if confidence is above threshold
            extracted_data['confidence'] = min(confidence, 1.0)
            candidates.append(extracted_data)
    
    return candidates


def update_ocr_job_status(conn, job_id: str, status: str, result: dict = None, error: str = None):
    """Update OCR job status in database"""
    cursor = conn.cursor()
    
    update_data = {
        'status': status,
        'updated_at': 'NOW()',
    }
    
    if status == 'done':
        update_data['completed_at'] = 'NOW()'
    
    set_clause = ', '.join([f"{k} = {v if v == 'NOW()' else '%s'}" for k, v in update_data.items()])
    
    query = f"UPDATE ocr_jobs SET {set_clause} WHERE id = %s"
    values = [v for v in update_data.values() if v != 'NOW()'] + [job_id]
    
    if result:
        query = query.replace('WHERE', 'SET result = %s WHERE')
        values.insert(list(update_data.values()).index('NOW()'), json.dumps(result))
    
    if error:
        query = query.replace('WHERE', 'SET error_message = %s WHERE')
        values.insert(0, error)
    
    cursor.execute(query, values)
    conn.commit()
    cursor.close()


def insert_product_candidates(conn, ocr_job_id: str, candidates: List[Dict]):
    """Insert product candidates into database"""
    cursor = conn.cursor()
    
    for candidate in candidates:
        query = """
            INSERT INTO product_candidates 
            (id, ocr_job_id, raw_json, confidence, extracted_title, extracted_price, extracted_sku)
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s)
        """
        
        values = (
            ocr_job_id,
            json.dumps(candidate),
            candidate.get('confidence', 0),
            candidate.get('title', ''),
            candidate.get('price'),
            candidate.get('sku'),
        )
        
        cursor.execute(query, values)
    
    conn.commit()
    cursor.close()


@app.task(bind=True)
def process_ocr_job(self, media_id: str, ocr_job_id: str, file_url: str, file_type: str = 'pdf'):
    """
    Main OCR processing task
    
    Args:
        media_id: UUID of the media file
        ocr_job_id: UUID of the OCR job
        file_url: Presigned URL or path to the file
        file_type: Type of file (pdf, image)
    """
    try:
        logger.info(f"Starting OCR job {ocr_job_id} for media {media_id}")
        
        # Get database connection
        conn = self.get_db_connection()
        
        # Update job status to processing
        update_ocr_job_status(conn, ocr_job_id, 'processing')
        
        # Download file from MinIO
        bucket = os.getenv('MINIO_BUCKET', 'angebae-media')
        # Extract key from URL - for now assume it's passed directly
        minio_key = file_url.split('/')[-1] if 'minio_key' not in file_url else file_url
        
        # Get the media info from DB to find minio_key
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT minio_key FROM media WHERE id = %s", (media_id,))
        media_row = cursor.fetchone()
        cursor.close()
        
        if not media_row:
            update_ocr_job_status(conn, ocr_job_id, 'failed', error='Media not found')
            return {'status': 'failed', 'error': 'Media not found'}
        
        minio_key = media_row['minio_key']
        
        # Download file
        logger.info(f"Downloading {minio_key} from MinIO")
        file_bytes = download_file_from_minio(bucket, minio_key)
        
        # Extract text from PDF
        logger.info(f"Extracting text from {file_type} file")
        pages = extract_text_from_pdf(file_bytes)
        
        # Extract product candidates from all pages
        all_candidates = []
        for page in pages:
            text = page.get('text', '') or page.get('ocr_text', '')
            if text:
                candidates = extract_product_info(text)
                all_candidates.extend(candidates)
        
        logger.info(f"Found {len(all_candidates)} product candidates")
        
        # Save candidates to database
        if all_candidates:
            insert_product_candidates(conn, ocr_job_id, all_candidates)
        
        # Update job result
        result = {
            'total_pages': len(pages),
            'candidates_found': len(all_candidates),
            'pages': pages,
            'candidates': all_candidates,
        }
        
        update_ocr_job_status(conn, ocr_job_id, 'done', result=result)
        
        logger.info(f"OCR job {ocr_job_id} completed successfully")
        return {'status': 'done', 'candidates': len(all_candidates)}
        
    except Exception as e:
        logger.error(f"OCR job {ocr_job_id} failed: {str(e)}", exc_info=True)
        
        try:
            conn = self.get_db_connection()
            update_ocr_job_status(conn, ocr_job_id, 'failed', error=str(e))
        except Exception as db_err:
            logger.error(f"Failed to update job status: {str(db_err)}")
        
        raise


# Celery beat task for cleanup (optional)
@app.task
def cleanup_old_jobs():
    """Clean up old OCR jobs (older than 30 days)"""
    try:
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        query = """
            DELETE FROM ocr_jobs 
            WHERE created_at < NOW() - INTERVAL '30 days'
            AND status IN ('done', 'failed')
        """
        
        cursor.execute(query)
        conn.commit()
        
        deleted = cursor.rowcount
        cursor.close()
        
        logger.info(f"Cleaned up {deleted} old OCR jobs")
        return {'deleted': deleted}
        
    except Exception as e:
        logger.error(f"Cleanup job failed: {str(e)}")
        raise
