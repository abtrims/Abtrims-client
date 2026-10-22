# AB Trims — AI-Powered Multi-Vendor E-Commerce Platform

<div align="center">
  <img src="https://abtrims-client.vercel.app/logo.png" alt="AB Trims Logo" width="120" />
  <br />
  <br />

  [![Live Demo](https://img.shields.io/badge/Live%20Demo-abtrims.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://abtrims-client.vercel.app/)
  [![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)

  <p>A modern, full-stack multi-vendor e-commerce marketplace with AI-powered product content generation, role-based dashboards, and a real-time order management system.</p>
</div>

---

## 🌐 Live Demo

🔗 **[https://abtrims-client.vercel.app/](https://abtrims-client.vercel.app/)**

### 🔐 Demo Credentials

| Role            | Email                   | Password       |
|-----------------|-------------------------|----------------|
| 🛡️ Super Admin  | `superadmin@gmail.com`  | `password1234` |
| 🏪 Seller       | `seller@gmail.com`      | `password1234` |
| 👤 User         | `user@gmail.com`        | `password1234` |

> You can also use the **one-click demo login buttons** on the login page.

---

## 📖 Project Overview

**AB Trims** is a production-ready multi-vendor e-commerce platform where:
- **Customers** can browse products, manage their cart, place orders, and write reviews.
- **Sellers (Vendors)** can manage their own shop, add products (with AI assistance), and track order fulfillment.
- **Super Admins** have full control over users, shops, orders, categories, and platform analytics.

The platform features a custom **RAG-powered AI assistant chatbot** for customer queries, and an **AI content generator** that automatically writes SEO-friendly product descriptions for sellers.

---

## ✨ Key Features

### 👤 Customer
- Browse products by category with a rich, filterable UI
- Add to cart & checkout flow with district-based shipping
- Real-time order tracking dashboard
- Product review & rating system (available post-delivery)

### 🏪 Seller
- Dedicated seller dashboard with analytics
- Full product management (create, edit, delete)
- **AI-powered product description generator** ✨
- Order fulfillment status management

### 🛡️ Admin
- Full user, shop, and product moderation
- Order status management & payment tracking
- Category management (with sub-categories)
- Revenue analytics with interactive charts
- **AI-powered business insights analyzer** ✨

### 🤖 AI Features
- **AI Content Generator:** Sellers type a product name → AI automatically writes an SEO-optimized product description, short description, and tags using Google Gemini (via OpenRouter)
- **RAG Chatbot:** Customers can chat with an AI assistant that answers questions based on the actual product catalog using Retrieval-Augmented Generation (RAG)
- **AI Smart Recommendations:** Analyzes current product category and metadata to suggest the most relevant 4 products to users on details pages ✨
- **AI Business Data Analyzer:** Admins can generate professional business insights and strategic recommendations based on real-time sales and performance data ✨

---

## 🛠️ Tech Stack

| Category            | Technology                                      |
|---------------------|--------------------------------------------------|
| **Framework**       | Next.js 16 (App Router, Server Actions)          |
| **Language**        | TypeScript 5                                     |
| **Styling**         | Tailwind CSS v4, shadcn/ui                       |
| **State & Data**    | TanStack Query v5, TanStack Form v1              |
| **Tables**          | TanStack Table v8                                |
| **Auth**            | Better Auth (Session + JWT, Google OAuth)        |
| **Charts**          | Recharts                                         |
| **Icons**           | Lucide React                                     |
| **Notifications**   | Sonner                                           |
| **HTTP**            | Axios + custom Next.js proxy layer               |
| **Validation**      | Zod                                              |
| **AI**              | Google Gemini 2.0 Flash via OpenRouter API       |
| **Deployment**      | Vercel                                           |

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js `v18+`
- npm or yarn
- A running instance of the **AB Trims Backend** (see server repo)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/abtrims-client.git
cd abtrims-client
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Backend API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1

# Better Auth
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### 5. Build for Production

```bash
npm run build
npm run start
```

---

## 🤖 AI Integration Details

### Product Description Generator
When a seller adds a new product, they can click the **"✨ Generate With AI"** button next to the product name. The system:
1. Sends the product title to the backend `/api/v1/ai/generate-product-data` endpoint
2. The backend calls **Google Gemini 2.0 Flash** via **OpenRouter**
3. The AI returns an HTML-formatted description, short summary, and SEO tags
4. The form fields are auto-populated instantly

### RAG Chatbot
The platform includes a RAG (Retrieval-Augmented Generation) chatbot that:
1. Indexes all product data into a vector database
2. On user queries, retrieves semantically similar products
3. Passes relevant context to Gemini to generate accurate, grounded answers

### AI Smart Recommendations
Integrated into the Product Detail pages, this feature:
1. Takes the context of the currently viewed product (Category, Tags, Name)
2. Fetches 20+ candidate products from the same category
3. Uses Gemini to select the **TOP 4 most relevant** items (complementary or similar)
4. Displays them in a premium, glassmorphic UI section

### AI Business Data Analyzer
Located in the Admin Analytics Dashboard:
1. Aggregates marketplace data (Total Revenue, Category Performance, Seller Sales)
2. Feeds this context to Gemini with a specialized "Business Strategist" prompt
3. Generates professional HTML-formatted insights covering Sales Overview, Top Performers, and Actionable Strategic Recommendations

---

## 📁 Project Structure

```
abtrims-client/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (commonLayout)/     # Public pages (home, products, auth)
│   │   ├── (dashboardLayout)/  # Shared dashboard shell
│   │   ├── admin/              # Admin dashboard routes
│   │   ├── seller/             # Seller dashboard routes
│   │   └── dashboard/          # User dashboard routes
│   ├── components/
│   │   ├── modules/            # Feature-specific components
│   │   ├── shared/             # Reusable UI primitives & layout
│   │   └── ui/                 # shadcn/ui base components
│   ├── services/               # Server actions & API calls
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript interfaces
│   └── zod/                    # Form validation schemas
└── public/                     # Static assets
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  Made with ❤️ by <strong>Rizbi Ahmmad</strong>
</div>
