const { expect } = require('@playwright/test');

exports.ProductPage = class ProductPage {

    constructor(page) {
        this.page = page;
        this.productTitle = page.locator('.name');
        this.productPrice = page.locator('.price-container');
        this.addToCartBtn = page.locator('a:has-text("Add to cart")');
    }

    async addToCart() {
        const dialogPromise = this.page.waitForEvent('dialog');
        await this.addToCartBtn.click();
        const dialog = await dialogPromise;
        console.log(`Dialog message: ${dialog.message()}`);
        await dialog.accept();
    }

    async getProductDetails() {
        const title = await this.productTitle.innerText();
        const priceText = await this.productPrice.innerText();
        const price = priceText.split(' ')[0];
        return { title, price };
    }
};
