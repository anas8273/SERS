
<div align="center">
  <img src="https://via.placeholder.com/1200x400/2563EB/FFFFFF?text=SERS+-+Smart+Educational+Records+System" alt="SERS Banner" style="border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

  # SERS - Smart Educational Records System
  ### نظام السجلات التعليمية الذكي

  [![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
  [![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
  [![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
  [![Firebase](https://img.shields.io/badge/Firebase-Supported-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)

  <p align="center">
    <b>A modern, AI-powered platform for managing educational resources, records, and templates.</b>
    <br />
    Designed for the future of education.
  </p>
</div>

---

## 🚀 Key Features

### 🧠 Smart & AI-Powered
- **AI Template Editor:** Intelligent suggestions for completing educational records.
- **Related Products:** Smart recommendation engine based on categories and user behavior.
- **Search:** Instant search results powered by optimized queries.

### 🌐 Hybrid Database System
- **Structured Data:** Uses MySQL for relational data (Orders, Users, Payments).
- **Flexible Data:** Uses Firebase/NoSQL concepts for dynamic templates and records.

### 🛍️ Complete Marketplace
- **Digital Delivery:** Instant secure downloads for purchased files.
- **Interactive Templates:** Fillable forms that work directly in the browser.
- **Secure Payments:** Integrated payment flow simulation.

### 🎨 Modern Experience
- **Adaptive UI:** Beautiful Dark/Light mode support.
- **Responsive Design:** Works perfectly on mobile, tablet, and desktop.
- **Toast Notifications:** Standardized user feedback system.

### 🛡️ Powerful Admin Panel
- **Analytics:** Visual charts for sales and user growth.
- **Management:** Full control over Users, Products, Orders, and Reviews.
- **Audit Logs:** Track who did what and when.

---

## 🛠️ Installation Guide

Follow these steps to get the project running locally.

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL Server

### 1. Backend Setup (Laravel)
```bash
cd backend
cp .env.example .env
# Configure your database settings in .env
composer install
php artisan key:generate
php artisan migrate --seed # This installs the DB and creates dummy data
php artisan serve
```
*The backend will start at `http://localhost:8000`*

### 2. Frontend Setup (Next.js)
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
*The frontend will start at `http://localhost:3000`*

---

## 🔑 Default Credentials

The system comes pre-loaded with users for testing.

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@sers.com` | `password` |
| **Teacher** | `teacher@sers.com` | `password` |
| **Parent** | `user@sers.com` | `password` |

---

## 👨‍💻 Technical Architecture

SERS is built as a specialized Monorepo:
- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS.
- **Backend:** Laravel 11 API, Sanctum Authentication, MySQL.
- **Communication:** RESTful API with Axios Interceptors.

---

## 📄 License
Graduation Project - All Rights Reserved.
