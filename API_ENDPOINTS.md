/**
 * API Endpoints Reference
 * Complete list of all available backend endpoints
 * 
 * This file serves as a reference. For implementation details, see BACKEND.md
 */

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * POST /api/admin/login
 * Admin login - returns JWT token and admin info
 * 
 * Request:
 *   {
 *     "email": "admin@angebae.local",
 *     "password": "password123"
 *   }
 * 
 * Response (200):
 *   {
 *     "admin": {
 *       "id": "uuid",
 *       "email": "admin@angebae.local",
 *       "name": "admin",
 *       "active": true
 *     },
 *     "token": "jwt-token"
 *   }
 * 
 * Sets cookie: admin_auth (httpOnly, 24h)
 */
export const ADMIN_LOGIN = 'POST /api/admin/login';

/**
 * POST /api/admin/logout
 * Admin logout - clears authentication cookie
 * 
 * Response (200):
 *   {
 *     "success": true,
 *     "message": "Logged out successfully"
 *   }
 */
export const ADMIN_LOGOUT = 'POST /api/admin/logout';

// ============================================================================
// MEDIA ENDPOINTS
// ============================================================================

/**
 * POST /api/media/upload
 * Upload media file (image, PDF, video) to MinIO storage
 * 
 * Auth: Required (admin_auth cookie)
 * 
 * Body (multipart/form-data):
 *   - file: File (binary)
 *   - type: "image" | "pdf" | "video"
 *   - productId (optional): "uuid"
 * 
 * Response (201):
 *   {
 *     "success": true,
 *     "media": {
 *       "id": "uuid",
 *       "type": "pdf",
 *       "url": "/api/media/uuid",
 *       "minioKey": "pdfs/timestamp-id.pdf",
 *       "fileSize": 1048576,
 *       "mimeType": "application/pdf",
 *       "productId": null
 *     }
 *   }
 * 
 * Max file size: 100MB
 * Allowed types: image, pdf, video
 */
export const MEDIA_UPLOAD = 'POST /api/media/upload';

/**
 * GET /api/media/:id
 * Get media file (streams from MinIO)
 * 
 * Response: File content (binary)
 */
export const MEDIA_GET = 'GET /api/media/:id';

// ============================================================================
// OCR PROCESSING ENDPOINTS
// ============================================================================

/**
 * POST /api/ocr/enqueue
 * Enqueue a PDF file for OCR processing
 * 
 * Auth: Required (admin_auth cookie)
 * 
 * Request:
 *   {
 *     "mediaId": "uuid"
 *   }
 * 
 * Response (201):
 *   {
 *     "success": true,
 *     "ocrJob": {
 *       "id": "uuid",
 *       "status": "pending",
 *       "mediaId": "uuid",
 *       "jobQueueId": 1,
 *       "createdAt": "2024-02-17T10:30:00Z"
 *     }
 *   }
 * 
 * Status values: pending, processing, done, failed
 */
export const OCR_ENQUEUE = 'POST /api/ocr/enqueue';

/**
 * GET /api/ocr/jobs/:id
 * Get OCR job status and results
 * 
 * Response (200):
 *   {
 *     "id": "uuid",
 *     "mediaId": "uuid",
 *     "status": "done",
 *     "result": {
 *       "totalPages": 5,
 *       "candidatesFound": 12,
 *       "candidates": [
 *         {
 *           "title": "Product Name",
 *           "price": 99.99,
 *           "sku": "SKU123",
 *           "confidence": 0.85
 *         }
 *       ]
 *     },
 *     "createdAt": "2024-02-17T10:30:00Z",
 *     "completedAt": "2024-02-17T10:45:00Z"
 *   }
 */
export const OCR_GET_JOB = 'GET /api/ocr/jobs/:id';

/**
 * GET /api/ocr/jobs
 * List all OCR jobs with pagination and filtering
 * 
 * Query params:
 *   - status: "pending" | "processing" | "done" | "failed"
 *   - limit: number (default: 50)
 *   - offset: number (default: 0)
 *   - sortBy: "createdAt" | "updatedAt" (default: createdAt)
 *   - order: "asc" | "desc" (default: desc)
 * 
 * Response (200):
 *   {
 *     "jobs": [...],
 *     "total": 100,
 *     "limit": 50,
 *     "offset": 0
 *   }
 */
export const OCR_LIST_JOBS = 'GET /api/ocr/jobs';

/**
 * GET /api/ocr/candidates
 * Get product candidates from OCR results
 * 
 * Auth: Required (admin_auth cookie)
 * 
 * Query params:
 *   - resolved: "true" | "false"
 *   - confidenceMin: number (0-1)
 *   - limit: number
 *   - offset: number
 * 
 * Response (200):
 *   {
 *     "candidates": [
 *       {
 *         "id": "uuid",
 *         "ocrJobId": "uuid",
 *         "extractedTitle": "Product Name",
 *         "extractedPrice": 99.99,
 *         "extractedSku": "SKU123",
 *         "confidence": 0.85,
 *         "resolved": false
 *       }
 *     ],
 *     "total": 45
 *   }
 */
export const OCR_LIST_CANDIDATES = 'GET /api/ocr/candidates';

/**
 * PATCH /api/ocr/candidates/:id
 * Approve/reject product candidate and optionally create product
 * 
 * Auth: Required (admin_auth cookie)
 * 
 * Request:
 *   {
 *     "resolved": true,
 *     "createProduct": true,
 *     "productData": {
 *       "title": "Product",
 *       "price": 99.99,
 *       "sku": "SKU123"
 *     }
 *   }
 * 
 * Response (200):
 *   {
 *     "success": true,
 *     "candidate": { ... },
 *     "productId": "uuid" (optional)
 *   }
 */
export const OCR_APPROVE_CANDIDATE = 'PATCH /api/ocr/candidates/:id';

// ============================================================================
// PRODUCT ENDPOINTS
// ============================================================================

/**
 * GET /api/products
 * List all products with filters and full-text search
 * 
 * Query params:
 *   - q: search query (full-text search)
 *   - category: category uuid
 *   - active: "true" | "false"
 *   - limit: number (default: 20)
 *   - offset: number (default: 0)
 *   - sortBy: "createdAt" | "price" | "title"
 *   - order: "asc" | "desc"
 * 
 * Response (200):
 *   {
 *     "products": [...],
 *     "total": 100,
 *     "limit": 20,
 *     "offset": 0
 *   }
 */
export const PRODUCTS_LIST = 'GET /api/products';

/**
 * POST /api/products
 * Create new product
 * 
 * Auth: Required (admin_auth cookie)
 * 
 * Request:
 *   {
 *     "title": "Product Name",
 *     "description": "Description",
 *     "sku": "SKU123",
 *     "categoryId": "uuid",
 *     "price": 99.99,
 *     "stock": 10,
 *     "attributes": { ... }
 *   }
 * 
 * Response (201):
 *   {
 *     "id": "uuid",
 *     "title": "Product Name",
 *     "sku": "SKU123",
 *     "createdAt": "2024-02-17T10:30:00Z"
 *   }
 */
export const PRODUCTS_CREATE = 'POST /api/products';

/**
 * GET /api/products/:id
 * Get product details with variants
 * 
 * Response (200):
 *   {
 *     "id": "uuid",
 *     "title": "Product Name",
 *     "sku": "SKU123",
 *     "description": "...",
 *     "category": { ... },
 *     "variants": [...],
 *     "media": [...],
 *     "createdAt": "..."
 *   }
 */
export const PRODUCTS_GET = 'GET /api/products/:id';

/**
 * PUT /api/products/:id
 * Update product
 * 
 * Auth: Required (admin_auth cookie)
 * 
 * Request: (partial) same as POST /api/products
 * 
 * Response (200):
 *   {
 *     "success": true,
 *     "product": { ... }
 *   }
 */
export const PRODUCTS_UPDATE = 'PUT /api/products/:id';

/**
 * DELETE /api/products/:id
 * Delete product
 * 
 * Auth: Required (admin_auth cookie)
 * 
 * Response (200):
 *   {
 *     "success": true,
 *     "message": "Product deleted"
 *   }
 */
export const PRODUCTS_DELETE = 'DELETE /api/products/:id';

// ============================================================================
// CATEGORY ENDPOINTS
// ============================================================================

/**
 * GET /api/categories
 * List all categories
 * 
 * Query params:
 *   - parentId: uuid (filter by parent)
 *   - active: "true" | "false"
 * 
 * Response (200):
 *   {
 *     "categories": [
 *       {
 *         "id": "uuid",
 *         "name": "Category",
 *         "slug": "category",
 *         "children": [...]
 *       }
 *     ]
 *   }
 */
export const CATEGORIES_LIST = 'GET /api/categories';

/**
 * POST /api/categories
 * Create new category
 * 
 * Auth: Required (admin_auth cookie)
 */
export const CATEGORIES_CREATE = 'POST /api/categories';

/**
 * PUT /api/categories/:id
 * Update category
 * 
 * Auth: Required (admin_auth cookie)
 */
export const CATEGORIES_UPDATE = 'PUT /api/categories/:id';

/**
 * DELETE /api/categories/:id
 * Delete category
 * 
 * Auth: Required (admin_auth cookie)
 */
export const CATEGORIES_DELETE = 'DELETE /api/categories/:id';

// ============================================================================
// ORDER ENDPOINTS
// ============================================================================

/**
 * GET /api/orders
 * List all orders
 * 
 * Auth: Required (admin_auth cookie)
 * 
 * Query params:
 *   - status: "pending" | "processing" | "completed" | "cancelled"
 *   - limit: number
 *   - offset: number
 *   - sortBy: "createdAt" | "total_amount"
 * 
 * Response (200):
 *   {
 *     "orders": [...],
 *     "total": 100
 *   }
 */
export const ORDERS_LIST = 'GET /api/orders';

/**
 * POST /api/orders
 * Create new order
 * 
 * Request:
 *   {
 *     "customerEmail": "customer@example.com",
 *     "customerName": "John Doe",
 *     "customerPhone": "+1234567890",
 *     "customerData": { ... },
 *     "items": [
 *       {
 *         "productId": "uuid",
 *         "quantity": 2,
 *         "unitPrice": 99.99
 *       }
 *     ],
 *     "shippingAddress": { ... },
 *     "totalAmount": 199.98
 *   }
 * 
 * Response (201):
 *   {
 *     "id": "uuid",
 *     "orderNumber": "ORD-001",
 *     "status": "pending",
 *     "totalAmount": 199.98,
 *     "createdAt": "..."
 *   }
 */
export const ORDERS_CREATE = 'POST /api/orders';

/**
 * GET /api/orders/:id
 * Get order details with items
 * 
 * Response (200):
 *   {
 *     "id": "uuid",
 *     "orderNumber": "ORD-001",
 *     "status": "pending",
 *     "customer": { ... },
 *     "items": [...],
 *     "totalAmount": 199.98,
 *     "createdAt": "..."
 *   }
 */
export const ORDERS_GET = 'GET /api/orders/:id';

/**
 * PATCH /api/orders/:id
 * Update order status
 * 
 * Auth: Required (admin_auth cookie)
 * 
 * Request:
 *   {
 *     "status": "completed"
 *   }
 * 
 * Response (200):
 *   {
 *     "success": true,
 *     "order": { ... }
 *   }
 */
export const ORDERS_UPDATE = 'PATCH /api/orders/:id';

// ============================================================================
// OFFER ENDPOINTS
// ============================================================================

/**
 * GET /api/offers
 * List active offers
 * 
 * Response (200):
 *   {
 *     "offers": [
 *       {
 *         "id": "uuid",
 *         "product": { ... },
 *         "offerPrice": 79.99,
 *         "startDate": "2024-02-17T00:00:00Z",
 *         "endDate": "2024-02-24T23:59:59Z"
 *       }
 *     ]
 *   }
 */
export const OFFERS_LIST = 'GET /api/offers';

/**
 * POST /api/offers
 * Create new offer
 * 
 * Auth: Required (admin_auth cookie)
 * 
 * Request:
 *   {
 *     "productId": "uuid",
 *     "offerPrice": 79.99,
 *     "startDate": "2024-02-17T00:00:00Z",
 *     "endDate": "2024-02-24T23:59:59Z"
 *   }
 */
export const OFFERS_CREATE = 'POST /api/offers';

/**
 * DELETE /api/offers/:id
 * Delete offer
 * 
 * Auth: Required (admin_auth cookie)
 */
export const OFFERS_DELETE = 'DELETE /api/offers/:id';

// ============================================================================
// SYSTEM ENDPOINTS
// ============================================================================

/**
 * GET /api/health
 * System health check
 * 
 * Response (200 if healthy, 503 if degraded):
 *   {
 *     "status": "ok" | "degraded",
 *     "timestamp": "2024-02-17T10:30:00Z",
 *     "services": {
 *       "database": "ok" | "down",
 *       "storage": "ok" | "down",
 *       "queue": "ok" | "down"
 *     }
 *   }
 */
export const HEALTH_CHECK = 'GET /api/health';

// ============================================================================
// WEBHOOK ENDPOINTS
// ============================================================================

/**
 * POST /api/mercadopago/webhook
 * MercadoPago payment status webhook
 * 
 * Triggered by external service
 */
export const MERCADOPAGO_WEBHOOK = 'POST /api/mercadopago/webhook';
