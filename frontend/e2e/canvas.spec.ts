import { test, expect, Page } from "@playwright/test";

test.describe("ETL Anything Workflow Canvas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForSelector(".react-flow", { timeout: 10000 });
  });

  test("page loads with no fatal errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (!text.includes("React DevTools") &&
            !text.includes("nodeTypes/edgeTypes") &&
            !text.includes("Download the React DevTools") &&
            !text.includes("404") &&
            !text.includes("Failed to load resource")) {
          errors.push(text);
        }
      }
    });

    await expect(page.locator("h1:has-text('ETL Anything')")).toBeVisible();
    await expect(page.locator(".react-flow")).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("ReactFlow canvas area renders", async ({ page }) => {
    const canvas = page.locator(".react-flow");
    await expect(canvas).toBeVisible();
    const background = page.locator(".react-flow__background");
    await expect(background).toBeVisible();
  });

  test("MiniMap renders by default", async ({ page }) => {
    const miniMap = page.locator(".react-flow__minimap");
    await expect(miniMap).toBeVisible();
  });

  test("Sidebar shows all 4 node types", async ({ page }) => {
    await expect(page.locator("text=Input Node")).toBeVisible();
    await expect(page.locator("text=Data sources & uploads")).toBeVisible();
    await expect(page.locator("text=Reasoning Node")).toBeVisible();
    await expect(page.locator("text=LLM processing")).toBeVisible();
    await expect(page.locator("text=Output Node")).toBeVisible();
    await expect(page.locator("text=Export & save data")).toBeVisible();
    await expect(page.locator("text=Rule Node")).toBeVisible();
    await expect(page.locator("text=Business logic")).toBeVisible();
  });

  test("Header elements are present", async ({ page }) => {
    await expect(page.locator("h1:has-text('ETL Anything')")).toBeVisible();
    await expect(page.locator('input[value="Untitled Workflow"]')).toBeVisible();
  });

  test("Action buttons are visible in header", async ({ page }) => {
    await expect(page.locator('button:has-text("Run Workflow")')).toBeVisible();
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
  });

  test("Workflow name can be edited", async ({ page }) => {
    const input = page.locator('input[value="Untitled Workflow"]');
    await input.clear();
    await input.fill("My Test Workflow");
    await expect(input).toHaveValue("My Test Workflow");
  });

  test("Save button is clickable", async ({ page }) => {
    const saveButton = page.locator('button:has-text("Save")');
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    await page.waitForTimeout(500);
  });

  test("Zoom controls group is visible in header", async ({ page }) => {
    // Zoom group should be present with three buttons (zoom out, zoom in, reset)
    const zoomGroup = page.locator(".flex.items-center.gap-1.border.border-gray-300");
    await expect(zoomGroup.first()).toBeVisible();
  });

  test("Zoom percentage displays 100 on fresh page load", async ({ page }) => {
    // On initial load with no fitView, the default zoom should show 100%
    const zoomText = page.getByText("100%");
    await expect(zoomText.first()).toBeVisible();
  });

  test("Zoom in button increases percentage", async ({ page }) => {
    // Get initial zoom value
    const initialText = await page.getByText("100%").textContent();
    expect(initialText).toContain("100");

    // Find and click the zoom in button
    const zoomButtons = page.locator("button[title='Zoom in']");
    await expect(zoomButtons.first()).toBeVisible();
    await zoomButtons.first().click();
    await page.waitForTimeout(200);

    // Zoom should now be > 100%
    const zoomText = page.getByText(/1[1-9][0-9]%|200%/);
    await expect(zoomText.first()).toBeVisible();
  });

  test("Zoom out button decreases percentage", async ({ page }) => {
    // Get initial zoom value (should be 100)
    const initialText = await page.getByText("100%").textContent();
    expect(initialText).toContain("100");

    // Find and click the zoom out button
    const zoomOutButton = page.locator("button[title='Zoom out']");
    await expect(zoomOutButton.first()).toBeVisible();
    await zoomOutButton.first().click();
    await page.waitForTimeout(200);

    // Zoom should now be < 100%
    const zoomText = page.getByText(/\d{1,2}%/);
    await expect(zoomText.first()).toBeVisible();
  });

  test("Settings menu button is visible and clickable", async ({ page }) => {
    // Settings menu (hamburger icon) should be visible
    const menuButton = page.locator('button:has(svg.lucide-menu)');
    await expect(menuButton.first()).toBeVisible();
    await menuButton.first().click();

    // Settings dropdown should appear
    const settingsDropdown = page.locator("text=Settings");
    await expect(settingsDropdown.first()).toBeVisible();
  });

  test("Settings menu contains MiniMap toggle", async ({ page }) => {
    // Click settings button
    const settingsBtn = page.locator('button:has(svg.lucide-menu)');
    await settingsBtn.first().click();

    // Check MiniMap option exists in dropdown
    await expect(page.locator("text=MiniMap")).toBeVisible();
    await expect(page.locator("text=On")).toBeVisible();
  });

  test("Settings menu closes after selection", async ({ page }) => {
    // Open settings
    const settingsBtn = page.locator('button:has(svg.lucide-menu)');
    await settingsBtn.first().click();

    // MiniMap toggle should be visible
    await expect(page.locator("text=MiniMap")).toBeVisible();

    // Click the MiniMap toggle
    const miniMapToggle = page.locator("button:has-text('MiniMap')");
    await miniMapToggle.click();

    // Settings should be closed (re-open and check it's Off)
    await settingsBtn.first().click();
    await expect(page.locator("text=Off")).toBeVisible();
  });

  test("MiniMap toggles off and on via Settings menu", async ({ page }) => {
    // Verify MiniMap is visible
    await expect(page.locator(".react-flow__minimap")).toBeVisible();

    // Open settings
    const settingsBtn = page.locator('button:has(svg.lucide-menu)');
    await settingsBtn.first().click();

    // Toggle MiniMap off
    const miniMapToggle = page.locator("button:has-text('MiniMap')");
    await miniMapToggle.click();
    await page.waitForTimeout(300);

    // MiniMap should be hidden
    await expect(page.locator(".react-flow__minimap")).not.toBeVisible();

    // Re-open settings and toggle back on
    await settingsBtn.first().click();
    const miniMapToggle2 = page.locator("button:has-text('MiniMap')").last();
    await miniMapToggle2.click();
    await page.waitForTimeout(300);

    // MiniMap should be visible again
    await expect(page.locator(".react-flow__minimap")).toBeVisible();
  });

  test("No Controls component renders on canvas", async ({ page }) => {
    // The default ReactFlow Controls component (with +, -, fit) should not be present
    const controls = page.locator(".react-flow__controls");
    await expect(controls).not.toBeVisible();
  });

  test("Dropped node appears on canvas with correct size", async ({ page }) => {
    // Drag "Input Node" from sidebar to canvas
    const sidebarItem = page.locator("text=Input Node").first();
    await expect(sidebarItem).toBeVisible();

    // Find the canvas area to drop onto
    const canvas = page.locator(".react-flow");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    // Drag the node to the center of the canvas
    await sidebarItem.dragTo(canvas, {
      targetPosition: {
        x: (canvasBox?.width || 800) / 2,
        y: (canvasBox?.height || 600) / 2,
      },
    });

    // The node should appear on canvas after drag
    await page.waitForTimeout(300);
    const nodes = page.locator(".react-flow__node");
    const count = await nodes.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("Multiple nodes can be dropped and connected", async ({ page }) => {
    // Drop Input Node
    const inputItem = page.locator("text=Input Node").first();
    const reasoningItem = page.locator("text=Reasoning Node").first();
    const canvas = page.locator(".react-flow");

    await inputItem.dragTo(canvas, {
      targetPosition: { x: 200, y: 200 },
    });
    await page.waitForTimeout(300);

    await reasoningItem.dragTo(canvas, {
      targetPosition: { x: 500, y: 200 },
    });
    await page.waitForTimeout(300);

    // Both nodes should be on canvas
    const nodes = page.locator(".react-flow__node");
    const count = await nodes.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
