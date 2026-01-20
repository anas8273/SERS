# SERS Technical Requirements & Infrastructure

## 1. Gemini AI Integration

### 1.1 Rate Limiting Strategy

| Limit Type | Value | Scope |
|------------|-------|-------|
| Per User (RPM) | 10 requests/min | Authenticated users |
| Per User (RPD) | 100 requests/day | Authenticated users |
| Global (RPM) | 60 requests/min | All users combined |
| Cooldown | 30 seconds | After limit exceeded |

**Implementation:**
```php
// Laravel Middleware
Route::middleware(['auth:sanctum', 'throttle:ai_requests'])
    ->prefix('ai')
    ->group(function () {
        // AI routes
    });

// config/cache.php - Redis for rate limiting
'ai_rate_limit' => [
    'driver' => 'redis',
    'connection' => 'default',
]
```

### 1.2 Prompt Engineering Architecture

```
┌─────────────────────────────────────────────────────┐
│                  SYSTEM PROMPT                      │
│  "You are an AI assistant for Saudi educators.     │
│   Generate culturally appropriate content."         │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│                  CONTEXT LAYER                      │
│  Template: {template_name}                          │
│  Subject: {subject} | Grade: {grade}                │
│  Language: {ar/en}                                  │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│                  USER REQUEST                       │
│  Field: {field_name}                                │
│  Current Values: {json}                             │
│  Instruction: {user_prompt}                         │
└─────────────────────────────────────────────────────┘
```

### 1.3 Secure API Handling

- **API Key Storage:** Laravel `.env` file only (`GEMINI_API_KEY`)
- **Never expose to frontend:** All AI calls go through backend proxy
- **Request sanitization:** Strip HTML, limit input length (1000 chars max)
- **Response validation:** Verify JSON structure before returning to client

---

## 2. Hybrid Database (MySQL + Firestore)

### 2.1 Data Distribution

| Data Type | Primary Storage | Real-time Sync |
|-----------|----------------|----------------|
| Users | MySQL | ❌ |
| Templates | MySQL | ❌ |
| Orders | MySQL | ❌ |
| User Template Data | MySQL | ✅ Firestore |
| Collaboration State | Firestore | N/A |
| User Presence | Firestore | N/A |

### 2.2 UUID Synchronization Logic

```
MySQL                          Firestore
┌──────────────────┐          ┌──────────────────┐
│ user_template_data│          │ /user_templates/ │
│ id: uuid         │◀────────▶│ {uuid}/          │
│ data: json       │          │   data: {...}    │
│ updated_at       │          │   synced_at      │
└──────────────────┘          └──────────────────┘
         │                              │
         └──────────┬───────────────────┘
                    │
        ┌───────────▼───────────┐
        │   Sync Service        │
        │   - On save: MySQL→FB │
        │   - On conflict: LWW  │
        │   - Periodic: Verify  │
        └───────────────────────┘
```

**Conflict Resolution:** Last Write Wins (LWW) with `updated_at` timestamp comparison.

---

## 3. Production Hosting Architecture

### 3.1 Recommended Stack

| Component | Service | Rationale |
|-----------|---------|-----------|
| **Frontend** | Vercel | Next.js native, edge functions, free tier |
| **Backend** | DigitalOcean App Platform | Laravel support, $5/mo starter |
| **Database** | DigitalOcean Managed MySQL | Auto-backups, $15/mo |
| **Cache** | Redis (DigitalOcean) | AI response caching, $10/mo |
| **Storage** | DigitalOcean Spaces | S3-compatible, $5/mo |
| **Real-time** | Firebase (Free tier) | Firestore included |
| **AI** | Google Cloud (Gemini API) | Pay-per-use |

### 3.2 Architecture Diagram

```
Internet
    │
    ▼
┌─────────────────────────────────────────────┐
│            Cloudflare (DNS + CDN)           │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌─────────────┐       ┌─────────────┐
│   Vercel    │       │ DigitalOcean│
│  (Next.js)  │◀─────▶│  (Laravel)  │
└─────────────┘       └──────┬──────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────┐      ┌─────────────┐     ┌─────────────┐
│   MySQL     │      │    Redis    │     │   Spaces    │
│  (Primary)  │      │   (Cache)   │     │  (Storage)  │
└─────────────┘      └─────────────┘     └─────────────┘
```

### 3.3 Environment Variables

```env
# Production .env
APP_ENV=production
APP_DEBUG=false

# Database
DB_CONNECTION=mysql
DB_HOST=db-mysql-xxx.ondigitalocean.com
DB_PORT=25060
DB_DATABASE=sers_production
DB_USERNAME=doadmin
DB_PASSWORD=<secure>

# Redis
REDIS_HOST=redis-xxx.ondigitalocean.com
REDIS_PASSWORD=<secure>
REDIS_PORT=25061

# Storage
FILESYSTEM_DISK=do_spaces
DO_SPACES_KEY=<key>
DO_SPACES_SECRET=<secret>
DO_SPACES_ENDPOINT=https://sgp1.digitaloceanspaces.com
DO_SPACES_BUCKET=sers-assets

# AI
GEMINI_API_KEY=<key>

# Firebase
FIREBASE_PROJECT_ID=sers-app
FIREBASE_CREDENTIALS=storage/firebase-credentials.json
```

---

## 4. Estimated Monthly Costs

| Service | Tier | Cost (USD) |
|---------|------|------------|
| Vercel | Pro | $20 |
| DigitalOcean App | Basic | $12 |
| MySQL | Basic | $15 |
| Redis | Basic | $10 |
| Spaces | 250GB | $5 |
| Firebase | Free | $0 |
| Gemini API | ~10K calls | ~$10 |
| **Total** | | **~$72/mo** |
