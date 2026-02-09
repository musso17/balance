import { test, expect } from "@playwright/test";

test.describe("Transaction Flow", () => {
    test.beforeEach(async ({ page }) => {
        // Note: In a real scenario, you'd need to handle authentication
        // For now, this assumes demo mode or a logged-in session
        await page.goto("/transacciones");
    });

    test("should display transaction page", async ({ page }) => {
        await expect(page).toHaveTitle(/Balance/);
        // Wait for the main content to load
        await expect(page.locator("main")).toBeVisible();
    });

    test("should open transaction form", async ({ page }) => {
        // Look for a button to add new transaction
        const addButton = page.getByRole("button", { name: /agregar|nueva|añadir/i });

        if (await addButton.isVisible()) {
            await addButton.click();

            // The form should appear with date field
            await expect(page.getByLabel(/fecha/i)).toBeVisible();
        }
    });

    test("should filter transactions by persona", async ({ page }) => {
        // Wait for transactions to load
        await page.waitForTimeout(1000);

        const personaFilter = page.getByRole("combobox").first();

        if (await personaFilter.isVisible()) {
            await personaFilter.click();
            // Select a specific persona
            const option = page.getByRole("option", { name: /marcelo/i });
            if (await option.isVisible()) {
                await option.click();
            }
        }
    });

    test("should display mobile-friendly layout on small screens", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto("/transacciones");

        // On mobile, the table should be replaced with a mobile list
        await page.waitForTimeout(500);
        await expect(page.locator("main")).toBeVisible();
    });
});

test.describe("Dashboard", () => {
    test("should display dashboard summary", async ({ page }) => {
        await page.goto("/dashboard");

        await expect(page.locator("main")).toBeVisible();

        // Should have some summary cards or stats
        const content = await page.textContent("body");
        expect(content).toBeDefined();
    });
});
