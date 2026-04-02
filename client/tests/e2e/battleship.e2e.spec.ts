import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { createAndLoadGame } from "./testUtils.ts";

let userContext1: BrowserContext;
let userContext2: BrowserContext;
let page1: Page;
let page2: Page;

test.beforeEach(async ({ browser }) => {
  userContext1 = await browser.newContext();
  userContext2 = await browser.newContext();
  page1 = await userContext1.newPage();
  page2 = await userContext2.newPage();
});

test.afterEach(async () => {
  await userContext1.close();
  await userContext2.close();
});

/**
 * Click cell [row, col] on the Enemy board rendered on the given page.
 *
 * The Grid component renders:
 *   <div>                       ← grid root (display:inline-block)
 *     <div>A B C … J</div>      ← column-label header (index 0)
 *     <div>                     ← data row 0          (index 1)
 *       <div>1</div>            ← row label           (index 0)
 *       <div /> × 10            ← cells col 0–9       (index 1–10)
 *     </div>
 *     …
 *   </div>
 *
 * So cell [r, c] is at:
 *   gridRoot > div:nth(r+1) > div:nth(c+1)
 */
async function attackCell(page: Page, row: number, col: number): Promise<void> {
  const gridRoot = page
    .locator("h3", { hasText: "Enemy" })
    .locator("xpath=following-sibling::div[1]");
  const cell = gridRoot.locator("> div").nth(row + 1).locator("> div").nth(col + 1);
  await cell.click();
}

// Default ship placement mirrors the client's defaultShips() helper:
//   SHIP_SIZES = [5, 4, 3, 3, 2], each ship at row = shipIndex * 2, col 0, horizontal.
// Ship cells:
//   Carrier    (size 5): row 0, cols 0–4
//   Battleship (size 4): row 2, cols 0–3
//   Cruiser    (size 3): row 4, cols 0–2
//   Submarine  (size 3): row 6, cols 0–2
//   Destroyer  (size 2): row 8, cols 0–1
const DEFAULT_SHIP_CELLS: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
  [2, 0], [2, 1], [2, 2], [2, 3],
  [4, 0], [4, 1], [4, 2],
  [6, 0], [6, 1], [6, 2],
  [8, 0], [8, 1],
];

// ─── Infrastructure ──────────────────────────────────────────────────────────

test.describe("The game selection infrastructure", () => {
  test("should support creating a new Battleship game and having a second user join it", async () => {
    await createAndLoadGame(page1, page2, "battleship", "player vs player", true, true);
  });
});

// ─── Placement phase ─────────────────────────────────────────────────────────

test.describe("The game of Battleship — placement phase", () => {
  test.beforeEach(async () => {
    await createAndLoadGame(page1, page2, "battleship", "player vs player", true, false);
  });

  test("should show the placement UI with an enabled Confirm Placement button for both players", async () => {
    await expect(
      page1.getByRole("heading", { name: "Battleship — Place Your Ships" }),
    ).toBeVisible();
    await expect(
      page2.getByRole("heading", { name: "Battleship — Place Your Ships" }),
    ).toBeVisible();
    await expect(page1.getByRole("button", { name: "Confirm Placement" })).toBeEnabled();
    await expect(page2.getByRole("button", { name: "Confirm Placement" })).toBeEnabled();
  });

  test("should show a waiting message after a player confirms while their opponent is still placing", async () => {
    await page1.getByRole("button", { name: "Confirm Placement" }).click();

    await expect(
      page1.getByText("Waiting for opponent to place their ships\u2026"),
    ).toBeVisible();
    // Player 2 should still see the active placement UI
    await expect(page2.getByRole("button", { name: "Confirm Placement" })).toBeEnabled();
  });

  test("should transition both players to the battle phase after both confirm placement", async () => {
    await page1.getByRole("button", { name: "Confirm Placement" }).click();
    await page2.getByRole("button", { name: "Confirm Placement" }).click();

    await expect(page1.getByRole("heading", { name: "Battleship", exact: true })).toBeVisible();
    await expect(page2.getByRole("heading", { name: "Battleship", exact: true })).toBeVisible();
  });
});

// ─── Battle phase ─────────────────────────────────────────────────────────────

test.describe("The game of Battleship — battle phase", () => {
  test.beforeEach(async () => {
    await createAndLoadGame(page1, page2, "battleship", "player vs player", true, false);
    await page1.getByRole("button", { name: "Confirm Placement" }).click();
    await page2.getByRole("button", { name: "Confirm Placement" }).click();
    await expect(page1.getByRole("heading", { name: "Battleship", exact: true })).toBeVisible();
  });

  test("should give player 1 the first turn and prevent player 2 from firing", async () => {
    await expect(
      page1.getByText("Your turn \u2014 click on the enemy waters to fire!"),
    ).toBeVisible();
    await expect(
      page2.getByText("Your turn \u2014 click on the enemy waters to fire!"),
    ).not.toBeVisible();
  });

  test("should display the enemy ships sunk counter at zero for both players", async () => {
    await expect(page1.getByText(/Enemy ships sunk: 0 \/ \d+/)).toBeVisible();
    await expect(page2.getByText(/Enemy ships sunk: 0 \/ \d+/)).toBeVisible();
  });

  test("should switch to player 2's turn after player 1 fires", async () => {
    // All unattacked enemy-board cells have cursor:crosshair; click the first available one
    await page1.locator('[style*="crosshair"]').first().click();

    await expect(
      page2.getByText("Your turn \u2014 click on the enemy waters to fire!"),
    ).toBeVisible();
    await expect(
      page1.getByText("Your turn \u2014 click on the enemy waters to fire!"),
    ).not.toBeVisible();
  });

  test("should alternate turns correctly across multiple attacks", async () => {
    await page1.locator('[style*="crosshair"]').first().click();
    await expect(
      page2.getByText("Your turn \u2014 click on the enemy waters to fire!"),
    ).toBeVisible();

    await page2.locator('[style*="crosshair"]').first().click();
    await expect(
      page1.getByText("Your turn \u2014 click on the enemy waters to fire!"),
    ).toBeVisible();

    await page1.locator('[style*="crosshair"]').first().click();
    await expect(
      page2.getByText("Your turn \u2014 click on the enemy waters to fire!"),
    ).toBeVisible();
  });

  test("should show a Game Over screen with both boards after all opponent ships are sunk", async () => {
    // Both players use the default ship layout (rows 0, 2, 4, 6, 8, horizontal from col 0).
    // Player 1 goes first; player 2 wins by precisely targeting all 17 of player 1's ship cells.
    // Player 1 fires into safe water (row 9) on each of their turns so the game is not ended
    // by player 1 before player 2 has a chance to sink all ships.
    for (let i = 0; i < DEFAULT_SHIP_CELLS.length; i++) {
      // Player 1's turn: fire into row 9 (no ships there by default)
      await attackCell(page1, 9, i % 10);

      // Player 2's turn: precisely hit a ship cell on player 1's board
      const [row, col] = DEFAULT_SHIP_CELLS[i];
      await attackCell(page2, row, col);
    }

    await expect(page1.getByRole("heading", { name: "Game Over" })).toBeVisible();
    await expect(page2.getByRole("heading", { name: "Game Over" })).toBeVisible();
  });
});
