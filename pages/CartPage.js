const { expect } = require('@playwright/test');

exports.CartPage = class CartPage {

    constructor(page) {
        this.page = page;
        this.total = page.locator('#totalp');
        this.cartRows = page.locator('.success');
    }

    async goto() {
        await this.page.goto('/cart.html');
    }

    async checkProductInCart(productName, productPrice) {
        await this.page.waitForTimeout(2000);
        const row = this.page.locator(`tr:has-text("${productName}")`);
        await expect(row).toBeVisible({ timeout: 15000 });

        const numericPrice = productPrice.replace('$', '');
        await expect(row).toContainText(numericPrice);
    }

    async getTotalPrice() {
        return await this.total.innerText();
    }
};
