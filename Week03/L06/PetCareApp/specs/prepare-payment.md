# Feature: Prepare payment details

## 1. User goal
A pet owner wants to review the selected pet service and its amount
before paying, so they know what they will be charged.

## 2. Scope
Does: look up a service by ID and return its payment details as JSON.
Does NOT: charge money, call a payment gateway, add database tables,
add EJS pages, or require login (classroom mock endpoint).
Preparing payment details is not processing a payment.

## 3. Request
- Method and URL: GET /payments/prepare/:serviceId
- Input: serviceId in the URL path only.
- The client cannot supply the amount. The server uses the catalogue price.

## 4. Service catalogue (mock, server-side)
| ID (number) | Service name (string) | Price (number) |
|---|---|---|
| 1 | Vaccination | 35 |
| 2 | Pet Grooming | 50 |
| 3 | Boarding | 80 |

## 5. Successful response
- HTTP 200, JSON, exactly five fields:
{
  "serviceId": 1,
  "serviceName": "Vaccination",
  "amount": 35,
  "currency": "sgd",
  "status": "READY_FOR_PAYMENT"
}
- serviceId and amount are JSON numbers (35, not "35.00").
- serviceName, currency and status are strings.
- currency is always "sgd". status is always "READY_FOR_PAYMENT".

## 6. Unsuccessful response
- If serviceId is not in the catalogue: HTTP 404 with
  {"error":"Service not found"}

## 7. Acceptance criteria
- AC1: GET /payments/prepare/1 → 200; serviceName Vaccination; amount 35
- AC2: GET /payments/prepare/2 → 200; serviceName Pet Grooming; amount 50
- AC3: GET /payments/prepare/3 → 200; serviceName Boarding; amount 80
- AC4: GET /payments/prepare/999 → 404; {"error":"Service not found"}
- AC5: Every successful response has exactly 5 fields, with correct types
  and the fixed currency/status values.
- Out of scope, so not tested: charging, gateway, new tables, EJS pages.

## 8. Open questions
- What should happen for a non-numeric ID such as /payments/prepare/abc?
  (Not agreed. Not specified as a requirement yet.)
- Should login be required in a real version of this feature?