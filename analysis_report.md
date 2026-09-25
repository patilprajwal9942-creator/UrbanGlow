================================
URBANGLOW AUTH/BOOKING TEST
================================

1. Owner Login: PASS
2. Owner User Data: PASS
3. Owner Token: WARNING - Token stored in cookie but browser may not send on all request types
4. Owner Booking Fetch: PASS - GET requests successfully send cookie
5. Accept Button: FAIL - PATCH request fails with 401
6. Frontend Auth Check: FAIL - No auth guard before API call; backend 401 shown
7. Axios Authorization: FAIL - `withCredentials: true` but cookie not sent on PATCH
8. Backend Auth Middleware: FAIL - Token not received, returns 401
9. Owner Authorization: NOT TESTABLE - Auth fails before authorization check
10. Booking Update: NOT TESTABLE - Auth fails before booking update

ROOT CAUSE:
The JWT cookie is set with `sameSite: "lax"` in `server/controllers/authController.js:50` (`res.cookie("token", token, { sameSite: "lax", ... })`). The browser's SameSite policy prevents cookies from being sent on PATCH (and other non-GET) requests initiated by JavaScript. When the owner clicks "Accept Booking", the `api.patch()` request is made via JavaScript/Fetch, and the browser does NOT attach the JWT cookie because of `sameSite: "lax"`. The backend `protect` middleware then finds no token in the request, returns 401 Unauthorized, and the frontend displays the "Please login first" error. GET requests (like fetching bookings) work fine because `sameSite: "lax"` allows cookies on safe methods.

BROWSER ISSUE: NO - The `sameSite: "lax"` policy affects all major browsers (Chrome, Edge, Firefox, Safari) consistently. The issue is not specific to Chrome vs Edge; it's a fundamental HTTP cookie SameSite policy behavior. Using different browsers for owner/customer is not the cause.

MINIMAL FIX:
Change the cookie `sameSite` attribute from `"lax"` to `"none"` AND set `secure: true` in `server/controllers/authController.js:49-50`, OR implement an axios interceptor in the frontend to add `Authorization: Bearer <token>` header for all API requests, which avoids the SameSite issue entirely.

The most reliable minimal fix is to add an axios interceptor that extracts the JWT token from localStorage and sets it as the Authorization header for all API requests, since:
- It works regardless of SameSite policy
- It doesn't require HTTPS (unlike `sameSite: "none"`)
- It's a frontend-only change that doesn't modify the backend cookie configuration