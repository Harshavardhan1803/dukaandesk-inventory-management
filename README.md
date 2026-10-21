# DukaanDesk v1.0 · Kirana Edition

DukaanDesk is a responsive retail inventory and point-of-sale (POS) web application designed for small shops. It allows users to manage products, track stock levels, process sales, and generate print-friendly receipts.

**Live Demo:** https://dukaandesk-inventory-management-18s.vercel.app/

## Features
* **Product Management:** Full CRUD operations with SKU validation and low-stock indicators.
* **Point of Sale (POS):** Cart and checkout flow with automatic stock deduction.
* **Sales Analytics:** Dashboard featuring 7-day sales charts, revenue tracking, and inventory valuation.
* **Data Management:** Export and import JSON backups of inventory and sales data.
* **Print-Ready:** Dedicated print CSS for generating clean, thermal-printer-friendly receipts.

## Technical Details
* **Frontend:** React, Vite, Tailwind CSS
* **Storage:** Data is stored locally in the browser using `localStorage`. There is no remote database or cloud synchronization, meaning data remains private to the device.
* **Deployment:** Hosted on Vercel.
