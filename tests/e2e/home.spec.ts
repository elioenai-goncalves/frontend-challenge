import { test, expect } from "@playwright/test";

test("deve carregar a página inicial com NFTs", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /SEJA DONO D(?:O FUTURO|A CULTURA)/i,
    }),
  ).toBeVisible();

  if (testInfo.project.name === "chromium-mobile") {
    await expect(
      page.getByRole("searchbox", { name: "Buscar NFTs" }),
    ).toBeVisible();

    await expect(
      page
        .getByRole("navigation", { name: "Navegação inferior" })
        .getByRole("button", { name: "Abrir menu de navegação" }),
    ).toBeVisible();
  } else {
    await expect(
      page.getByRole("link", { name: /Kurio — início/i }),
    ).toBeVisible();
  }
});
