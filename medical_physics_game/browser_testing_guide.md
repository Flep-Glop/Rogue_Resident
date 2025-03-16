# Cross-Browser Testing Guide

Before finalizing the reorganization, please test the application in multiple browsers to ensure compatibility:

## Browsers to Test

1. **Chrome** (latest version)
2. **Firefox** (latest version)
3. **Safari** (if available)
4. **Edge** (latest version)

## Test Procedure for Each Browser

1. Open the application at http://localhost:5000/
2. Navigate to the character selection screen
3. Select a character and start a game
4. Interact with at least 3 different node types
5. Open and use the skill tree
6. Check inventory functionality
7. Verify all UI elements render correctly
8. Check for any console errors (open developer tools)

## Screen Sizes to Test

1. **Desktop**: 1920x1080
2. **Laptop**: 1366x768
3. **Tablet**: 768x1024 (portrait)
4. **Mobile**: 375x667 (portrait)

## Form to Record Results

For each browser and screen size, record:
- Browser name and version: ________________
- Screen size tested: ________________
- Working features: ________________
- Non-working features: ________________
- Visual issues: ________________
- Console errors: ________________

## Acceptance Criteria

All core functionality should work in Chrome and Firefox at minimum.
Only minor visual differences are acceptable between browsers.
No critical features should fail in any supported browser.
