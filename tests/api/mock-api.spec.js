const { test, expect } = require('@playwright/test');

test.describe('API Mocking Tests', () => {

    const API_BASE = 'https://demoblaze.com/api';

    //HELPER FUNCTIONS
    async function postOrder(page, payload, url = `${API_BASE}/orders`) {
        return await page.evaluate(async ({ url, payload }) => {
            const r = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const bodyText = await r.text();
            let body = null;
            try {
                body = bodyText ? JSON.parse(bodyText) : null;
            } catch {
                body = bodyText;
            }

            return {
                status: r.status,
                ok: r.ok,
                body,
            };
        }, { url, payload });
    }

    async function login(page, credentials) {
        return await page.evaluate(async ({ url, credentials }) => {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            const text = await res.text();
            let body = null;
            try { body = text ? JSON.parse(text) : null; } catch { body = text; }

            return { status: res.status, body };
        }, { url: `${API_BASE}/auth/login`, credentials });
    }

    async function apiRequest(page, { method = 'GET', path, body }) {
        return await page.evaluate(async ({ url, method, body }) => {
            const res = await fetch(url, {
                method,
                headers: body ? { 'Content-Type': 'application/json' } : undefined,
                body: body ? JSON.stringify(body) : undefined,
            });

            const text = await res.text();
            let json = null;
            try { json = text ? JSON.parse(text) : null; } catch { json = text; }

            return { status: res.status, body: json };
        }, { url: `${API_BASE}${path}`, method, body });
    }

    //MOCK
    test.beforeEach(async ({ page }) => {
        await page.goto('https://example.com');

        await page.route('**/api/auth/login', async route => {
            const request = route.request();
            const postData = request.postDataJSON();
            if (postData.username === 'testuser' && postData.password === 'password123') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ token: "mock_jwt_token" })
                });
            } else {
                await route.fulfill({
                    status: 401,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: "Authentication failed" })
                });
            }
        });

        await page.route('**/api/orders', async route => {
            const method = route.request().method();
            if (method !== 'POST') return route.fallback();

            if (method === 'POST') {
                const data = route.request().postDataJSON();

                if (!data.userId) {
                    await route.fulfill({ status: 400, body: JSON.stringify({ error: "Missing userId" }) });
                    return;
                }
                if (data.productDetails?.quantity <= 0) {
                    await route.fulfill({ status: 400, body: JSON.stringify({ error: "Invalid quantity" }) });
                    return;
                }
                if (data.productDetails?.productId === 999) {
                    await route.fulfill({ status: 404, body: JSON.stringify({ error: "Product not found" }) });
                    return;
                }

                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        orderId: "MOCK-ORDER-001",
                        status: "CREATED",
                        quantity: data.productDetails.quantity
                    })
                });
            }
        });

        await page.route('**/api/orders/*', async route => {
            const request = route.request();
            const method = request.method();
            const url = request.url();

            const orderId = url.split('/').pop();

            if (orderId === 'MOCK-ORDER-001') {

                if (method === 'GET') {
                    return route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            order: { id: "MOCK-ORDER-001", status: "CREATED" },
                            item: { productId: 555, quantity: 2 },
                            shipping: { addressId: 3001 }
                        })
                    });
                }

                if (method === 'PUT') {
                    return route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            orderId: "MOCK-ORDER-001",
                            status: "UPDATED",
                            quantity: 5
                        })
                    });
                }
            }

            return route.fulfill({ body: JSON.stringify({ error: 'Order Not Found' }), status: 404 });
        });

        await page.route('**/api/orders/status', async route => {
            if (route.request().method() === 'PATCH') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ status: "SHIPPED" })
                });
            }
        });
    });

    //API TESTS
    test.describe('POST /auth/login', () => {
        test('Success', async ({ page }) => {
            const response = await login(page, {
                username: 'testuser',
                password: 'password123',
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ token: 'mock_jwt_token' });
        });

        test('Failure', async ({ page }) => {
            const response = await login(page, {
                username: 'wrongusername',
                password: 'wrongpassword',
            });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Authentication failed' });
        });
    });

    test.describe('POST /orders', () => {
        test('Success', async ({ page }) => {
            const res = await postOrder(page, {
                userId: 1001,
                addressId: 3001,
                productDetails: { productId: 555, quantity: 2 },
            });

            expect(res.status).toBe(201);
            expect(res.body).toEqual({
                orderId: "MOCK-ORDER-001",
                status: "CREATED",
                quantity: 2
            });
        });

        const cases = [
            {
                name: 'Missing userId',
                payload: { addressId: 3001, productDetails: { productId: 555, quantity: 2 } },
                expected: { status: 400, body: { error: 'Missing userId' } },
            },
            {
                name: 'Invalid quantity',
                payload: { userId: 1001, addressId: 3001, productDetails: { productId: 555, quantity: 0 } },
                expected: { status: 400, body: { error: 'Invalid quantity' } },
            },
            {
                name: 'Product not found',
                payload: { userId: 1001, addressId: 3001, productDetails: { productId: 999, quantity: 2 } },
                expected: { status: 404, body: { error: 'Product not found' } },
            },
        ];

        for (const c of cases) {
            test(c.name, async ({ page }) => {
                const res = await postOrder(page, c.payload);
                expect(res.status).toBe(c.expected.status);
                expect(res.body).toEqual(c.expected.body);
            });
        }
    });

    test.describe('GET /orders/{orderId}', () => {
        test('Success', async ({ page }) => {
            const res = await apiRequest(page, { path: '/orders/MOCK-ORDER-001' });
            expect(res.status).toBe(200);
            expect(res.body.order.id).toBe('MOCK-ORDER-001');
        });

        test('Failure', async ({ page }) => {
            const res = await apiRequest(page, { path: '/orders/INVALID-ID' });
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Order Not Found');
        });
    });

    test.describe('PUT & PATCH /orders', () => {
        test('PUT /orders/{id}', async ({ page }) => {
            const res = await apiRequest(page, {
                method: 'PUT',
                path: '/orders/MOCK-ORDER-001',
                body: {}, // mock ne bekliyorsa
            });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('UPDATED');
        });

        test('PATCH /orders/status', async ({ page }) => {
            const res = await apiRequest(page, {
                method: 'PATCH',
                path: '/orders/status',
                body: {}, // mock ne bekliyorsa
            });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('SHIPPED');
        });
    });
});
