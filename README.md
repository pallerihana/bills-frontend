# 💼 CodeTantra Expense Management System – Frontend

A modern and responsive web application for managing **project expenses, employee bill submissions, company bills, proof documents, and expense reports**.

This frontend is part of the **CodeTantra Expense Management System**, providing separate interfaces for administrators and employees.

---

## ✨ Features

### 🔐 Authentication
- Secure administrator login
- JWT-based authentication
- Protected application routes
- Automatic logout for unauthorized sessions

### 📊 Dashboard
- View project and expense information
- Monitor employee and company expenses
- Access project-related activities and reports

### 📁 Project Management
- Create and manage projects
- Add college name, project dates, and subject details
- Configure employee expense submission deadlines
- Manage project employees

### 🧾 Employee Expense Bills
- Submit project-related expense bills
- Add expense date, reason, members, paid-by details, and amount
- Upload multiple proof files for a single bill
- View previously submitted bills
- Mobile-friendly bill submission experience

### 🏢 Company Bills
- Manage company-related expenses separately
- Dedicated company bill numbering
- View employee expense totals and company expense totals
- Calculate the overall grand total

### 📎 Proof Management
- Preview uploaded proof documents
- Support for multiple proofs per bill
- Secure proof access through the backend API

### 📈 Reports
- View expense summaries
- Employee-wise reimbursement information
- Export project expense data and reports

### 📱 Responsive Design
- Optimized for desktop and mobile devices
- Camera and gallery support for mobile proof uploads
- Clean and user-friendly interface

---

## 🛠️ Tech Stack

- **React**
- **Vite**
- **React Router**
- **Axios**
- **Bootstrap**
- **React Bootstrap**
- **React Icons**

---

## 📁 Project Structure

```text
frontend/
│
├── public/
│   └── _redirects        # Netlify React Router configuration
│
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Application pages
│   ├── services/         # API services
│   └── main.jsx          # Application entry point
│
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/pallerihana/bills-frontend.git
cd bills-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:5000/api
```

For production, configure the API URL in your hosting platform:

```env
VITE_API_URL=https://your-backend-url.onrender.com/api
```

> ⚠️ Environment variables starting with `VITE_` are exposed to the browser. Never store passwords, API secrets, or private keys in frontend environment variables.

---

## ▶️ Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at the local URL shown by Vite, usually:

```text
http://localhost:5173
```

### Production Build

```bash
npm run build
```

The production-ready files will be generated in the `dist` folder.

---

## 🌐 Deployment

The frontend is configured for deployment on **Netlify**.

### Netlify Configuration

```text
Build Command:       npm run build
Publish Directory:   dist
```

### React Router Configuration

The project includes:

```text
public/_redirects
```

With:

```text
/* /index.html 200
```

This ensures that direct links and page refreshes work correctly with React Router.

---

## 🔗 Application Architecture

```text
                 🌐 Frontend
                  Netlify
                     │
                     ▼
              REST API (Axios)
                     │
                     ▼
                 🚀 Backend
                  Render
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       MongoDB    Cloudinary   EmailJS
```

---

## 🔒 Security Notes

- JWT tokens are sent through authenticated API requests.
- Sensitive credentials are stored only on the backend.
- Frontend environment variables must not contain private API keys or secrets.
- The backend handles database, Cloudinary, and email credentials securely.

---

## 👨‍💻 Author

**Palle Anil**

Technical Trainer | Full Stack Developer

---

⭐ If you find this project useful, feel free to star the repository!
