# QA Candidate Case Study – Playwright Test Automation

This repository contains a Playwright-based **test automation project** covering both **API (mocked)** and **UI** testing scenarios as defined in the case study.

---

## Project Structure

- `tests/api/`  
  API tests implemented using **network interception (`page.route`)** with fully mocked responses.

- `tests/ui/`  
  End-to-end UI tests executed against **https://demoblaze.com**.

- `pages/`  
  Page Object Model classes (`HomePage`, `ProductPage`, `CartPage`) used by UI tests.

- `playwright.config.js`  
  Playwright configuration (browser, reporter, baseURL, retries, etc.).

---

## Requirements

- Node.js (v16+ recommended)
- NPM

---

## Installation

```bash
npm install
npx playwright install --with-deps