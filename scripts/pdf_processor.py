import PyPDF2
import re
import json
import sys
from typing import List, Dict, Any
import logging
from difflib import SequenceMatcher

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFProductExtractor:
    def __init__(self):
        # Patrones regex para extraer información de productos
        self.price_patterns = [
            r'\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)',  # $1.500,00 o $1500
            r'(\d{1,3}(?:\.\d{3})*)\s*pesos',          # 1500 pesos
            r'precio[:\s]*\$?(\d{1,3}(?:\.\d{3})*)',   # precio: $1500
        ]
        
        self.product_indicators = [
            'serum', 'crema', 'limpiador', 'mascarilla', 'tónico', 'protector',
            'hidratante', 'antioxidante', 'vitamina', 'ácido', 'facial'
        ]
        
        self.category_keywords = {
            'serums': ['serum', 'sérum', 'suero'],
            'cremas': ['crema', 'hidratante', 'nutritiva'],
            'limpiadores': ['limpiador', 'gel', 'espuma', 'jabón'],
            'mascarillas': ['mascarilla', 'máscara', 'tratamiento'],
            'proteccion': ['protector', 'fps', 'solar', 'bloqueador'],
            'tonicos': ['tónico', 'astringente', 'equilibrante']
        }

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extrae texto de un archivo PDF"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text() + "\n"
                
                return text
        except Exception as e:
            logger.error(f"Error extrayendo texto del PDF: {e}")
            return ""

    def clean_text(self, text: str) -> str:
        """Limpia y normaliza el texto extraído"""
        # Remover caracteres especiales y normalizar espacios
        text = re.sub(r'\s+', ' ', text)
        text = text.replace('\n', ' ').replace('\r', ' ')
        return text.strip()

    def extract_price(self, text: str) -> float:
        """Extrae el precio de un texto"""
        for pattern in self.price_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                price_str = match.group(1).replace('.', '').replace(',', '.')
                try:
                    return float(price_str)
                except ValueError:
                    continue
        return 0.0

    def determine_category(self, product_name: str, description: str) -> str:
        """Determina la categoría del producto basado en palabras clave"""
        text = (product_name + " " + description).lower()
        
        for category, keywords in self.category_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    return category
        
        return 'otros'

    def similarity(self, a: str, b: str) -> float:
        """Calcula la similitud entre dos strings usando SequenceMatcher"""
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()

    def normalize_product_name(self, name: str) -> str:
        """Normaliza el nombre del producto para comparación"""
        # Remover caracteres especiales y convertir a minúsculas
        normalized = re.sub(r'[^\w\s]', '', name.lower())
        # Remover palabras comunes que no aportan al nombre del producto
        stop_words = ['ml', 'gr', 'gramos', 'mililitros', 'unidades', 'piezas']
        words = normalized.split()
        filtered_words = [word for word in words if word not in stop_words]
        return ' '.join(filtered_words)

    def detect_duplicates_in_batch(self, products: List[Dict[str, Any]], similarity_threshold: float = 0.8) -> List[Dict[str, Any]]:
        """Detecta duplicados dentro del mismo lote de productos extraídos"""
        processed_products = []
        
        for i, product in enumerate(products):
            is_duplicate = False
            normalized_name = self.normalize_product_name(product['name'])
            
            # Comparar con productos ya procesados
            for processed_product in processed_products:
                processed_normalized = self.normalize_product_name(processed_product['name'])
                
                # Calcular similitud
                name_similarity = self.similarity(normalized_name, processed_normalized)
                
                # Considerar duplicado si:
                # 1. Los nombres son muy similares (>= threshold)
                # 2. Los precios son exactamente iguales o muy similares
                price_diff = abs(product['price'] - processed_product['price'])
                price_similarity = price_diff <= (product['price'] * 0.05)  # 5% de diferencia
                
                if name_similarity >= similarity_threshold and price_similarity:
                    is_duplicate = True
                    logger.info(f"Duplicado detectado: '{product['name']}' similar a '{processed_product['name']}' (similitud: {name_similarity:.2f})")
                    break
            
            # Agregar información de duplicado
            product['duplicate'] = is_duplicate
            product['confidence'] = 1.0 - (0.3 if is_duplicate else 0.0)  # Reducir confianza si es duplicado
            
            if not is_duplicate:
                processed_products.append(product)
        
        return products

    def extract_products_from_text(self, text: str) -> List[Dict[str, Any]]:
        """Extrae productos del texto del PDF"""
        products = []
        
        # Dividir el texto en secciones que podrían ser productos
        sections = re.split(r'\n\s*\n|\.\s*(?=[A-Z])', text)
        
        for section in sections:
            section = self.clean_text(section)
            
            # Verificar si la sección contiene indicadores de producto
            if not any(indicator in section.lower() for indicator in self.product_indicators):
                continue
            
            # Extraer nombre del producto (primera línea o frase principal)
            lines = section.split('.')
            product_name = lines[0].strip()
            
            # Si el nombre es muy corto o muy largo, intentar con la siguiente línea
            if len(product_name) < 10 or len(product_name) > 100:
                if len(lines) > 1:
                    product_name = lines[1].strip()
            
            # Extraer precio
            price = self.extract_price(section)
            
            # Si no hay precio, saltar este producto
            if price == 0.0:
                continue
            
            # Extraer descripción (resto del texto)
            description = section.replace(product_name, '').strip()
            if description.startswith('.'):
                description = description[1:].strip()
            
            # Limitar la descripción a una longitud razonable
            if len(description) > 300:
                description = description[:300] + "..."
            
            # Determinar categoría
            category = self.determine_category(product_name, description)
            
            # Crear el producto con confianza inicial
            product = {
                'name': product_name,
                'description': description,
                'price': price,
                'category': category,
                'stock': 10,  # Stock por defecto
                'is_active': True,
                'is_flash_sale': False,
                'is_best_seller': False,
                'confidence': 0.9,  # Confianza inicial alta
                'duplicate': False  # Se determinará después
            }
            
            products.append(product)
        
        # Detectar duplicados dentro del lote
        products = self.detect_duplicates_in_batch(products)
        
        return products

    def process_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """Procesa un PDF completo y extrae productos"""
        logger.info(f"Procesando PDF: {pdf_path}")
        
        # Extraer texto
        text = self.extract_text_from_pdf(pdf_path)
        if not text:
            return {
                'success': False,
                'error': 'No se pudo extraer texto del PDF',
                'products': []
            }
        
        # Extraer productos
        products = self.extract_products_from_text(text)
        
        # Estadísticas
        total_products = len(products)
        unique_products = len([p for p in products if not p['duplicate']])
        duplicate_products = total_products - unique_products
        
        logger.info(f"Productos extraídos: {total_products}")
        logger.info(f"Productos únicos: {unique_products}")
        logger.info(f"Duplicados detectados: {duplicate_products}")
        
        return {
            'success': True,
            'products': products,
            'total_products': total_products,
            'unique_products': unique_products,
            'duplicate_products': duplicate_products,
            'statistics': {
                'total': total_products,
                'unique': unique_products,
                'duplicates': duplicate_products,
                'duplicate_rate': (duplicate_products / total_products * 100) if total_products > 0 else 0
            }
        }

def main():
    """Función principal para usar desde línea de comandos"""
    if len(sys.argv) != 2:
        print("Uso: python pdf_processor.py <ruta_del_pdf>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    extractor = PDFProductExtractor()
    result = extractor.process_pdf(pdf_path)
    
    # Imprimir resultado como JSON
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
