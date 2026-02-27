# SERS: Smart Educational Records System

**The Ultimate Dynamic Template Engine & E-commerce Platform**

**نظام السجلات والمستندات الذكي - المنصة الشاملة لإنشاء وتوثيق القوالب**

---

[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)

![SERS Hero Image](https://raw.githubusercontent.com/anas8273/SERS/main/docs/assets/sers-hero.png)

---

## 🚀 Project Vision / رؤية المشروع

**SERS (Smart Educational Records System)** is not just a static website; it is a powerful, enterprise-grade **Dynamic Template Engine & E-commerce Platform** built for the modern educational landscape. The core architectural principle is to build **ENGINES, not hardcoded pages**. This allows a non-technical administrator to create, manage, and sell an infinite number of completely different document templates (certificates, reports, worksheets, etc.) through a user-friendly admin panel without ever touching the source code.

Our vision is to replace rigid, outdated systems like "Noor" by providing a flexible, AI-powered, and scalable solution for generating and managing educational records in a fully digital, cloud-native environment.

---

## ✨ Core Features / الميزات الأساسية

| Feature | Description |
| :--- | :--- |
| 🎨 **Dynamic X/Y Template Mapper** | The heart of SERS. Admins can upload a background image/PDF, click anywhere to add dynamic fields (text, date, image, QR code), and map them to form inputs. All coordinates are saved as percentages for perfect responsiveness. |
| 🤖 **AI Assistant & Content Generation** | An integrated AI assistant helps users fill out forms by generating content, suggesting improvements, and even bulk-filling data based on simple prompts. |
| ⚙️ **Bulk Generation Engine** | Users can upload an Excel/CSV file, map its columns to a template's fields (with intelligent fuzzy matching), and generate hundreds of personalized documents (as a multi-page PDF or a ZIP of images) in a single click. |
| 📊 **Interactive Analytics Dashboard** | Upload student grade sheets (Excel/CSV) to get an instant, interactive dashboard with charts (Pie, Bar, Stacked), detailed stats, and an AI-powered textual analysis of class performance. |
|  híbrido **Hybrid Database (MySQL + Firestore)** | Combines the reliability of MySQL (for relational data like users, orders, and payments) with the flexibility of Firestore (for dynamic NoSQL data like `Template_Canvas` and `Dynamic_Forms` JSON). |
| 🔐 **Secure Authentication & Roles** | Robust authentication system with JWT, route protection via Next.js Middleware, and distinct roles for `Admin` and `User` (Teacher). |

---

## 🛠️ Tech Stack / التقنيات المستخدمة

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS (with `shadcn/ui` components)
- **State Management:** Zustand
- **Database (Hybrid):**
  - **Relational:** Laravel API with MySQL (Users, Orders, Subscriptions)
  - **NoSQL:** Firebase Firestore (`Template_Canvas`, `Dynamic_Forms`, `User_Records`)
- **File Storage:** Firebase Storage
- **PDF/Image Generation:** `html-to-image` + `jspdf` (Client-side, with robust Arabic/RTL support)
- **Excel/CSV Parsing:** `xlsx` & `papaparse`
- **Data Visualization:** `recharts`
- **Deployment:** Vercel

---

## 🏗️ System Architecture / البنية الهندسية للنظام

The architecture is designed for scalability and separation of concerns, utilizing a hybrid database model.

1.  **Next.js Frontend:** Serves the user-facing application, admin panel, and all interactive engines. It communicates with two separate backend services.
2.  **Laravel/MySQL Backend:** Acts as the primary API for all **relational data**. It handles user authentication, subscription management, order processing, and stores basic metadata for templates and services.
3.  **Firebase Backend (Firestore & Storage):** Acts as the **NoSQL data store** for all dynamic, unstructured, or large JSON data. This is critical for the template engine's flexibility.
    -   `Template_Canvas`: Stores the background image URL and an array of `CanvasElement` objects, each with its `x`, `y`, `width`, `height` (as percentages), font styles, and the `field_id` it maps to.
    -   `Dynamic_Forms`: Stores the JSON schema for the form that corresponds to a template, including field types, validation rules, and conditional visibility logic.
    -   `User_Records`: Stores the data entered by users for each document they generate, linking a `user_id` to a `template_id` and their `field_values`.

![SERS Architecture Diagram](https://raw.githubusercontent.com/anas8273/SERS/main/docs/assets/sers-architecture.png)

---

## 🚀 Getting Started / البدء والتشغيل

### Prerequisites

- Node.js (v18 or later)
- npm, pnpm, or yarn
- A running instance of the SERS Laravel API
- Firebase project credentials

### Installation & Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/anas8273/SERS.git
    cd SERS/frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the `frontend` directory and add your Firebase and API credentials:
    ```env
    # Firebase Config
    NEXT_PUBLIC_FIREBASE_API_KEY="..."
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
    NEXT_PUBLIC_FIREBASE_APP_ID="..."

    # Laravel API URL
    NEXT_PUBLIC_API_URL="http://localhost:8000"
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the application:**
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

This project was built with the assistance of **Anas-Alyuousfi**, an advanced AI development agent.
