# Product Requirements Document (PRD) - Backend API
**Project:** Registration Form & Coupon Management System
**Tech Stack:** Laravel (Latest), PostgreSQL, Laravel Sanctum (API Auth)
**Target Developer:** AI Coding Agent

## 1. System Context & Instructions for AI Agent
- Build a RESTful API returning JSON responses exclusively.
- Use `FormRequest` classes for all endpoint validations.
- Use Eloquent ORM and Database Transactions for critical operations to ensure data integrity.
- Reference the file `list-tmp.MD` verbatim for any additional hardcoded list requirements or temporary structural reference points during development.

## 2. Database Schema (PostgreSQL)
Create migrations and models for the following tables. Ensure foreign keys and indexes are properly set.

### 2.1. Table: `schools`
Reference table for dropdown population.
- `id`: `BIGSERIAL` (Primary Key)
- `name`: `VARCHAR(255)` (Index)
- `created_at`, `updated_at`: `TIMESTAMP`

### 2.2. Table: `admins`
Authentication table for admin users.
- `id`: `BIGSERIAL` (Primary Key)
- `name`: `VARCHAR(255)`
- `username`: `VARCHAR(100)` (Unique, Index)
- `password`: `VARCHAR(255)` (Bcrypt hashed)
- `remember_token`: `VARCHAR(100)` (Nullable)
- `created_at`, `updated_at`: `TIMESTAMP`

### 2.3. Table: `participants`
Main table storing registration and coupon data.
- `id`: `BIGSERIAL` (Primary Key)
- `role`: `VARCHAR(50)` (Enum/Check: 'siswa', 'guru_pendamping')
- `name`: `VARCHAR(255)`
- `identity_number`: `VARCHAR(50)` (NISN/NIP)
- `school_id`: `BIGINT` (Foreign Key -> `schools.id`, Constrained, Restrict on Delete)
- `trial_class`: `VARCHAR(50)` (Enum/Check: 'IT', 'DKV', 'KULINER', 'MOBILE_LEGENDS')
- `referral_source`: `VARCHAR(100)`
- `referral_detail`: `VARCHAR(100)` (Nullable)
- `coupon_code`: `VARCHAR(20)` (Unique, Index)
- `is_redeemed`: `BOOLEAN` (Default: false)
- `redeemed_at`: `TIMESTAMP` (Nullable)
- `redeemed_by`: `BIGINT` (Nullable, Foreign Key -> `admins.id`, Set Null on Delete)
- `created_at`, `updated_at`: `TIMESTAMP`

---

## 3. API Endpoints Specification

### 3.1. Public Endpoints (No Auth Required)

#### `GET /api/schools`
- **Description:** Retrieve list of schools for frontend dropdown.
- **Response:** `200 OK` with JSON array of `{id, name}`.

#### `POST /api/register`
- **Description:** Handle user registration and generate coupon.
- **Validation Rules:**
  - `role`: `required|in:siswa,guru_pendamping`
  - `name`: `required|string|max:255`
  - `identity_number`: `required|string|max:50`
  - `school_id`: `required|exists:schools,id`
  - `trial_class`: `required|in:IT,DKV,KULINER,MOBILE_LEGENDS`
  - `referral_source`: `required|string`
  - `referral_detail`: `required_if:referral_source,Medsos,Banner,Event|string|nullable`
- **Action:** Execute **Core Logic 4.1**.
- **Response:** `201 Created`, return participant data including `coupon_code`.

### 3.2. Admin Endpoints (Protected by Sanctum Middleware: `auth:sanctum`)

#### `POST /api/admin/login` (Unprotected)
- **Validation:** `username`, `password`
- **Response:** Return plain-text Sanctum token.

#### `POST /api/admin/coupons/scan`
- **Description:** Redeem a coupon code (via Barcode scanner or manual input).
- **Validation Rules:** `coupon_code`: `required|string|exists:participants,coupon_code`
- **Action:** Execute **Core Logic 4.2**.
- **Response:**
  - `200 OK`: "Coupon successfully redeemed"
  - `422 Unprocessable Entity`: "Coupon has already been redeemed"

#### `GET /api/admin/participants`
- **Description:** List all participants.
- **Query Params:** Support pagination, filtering by `is_redeemed`, and searching by `name` or `coupon_code`.

#### `POST /api/admin/participants`
- **Description:** Manual registration by admin.
- **Rules:** Same as `/api/register`.

#### `DELETE /api/admin/participants/{id}`
- **Description:** Delete a participant.
- **Action:** Check if participant exists, then delete.

---

## 4. Core Business Logic (Strict Implementation)

### 4.1. Coupon Code Auto-Generation
**Rule:** Format must be `ABSC-XXXX` where `XXXX` is a 4-digit sequential number starting from `0001`.
**AI Implementation Directive:**
Inside the registration transaction, query the latest `coupon_code` where the prefix is `ABSC-`.
Extract the numeric part, increment by 1, and pad with leading zeros using `str_pad($nextNumber, 4, '0', STR_PAD_LEFT)`. If no previous record exists, default to `ABSC-0001`. Apply an exclusive lock (`lockForUpdate()`) on the table or use DB transaction isolation to prevent race conditions during generation.

### 4.2. Anti-Double Scan Mechanism (Concurrency Control)
**Rule:** A coupon must NEVER be redeemed twice, even under heavy concurrent requests.
**AI Implementation Directive:**
When redeeming `/api/admin/coupons/scan`, use Pessimistic Locking:
```php
DB::transaction(function () use ($couponCode, $adminId) {
    $participant = Participant::where('coupon_code', $couponCode)
                              ->lockForUpdate()
                              ->firstOrFail();

    if ($participant->is_redeemed) {
        abort(422, 'Kupon sudah di-scan sebelumnya.');
    }

    $participant->update([
        'is_redeemed' => true,
        'redeemed_at' => now(),
        'redeemed_by' => $adminId,
    ]);
});
```

## 5. Development Steps for AI
1. Initialize Laravel project and configure `pgsql` connection.
2. Install Laravel Sanctum.
3. Generate Migrations based on Section 2.
4. Generate Models with proper relationships and `$fillable` properties.
5. Create `FormRequest` classes for validation.
6. Create `ParticipantController`, `SchoolController`, and `AdminAuthController`.
7. Define `routes/api.php`.
8. Write basic Feature Tests (PHPUnit/Pest) to verify auto-generation and anti-double scan logic.