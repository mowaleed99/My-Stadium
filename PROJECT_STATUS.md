# Al-Jarash Stadium (ملعب الجراش الخماسي) - Project Status

## Overview
**Al-Jarash Stadium** is a web-based booking and management system for a 5v5 football (soccer) pitch located in Tanta, Mahalla Marhoum. The application provides a public interface for customers to view availability and request bookings via WhatsApp, as well as an Admin dashboard for the stadium management to approve/reject bookings and view daily statistics.

## Tech Stack
*   **Frontend Framework**: React 19 + TypeScript
*   **Build Tool**: Vite 6
*   **Styling**: Tailwind CSS v4
*   **Icons**: Lucide React
*   **Calendar Component**: FullCalendar (`@fullcalendar/react`, daygrid, interaction plugins)
*   **Backend / Database**: Google Apps Script acting as an API, backed by a Google Sheet.

## Current Application Features
1.  **Public Booking Flow**: 
    *   Displays a monthly calendar view showing days availability (Available, Partially Booked, Fully Booked).
    *   Users can select a day, choose a start time and duration (1, 1.5, or 2 hours).
    *   Submitting a booking creates a "pending" optimistic booking in the UI, sends the request to the Google Apps Script API, and redirects the user to WhatsApp to confirm with the stadium administration.
2.  **Admin Dashboard**:
    *   Protected by a simple password mechanism (environment variable `VITE_ADMIN_TOKEN` or default `jarash123`).
    *   Displays live statistics via the `DashboardStats` component.
    *   Admins can view all bookings for a specific day, approve (confirm) pending bookings, or reject/cancel them.
    *   Admins can manually input bookings directly into the system without going through WhatsApp.
3.  **Data Synchronization**:
    *   The frontend polls the Google Apps Script endpoint every 15 seconds to fetch the latest bookings for the current calendar view.
    *   Implements an optimistic UI merging strategy to prevent the polling from overwriting user actions before the API confirms them.

## Recent Work & Where We Stopped
Based on recent development logs, the MVP has been heavily refined and simplified:
*   **Backend Standardization**: The Google Apps Script was updated to manage an 11-column booking schema correctly. Legacy/corrupted data was cleared from the sheet.
*   **Concurrency Fixes**: Resolved a double-booking bug caused by frontend polling overwriting local state. Implemented the optimistic booking merging strategy.
*   **Time Formatting**: Ensured both Admin and Public interfaces correctly display times in a 12-hour format (AM/PM or ص/م).
*   **Admin Dashboard Enhancements**: Ensured the dashboard correctly displays all fetched booking data immediately on load for the selected date.

## Next Steps / Pending Items
*   **Production Deployment**: Ensure environment variables (`VITE_ADMIN_TOKEN`, API URLs) are correctly configured in the production environment (e.g., Vercel or similar).
*   **WhatsApp Number Update**: In `App.tsx` (or `config.ts`), the WhatsApp number is currently set to `201507953119`, and the footer placeholder says `01000000000`. These might need to be finalized with the client's actual contact number.
*   **Monitoring**: Keep an eye on the Google Apps Script API limits if traffic increases.

## Important Files
*   `src/App.tsx`: Contains the core routing, state management (polling, optimistic UI), and the main layout for both public and admin views.
*   `src/constants.ts`: Stores the `TIME_SLOTS`, `DURATIONS`, `PITCH_FIELDS` metadata, and time formatting helpers.
*   `src/config.ts`: Holds the `API_URL` (Google Apps Script endpoint) and `WHATSAPP_NUMBER`.
*   `src/types.ts`: Defines TypeScript interfaces for `Booking` and `FootballField`.
