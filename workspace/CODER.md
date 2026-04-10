<instructions>
This file will be automatically added to your context. 
It serves multiple purposes:
  1. Storing frequently used tools so you can use them without searching each time
  2. Recording the user's code style preferences (naming conventions, preferred libraries, etc.)
  3. Maintaining useful information about the codebase structure and organization
  4. Remembering tricky quirks from this codebase

When you spend time searching for certain configuration files, tricky code coupled dependencies, or other codebase information, add that to this CODER.md file so you can remember it for next time.
Keep entries sorted in DESC order (newest first) so recent knowledge stays in prompt context if the file is truncated.
</instructions>

<coder>
## Auth pattern in AdminLayout
- `useAuth()` from SDK → `isPending` = spinner, `isAnonymous` = login wall, else render layout
- `logout()` replaces `<Link to="/">` SignOut — real SDK logout
- Avatar initial from `user.name[0]` or `user.email[0]`
- Route `/admin/*` is protected via AdminLayout wrapper — no separate PrivateRoute needed

## UserAdminProfile entity (corrected)
- Entity name: `UserAdminProfile` (NOT `StaffUser` — that entity doesn't exist)
- Fields: `userId` (synthetic: email-derived key), `role`, `isActive`, `twoFactorEnabled`, `permissions` (comma-sep)
- `userId` format: `email.replace(@, _at_).replace(non-alnum, _)` — used as display name source
- `getDisplayName(u)` = `u.userId.replace(/_/g, " ")`, `getDisplayEmail(u)` reconstructs email
- ActivityLog: `staffUserName` field does NOT exist — removed from filter/display; use `description` for context

## Fleet Management entities
- `MaintenanceRecord`: carId, type, status, scheduledDate, completedDate?, mileageAtService?, nextServiceMileage?, cost?, notes?, mechanicName?
- `InsuranceRecord`: carId, provider, policyNumber, startDate, expiryDate, cost, type (Third Party/Comprehensive/Premium), status
- `RegistrationRecord`: carId, plateNumber, expiryDate, renewalCost?, status, notes?
- `FuelLog`: carId, date, liters, pricePerLiter, totalCost, mileage, fuelType, station?, notes?
- `DamageReport`: carId, reservationId?, reportDate, description, severity, status, repairCost?, photoUrls (comma-sep), reportedBy, notes?
- Alert logic: `daysUntil(date)` helper → ≤30 = "Expiring Soon" (orange), <0 = "Expired" (red)
- Route: `/admin/fleet` → `AdminFleetManagement`
- GPS tab is a placeholder — requires external API integration

## StaffUser & ActivityLog entities
- `StaffUser`: name, email, role (Admin/Manager/Staff/Accountant), isActive, twoFactorEnabled, avatarInitials, permissions (comma-sep keys), lastLogin?
- `ActivityLog`: staffUserId, staffUserName, action (CREATE/UPDATE/DELETE/LOGIN/LOGOUT), entity, entityId?, description, ipAddress?, timestamp
- RBAC default permissions per role defined in `ROLE_PERMISSIONS` map in `AdminUsers.tsx`
- Route: `/admin/perdoruesit` → `AdminUsers`
- Sidebar: split into "main" group + "system" group (with divider + label) in `AdminLayout.tsx`

## SDK Pattern
- Import: `import { useQuery, useMutation, useLazyQuery, useAuth } from '@animaapp/playground-react-sdk'`
- Provider: `AnimaProvider` wraps root in `src/index.tsx`
- Entity names (PascalCase): `Car`, `Customer`, `Reservation`, `Invoice`, `CustomerDocument`, `CommunicationLog`, `ChatMessage`, `Deposit`
- mockData.ts is cleared of all entity data — only static report arrays (`revenueData`, `bookingsBySource`, `topCars`)

## Architecture
- Routes: `/` `/flota` `/makina/:slug` `/rezervo` + `/admin/*`
- Admin sidebar: `src/admin/AdminLayout.tsx` — `bg-admin-sidebar`, `!text-white` override in `src/index.css`
- CSS issue: global `a, span, p` color rules in `@layer base` in `index.css` — admin sidebar uses `color: white !important` override
- `src/pages/CarDetailPage.tsx` still references mockData `cars` — not yet migrated (no user request)

## CustomerDocument entity
- `customerId`, `documentType` (ID/Passport/Driver License), `fileUrl`, `expiryDate?`

## CommunicationLog entity
- `customerId`, `type` (Email/SMS/Call), `subject`, `content`, `timestamp`

## ChatMessage entity
- `conversationId` = `customer-{customerId}`, `text`, `isFromAdmin`
</coder>
