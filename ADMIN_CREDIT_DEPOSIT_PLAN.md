# Admin Credit Deposit Feature - Implementation Plan

## Overview

This feature allows admin users to deposit credits to any organization/account without requiring an actual Stripe payment. The credits behave exactly like real money, with the only difference being a note in the transaction description.

## User Story

**As an admin**, I want to deposit credits to any organization's account without requiring an actual payment, so that I can:
- Provide promotional credits
- Compensate customers for service issues
- Grant trial credits
- Issue refunds or credits for support reasons

## Current System Analysis

### Database Schema
- **organization.credits**: Decimal field tracking current credit balance
- **transaction table**: Records all credit movements with fields:
  - `type`: enum including "credit_topup", "credit_refund", etc.
  - `amount`: Payment amount received (USD)
  - `creditAmount`: Credits granted to organization
  - `status`: "pending", "completed", "failed"
  - `stripePaymentIntentId`: Reference to Stripe payment (nullable)
  - `description`: Human-readable description

### Existing Credit Flow
- Real credit purchases: Stripe webhook → `amount` = payment, `creditAmount` = credits + bonus
- Admin deposits: `amount` = "0" (no payment), `creditAmount` = granted amount
- Both use same `credit_topup` type

### Admin Panel Architecture
- Next.js 16 App Router (port 3006)
- Authentication via Better Auth (session cookies)
- Admin access controlled by `ADMIN_EMAILS` environment variable
- Server-side API client using openapi-fetch
- OpenAPI types generated from backend API spec

## Implementation Plan

### 1. Backend API Endpoint

**File**: `apps/api/src/routes/admin.ts`

**New Route**: `POST /admin/deposit-credits`

**Request Schema**:
```typescript
{
  organizationId: string;  // Target organization ID
  amount: number;          // Credit amount to deposit (USD)
  description: string;     // Reason for deposit (e.g., "Promotional credit")
}
```

**Response Schema**:
```typescript
{
  success: boolean;
  transaction: {
    id: string;
    organizationId: string;
    creditAmount: string;
    description: string;
  };
  newBalance: string;
}
```

**Logic**:
1. Validate admin email using existing `isAdminEmail()` function
2. Verify organization exists in database
3. Create transaction record:
   - `type: "credit_topup"`
   - `amount: "0"` (no actual payment)
   - `creditAmount: amount`
   - `status: "completed"`
   - `description: "Admin credit grant: {description}"`
   - `currency: "USD"`
   - No `stripePaymentIntentId` (null)
4. Update organization credits using SQL:
   ```sql
   UPDATE organization 
   SET credits = credits + {amount}
   WHERE id = {organizationId}
   ```
5. Return transaction details and new balance

**Security**:
- Admin email verification (401 if not authenticated, 403 if not admin)
- Organization existence validation
- Input validation via Zod schema

### 2. Frontend - Organizations List Page

**File**: `apps/admin/src/app/organizations/page.tsx`

**Features**:
- Server Component fetching all organizations
- Search/filter functionality
- Display organization cards with:
  - Organization name
  - Billing email
  - Current credit balance
  - Plan type
  - "Deposit Credits" button

**API Integration**:
- Fetch organizations list: `GET /admin/organizations` (new endpoint to implement)
- Server-side rendering with `fetchServerData()`

### 3. Deposit Credits Dialog Component

**File**: `apps/admin/src/components/deposit-credits-dialog.tsx`

**Features**:
- Client Component
- Form fields:
  - Organization display (read-only)
  - Amount input (number, required, min: 0.01)
  - Description textarea (required, placeholder: "Reason for deposit")
- Form validation using React Hook Form + Zod
- API call using openapi-fetch client
- Success toast with new balance
- Error handling with toast notifications
- Loading state on submit button

**UX Flow**:
1. Click "Deposit Credits" button on organization card
2. Dialog opens with pre-filled organization
3. Admin enters amount and description
4. Submit triggers API call
5. On success: Toast message, close dialog, refresh organization data
6. On error: Show error toast

### 4. Sidebar Navigation Update

**File**: `apps/admin/src/components/admin-shell.tsx`

**Changes**:
- Add "Organizations" link to sidebar
- Icon: `Building2` or `Briefcase` from lucide-react
- Active state detection for `/organizations` route

### 5. Additional Backend Endpoint

**File**: `apps/api/src/routes/admin.ts`

**New Route**: `GET /admin/organizations`

**Response Schema**:
```typescript
{
  organizations: Array<{
    id: string;
    name: string;
    billingEmail: string;
    credits: string;
    plan: "free" | "pro";
    status: "active" | "inactive" | "deleted";
    createdAt: string;
  }>;
}
```

**Logic**:
1. Validate admin access
2. Query all organizations with active status
3. Return sorted by creation date (newest first)

### 6. Type Generation

**Command**: `pnpm generate` (in `apps/admin` directory)

**Purpose**: Regenerate TypeScript types from OpenAPI spec after adding new endpoints

## Implementation Checklist

- [ ] Backend: Add `POST /admin/deposit-credits` endpoint
- [ ] Backend: Add `GET /admin/organizations` endpoint
- [ ] Frontend: Create organizations list page
- [ ] Frontend: Create deposit dialog component
- [ ] Frontend: Update sidebar navigation
- [ ] Regenerate OpenAPI types
- [ ] Test admin authentication/authorization
- [ ] Test credit deposit flow
- [ ] Test transaction record creation
- [ ] Verify credits appear in organization balance
- [ ] Test error handling (invalid org, non-admin user)

## Testing Strategy

### Manual Testing
1. Set admin email in `ADMIN_EMAILS` env var
2. Login to admin panel
3. Navigate to Organizations page
4. Select an organization
5. Click "Deposit Credits"
6. Enter amount and description
7. Submit and verify:
   - Transaction created with correct fields
   - Organization credits updated
   - Success toast displayed
   - No Stripe payment reference

### Test Cases
- ✓ Admin can deposit credits successfully
- ✓ Non-admin users get 403 error
- ✓ Invalid organization ID returns error
- ✓ Negative amounts are rejected
- ✓ Transaction appears in organization's transaction history
- ✓ Credits can be used for API requests
- ✓ Admin email is tracked (optional enhancement)

## Future Enhancements

1. **Audit Trail**: Add `grantedBy` field to track which admin granted credits
2. **Maximum Limit**: Set maximum deposit amount per transaction (e.g., $1000)
3. **Organization Search**: Add autocomplete search for large organization lists
4. **Transaction History**: Show admin-granted credits in separate view
5. **Bulk Deposits**: Allow CSV upload for multiple organizations
6. **Notifications**: Email organization when credits are granted

## Technical Notes

- Credits are stored as `decimal` type in PostgreSQL
- Use `sql` template literals for credit updates to avoid race conditions
- Admin authorization uses email whitelist, not role-based access
- OpenAPI schema auto-generates client types for type safety
- All monetary values are in USD

## Database Impact

- No schema changes required
- Uses existing `organization.credits` and `transaction` tables
- Transaction records distinguish admin grants by:
  - `amount = "0"`
  - `stripePaymentIntentId = null`
  - Description starts with "Admin credit grant:"

## Deployment Considerations

- Ensure `ADMIN_EMAILS` environment variable is set in production
- Use comma-separated email list: `admin1@example.com,admin2@example.com`
- No database migrations needed
- Regenerate OpenAPI types in CI/CD pipeline after API changes
