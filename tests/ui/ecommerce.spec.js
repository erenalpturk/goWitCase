const { test, expect } = require('@playwright/test');
const { HomePage } = require('../../pages/HomePage');
const { ProductPage } = require('../../pages/ProductPage');
const { CartPage } = require('../../pages/CartPage');

test.describe('UI Tests - Demoblaze', () => {
    test.slow();

    test('TC1: Category Navigation & Product Detail', async ({ page }) => {
        const home = new HomePage(page);
        const product = new ProductPage(page);

        await home.goto();
        await home.selectCategory('Laptops');
        await home.selectProduct('Sony vaio i5');

        const details = await product.getProductDetails();

        expect(details.title).toBe('Sony vaio i5');
        expect(details.price).toBe('$790');
        await expect(product.addToCartBtn).toBeVisible();
    });

    test('TC2: Add to Cart & Cart Verification', async ({ page }) => {
        const home = new HomePage(page);
        const product = new ProductPage(page);
        const cart = new CartPage(page);

        await home.goto();
        await home.selectProduct('Samsung galaxy s6');
        const details = await product.getProductDetails();
        await product.addToCart();
        await cart.goto();
        await cart.checkProductInCart(details.title, details.price);
        const total = await cart.getTotalPrice();
        expect(total).not.toBe('');
    });
});
