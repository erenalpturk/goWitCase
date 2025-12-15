const { expect } = require('@playwright/test');

exports.HomePage = class HomePage {

    constructor(page) {
        this.page = page;
        this.laptopsCategory = page.locator(`a:has-text("Laptops")`);
        this.phonesCategory = page.locator(`a:has-text("Phones")`);
    }

    async goto() {
        await this.page.goto('/');
    }

    async selectCategory(category) {
        await this.page.locator(`a:has-text("${category}")`).click();
    }

    async selectProduct(productName) {
        await this.page.locator(`a:has-text("${productName}")`).first().click();
        await this.page.waitForURL(/prod\.html/);
    }
};
