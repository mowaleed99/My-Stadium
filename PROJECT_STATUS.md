# Al-Jarash Stadium (ملعب الجراش الخماسي) - Project Status

## Overview
**Al-Jarash Stadium** is a web-based booking and management system for a 5v5 football (soccer) pitch located in Tanta, Mahalla Marhoum. The application provides a public interface for customers to view availability and request bookings via WhatsApp, as well as an Admin dashboard for the stadium management to approve/reject bookings and view daily statistics.

## Tech Stack
*   **Frontend Framework**: React 19 + TypeScript
*   **Build Tool**: Vite 6
*   **Styling**: Tailwind CSS v4
*   **Icons**: Lucide React
*   **Calendar Component**: FullCalendar (`@fullcalendar/react`, daygrid, interaction plugins) & custom `AdminDatePicker`
*   **Backend / Database**: Google Apps Script acting as an API, backed by a Google Sheet.

## Current Application Features
1.  **Public Booking Flow**: 
    *   Displays a monthly calendar view showing days availability (Available, Partially Booked, Fully Booked).
    *   Users can select a day, choose a start time and duration (1, 1.5, or 2 hours).
    *   Submitting a booking creates a "pending" optimistic booking in the UI, sends the request to the Google Apps Script API, and redirects the user to WhatsApp to confirm with the stadium administration.
2.  **Admin Dashboard**:
    *   Protected by a robust SHA-256 password hashing mechanism for multiple admin accounts.
    *   Features a custom, modern popover `AdminDatePicker` for seamless date navigation.
    *   Displays live statistics via the `DashboardStats` component.
    *   Admins can view all bookings for a specific day, approve (confirm) pending bookings, or reject/cancel them.
    *   Admins can manually input bookings directly into the system without going through WhatsApp.
3.  **Data Synchronization**:
    *   The frontend polls the Google Apps Script endpoint every 15 seconds to fetch the latest bookings for the current calendar view.
    *   Implements an optimistic UI merging strategy to prevent the polling from overwriting user actions before the API confirms them.

## Conversation History & Development Phases

Below is a summary of the key conversations and development milestones for this project:

### 1. Simplifying Al-Jarash Stadium MVP
- **Objective:** Finalize the flexible duration-based booking system.
- **Outcomes:** 
  - Standardized the backend Google Apps Script for the 11-column booking schema.
  - Cleared legacy data and implemented server-side overlap validation.
  - Resolved double-booking bugs by implementing an optimistic booking merge strategy on the frontend.
  - Refined UX for Admin and Public interfaces, ensuring 12-hour formatted times and proper data display on load.

### 2. Securing Admin Access And Pricing
- **Objective:** Enhance security and dynamic pricing control.
- **Outcomes:** 
  - Implemented multiple password-protected admin accounts using SHA-256 hashing to prevent unauthorized access and exposure.
  - Enabled dynamic pricing control for admins to update hourly rates accurately.

### 3. Securing Sensitive Environment Variables
- **Objective:** Remediate a security risk involving exposed sensitive information.
- **Outcomes:** 
  - Analyzed and understood why a `.env` file was included in the GitHub repository.
  - Removed the `.env` file from version control and added it to `.gitignore`.
  - Rotated exposed secrets to ensure application security.

### 4. Branding & UI Enhancements (Current Phase)
- **Objective:** Polish the branding and improve the admin user experience.
- **Outcomes:** 
  - Renamed the application from "My Google AI Studio App" to "Al jarash stadium" across `index.html`, `package.json`, and `README.md`.
  - Replaced the native admin date picker with a modern, custom `AdminDatePicker` built with React, Lucide icons, and Tailwind CSS. The new calendar allows admins to navigate months and select days seamlessly within a beautiful popover.

## Next Steps / Pending Items
*   **Production Deployment**: Ensure environment variables (`VITE_ADMIN_TOKEN`, API URLs) are correctly configured in the production environment (e.g., Vercel or similar).
*   **WhatsApp Number Update**: In `App.tsx` (or `config.ts`), the WhatsApp number is currently set to `201507953119`. These might need to be finalized with the client's actual contact number.
*   **Monitoring**: Keep an eye on the Google Apps Script API limits if traffic increases.

## Important Files
*   `src/App.tsx`: Contains the core routing, state management (polling, optimistic UI), and the main layout for both public and admin views.
*   `src/components/AdminDatePicker.tsx`: The modern popover calendar component used in the admin dashboard.
*   `src/constants.ts`: Stores the `TIME_SLOTS`, `DURATIONS`, `PITCH_FIELDS` metadata, and time formatting helpers.
*   `src/config.ts`: Holds the `API_URL` (Google Apps Script endpoint) and `WHATSAPP_NUMBER`.
*   `src/types.ts`: Defines TypeScript interfaces for `Booking` and `FootballField`.
