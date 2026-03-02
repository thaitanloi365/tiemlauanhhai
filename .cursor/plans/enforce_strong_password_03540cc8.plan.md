---
name: Enforce Strong Password
overview: Enforce strong password policy at server validation level and mirror it in admin UI for better feedback, without blocking existing users at login.
todos:
  - id: add-shared-strong-rule
    content: Create reusable strong password rule in shared validation and apply to employee create + change-password schemas
    status: completed
  - id: ui-feedback-employee-form
    content: Add strong-password feedback/validation in employee create form
    status: completed
  - id: ui-feedback-settings-form
    content: Add strong-password feedback/validation in admin change-password form
    status: completed
  - id: verify-and-lint
    content: Run lint checks for edited files and test weak/strong password scenarios
    status: completed
isProject: false
---

# Enforce Strong Password Policy

## Scope and Decisions

- Policy selected: at least 8 characters, must include uppercase, lowercase, number, and special character.
- Apply only on password creation/change flows (not login), per your choice.

## Implementation Plan

- Update shared server-side validation in `[/Users/loithai/Projects/tiemlauanhhai/src/lib/utils/validation.ts](/Users/loithai/Projects/tiemlauanhhai/src/lib/utils/validation.ts)`:
  - Add a reusable `strongPassword` Zod rule (single source of truth).
  - Apply it to `employeeSchema.password` and `changePasswordSchema.newPassword`.
  - Keep `adminLoginSchema.password` permissive (length only) so existing weaker passwords can still login.
- Mirror the rule in admin UI for immediate user feedback:
  - `[/Users/loithai/Projects/tiemlauanhhai/src/lib/components/admin/EmployeeForm.svelte](/Users/loithai/Projects/tiemlauanhhai/src/lib/components/admin/EmployeeForm.svelte)`: add helper/error text for password requirements and validate before submit.
  - `[/Users/loithai/Projects/tiemlauanhhai/src/routes/admin/settings/+page.svelte](/Users/loithai/Projects/tiemlauanhhai/src/routes/admin/settings/+page.svelte)`: add client-side strong-password check for `newPassword` with clear Vietnamese error messaging.
- Keep API route behavior unchanged except for improved error responses via updated schema validation:
  - `[/Users/loithai/Projects/tiemlauanhhai/src/routes/api/admin/employees/+server.ts](/Users/loithai/Projects/tiemlauanhhai/src/routes/api/admin/employees/+server.ts)`
  - `[/Users/loithai/Projects/tiemlauanhhai/src/routes/api/admin/auth/change-password/+server.ts](/Users/loithai/Projects/tiemlauanhhai/src/routes/api/admin/auth/change-password/+server.ts)`
- Validation and safety checks:
  - Run lints on edited files and fix any introduced issues.
  - Manually verify flows: create employee with weak/strong password, change password with weak/strong password, and ensure login still works for existing accounts.

## Expected Outcome

- Weak passwords are rejected consistently on create/change password endpoints.
- Admin UI shows requirement guidance before API submission.
- No regression to login behavior for existing users.

