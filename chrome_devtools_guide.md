# Chrome DevTools Protocol Connection Guide

This guide shows how to connect testing tools to Chrome instances running with remote debugging enabled (port 9222).

## Prerequisites

First, start Chrome with remote debugging using the provided script:
```bash
./chrome_debug.sh
```

## 1. Puppeteer Connection

### Installation
```bash
npm install puppeteer-core
```

### Connect to Existing Chrome Instance
```javascript
const puppeteer = require('puppeteer-core');

async function connectToChrome() {
  // Connect to existing Chrome instance
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null // Use Chrome's default viewport
  });

  const pages = await browser.pages();
  const page = pages[0] || await browser.newPage();
  
  // Your test code here
  await page.goto('https://example.com');
  console.log(await page.title());
  
  // Don't close browser - just disconnect
  await browser.disconnect();
}

connectToChrome().catch(console.error);
```

### Alternative: Connect via WebSocket Endpoint
```javascript
const puppeteer = require('puppeteer-core');
const axios = require('axios');

async function connectViaWebSocket() {
  // Get WebSocket endpoint
  const response = await axios.get('http://localhost:9222/json/version');
  const { webSocketDebuggerUrl } = response.data;
  
  const browser = await puppeteer.connect({
    browserWSEndpoint: webSocketDebuggerUrl,
    defaultViewport: null
  });
  
  // Your automation code here
  const page = await browser.newPage();
  await page.goto('https://httpbin.org/ip');
  
  await browser.disconnect();
}
```

## 2. Playwright Connection

### Installation
```bash
npm install playwright-core
```

### Configure Playwright for CDP Connection

Add this project configuration to your `playwright.config.ts`:

```typescript
// In playwright.config.ts
projects: [
  {
    name: 'chrome-cdp',
    use: {
      ...devices['Desktop Chrome'],
      connectOptions: {
        wsEndpoint: 'ws://localhost:9222/devtools/browser'
      }
    },
  },
  // ...other projects
]
```

### Run Tests with CDP
```bash
# Run tests on the CDP-connected Chrome
npx playwright test --project=chrome-cdp

# Run specific test file
npx playwright test tests/example.spec.ts --project=chrome-cdp
```

### Connect to Existing Chrome Instance
```javascript
const { chromium } = require('playwright-core');

async function connectWithPlaywright() {
  // Connect to existing Chrome instance
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  
  // Get existing context or create new one
  const contexts = browser.contexts();
  const context = contexts[0] || await browser.newContext();
  
  const pages = await context.pages();
  const page = pages[0] || await context.newPage();
  
  // Your test code here
  await page.goto('https://example.com');
  console.log(await page.title());
  
  // Don't close browser - just disconnect
  await browser.close();
}

connectWithPlaywright().catch(console.error);
```

### Playwright with Custom Options
```javascript
const { chromium } = require('playwright-core');

async function advancedPlaywrightConnection() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  
  // Create new context with specific options
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Custom Test Agent'
  });
  
  const page = await context.newPage();
  await page.goto('https://whatsmyuseragent.org/');
  
  await context.close();
  await browser.close();
}
```

## 3. Selenium WebDriver Connection

### Installation
```bash
npm install selenium-webdriver
```

### Connect via Selenium
```javascript
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function connectWithSelenium() {
  const options = new chrome.Options();
  options.debuggerAddress('localhost:9222');
  
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  
  try {
    // Get current page or navigate to new one
    await driver.get('https://example.com');
    const title = await driver.getTitle();
    console.log('Page title:', title);
  } finally {
    // Don't quit - just close the connection
    await driver.close();
  }
}
```

## 4. Raw Chrome DevTools Protocol

### Using WebSocket Directly
```javascript
const WebSocket = require('ws');
const axios = require('axios');

async function connectRawCDP() {
  // Get available tabs
  const tabs = await axios.get('http://localhost:9222/json');
  const tab = tabs.data[0]; // Use first tab
  
  // Connect to WebSocket
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  
  ws.on('open', () => {
    // Enable runtime
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.enable'
    }));
    
    // Navigate to page
    ws.send(JSON.stringify({
      id: 2,
      method: 'Page.navigate',
      params: { url: 'https://example.com' }
    }));
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    console.log('CDP Message:', message);
  });
}
```

## 5. Debugging and Inspection

### Check Available Endpoints
```bash
# List all available tabs/targets
curl http://localhost:9222/json

# Get version info
curl http://localhost:9222/json/version

# Create new tab
curl -X POST http://localhost:9222/json/new

# Close tab
curl -X POST http://localhost:9222/json/close/[TAB_ID]
```

### Manual DevTools Access
Open in browser: `http://localhost:9222`

## 6. Best Practices

### Error Handling
```javascript
async function robustConnection() {
  let browser;
  try {
    // Check if Chrome is running
    await axios.get('http://localhost:9222/json/version');
    
    browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222'
    });
    
    // Your automation code
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('Chrome is not running with remote debugging. Please start Chrome first.');
    } else {
      console.error('Connection error:', error.message);
    }
  } finally {
    if (browser) {
      await browser.disconnect();
    }
  }
}
```

### Connection Verification
```javascript
async function verifyConnection() {
  try {
    const response = await axios.get('http://localhost:9222/json/version');
    console.log('Chrome version:', response.data.Browser);
    console.log('WebSocket debugger URL:', response.data.webSocketDebuggerUrl);
    return true;
  } catch (error) {
    console.error('Chrome debugging not available:', error.message);
    return false;
  }
}
```

## 7. Common Issues and Solutions

### Issue: Connection Refused
- **Cause**: Chrome not running with `--remote-debugging-port=9222`
- **Solution**: Start Chrome using the provided script

### Issue: Port Already in Use
- **Cause**: Another process using port 9222
- **Solution**: Use different port: `--remote-debugging-port=9223`

### Issue: Browser Closes When Script Ends
- **Cause**: Using `browser.close()` instead of `browser.disconnect()`
- **Solution**: Use `disconnect()` to preserve the browser session

### Issue: Cannot Find Existing Tabs
- **Cause**: Chrome started without existing tabs
- **Solution**: Create new page or check `browser.pages()` first

## 8. Advanced Usage

### Running Multiple Test Scripts
```javascript
// Each script connects independently
const browser1 = await puppeteer.connect({ browserURL: 'http://localhost:9222' });
const browser2 = await playwright.chromium.connectOverCDP('http://localhost:9222');

// Both can control the same Chrome instance
```

### Persistent Sessions
The Chrome instance retains:
- Cookies and session data
- Browser history
- Open tabs
- Extensions (if any were enabled)

This makes it perfect for testing scenarios that require:
- Logged-in states
- Complex user workflows
- Cross-tab interactions