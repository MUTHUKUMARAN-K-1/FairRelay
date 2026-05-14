# 🚛 Hyper-Local Logistics & Relay Optimizer

An advanced, end-to-end logistics orchestration platform designed to maximize truck utilization and driver efficiency. This project features a unique **Driver Relay (Handshake) System** and an automated, API-free **e-Way Bill Generator**.

---

## 🌟 Key Features

### 🔄 Driver Relay & Workload Balancing
Intelligent assignment logic based on custom business rules:
* **Experience-Based Assignment:** Automatically matches long-haul missions (e.g., >300km) with experienced drivers (high historical `totalDistanceKm`).
* **Workload Balancing:** Assigns shorter missions to newer drivers to ensure a fair and safe distribution of labor.
* **ID Resolution:** Dispatchers use "Human-Readable" identifiers like **Phone Numbers** and **License Plates** instead of complex Database UUIDs.

### 🤝 Absorption Handshake System
A peer-to-peer "handover" mechanism allowing trucks to exchange goods at virtual hubs:
* **Offline Verification:** Supports a "Digital Handshake" via cryptographic QR codes for areas with zero cellular connectivity.
* **Dual-Bill Updates:** Automatically handles the transfer of responsibility between an "Exporter" driver and an "Importer" driver.

### 📄 Dynamic e-Way Bill Mimicry
Generates professional e-Way Bills using **Node.js & Puppeteer**:
* **No External APIs:** Mimics the official government layout purely via HTML/CSS.
* **Auto-Data Resolution:** Fetches GSTINs (Supplier/Recipient), License Plates, and Phone Numbers automatically from the database.
* **Dual Generation:** Produces two updated PDFs (for both trucks) instantly during an absorption event, delivered in a single `.zip` file.

---

## 🏗️ Technical Architecture



### **Tech Stack**
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (Optimized with Prisma ORM)
* **PDF Engine:** Puppeteer (Headless Chrome for high-fidelity rendering)
* **Auth:** JWT with Role-Based Access Control (RBAC)
* **File Handling:** `archiver` for ZIP generation and `qrcode` for local QR generation.

---

## 📂 Project Structure

```text
├── config/
│   └── prisma.js               # Prisma Client initialization
├── controllers/
│   ├── routeController.js      # Relay logic & assignment
│   └── ewayBillController.js   # PDF generation & absorption logic
├── services/
│   ├── puppeteer.service.js    # PDF rendering engine (Virtual Printer)
│   └── qr.service.js           # Base64 QR code generation
├── templates/
│   └── ewayBill.html           # HTML layout mimicking official format
├── public/
│   └── css/ewayBill.css        # Print-optimized styles (@media print)
├── routes/
│   └── api.js                  # Protected API endpoints
└── prisma/
    └── schema.prisma           # Relational Database Models