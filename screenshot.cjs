const pw = require('/home/z/.npm-global/lib/node_modules/playwright/node_modules/playwright-core');
const { spawn } = require('child_process');

(async () => {
  // Start Next.js dev server
  const server = spawn('npx', ['next', 'dev', '-p', '3000', '-H', '0.0.0.0'], {
    cwd: '/home/z/my-project',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env }
  });

  let serverOutput = '';
  server.stdout.on('data', d => {
    serverOutput += d.toString();
    if (serverOutput.includes('Ready')) {
      console.log('Server is ready!');
    }
  });
  server.stderr.on('data', d => {
    serverOutput += d.toString();
  });

  // Wait for server to start
  console.log('Starting Next.js dev server...');
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  // Check if server started
  const http = require('http');
  const checkServer = () => new Promise((resolve) => {
    http.get('http://127.0.0.1:3000/api', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(null));
  });
  
  let apiResponse = await checkServer();
  if (!apiResponse) {
    console.log('Server failed to start. Output:', serverOutput.substring(0, 1000));
    process.exit(1);
  }
  console.log('API response:', apiResponse);

  const browser = await pw.chromium.launch({ 
    executablePath: '/home/z/.cache/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true
  });

  const context = await browser.newContext({ 
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text().substring(0, 150));
  });
  page.on('pageerror', err => console.log('PAGE EXCEPTION:', err.message.substring(0, 150)));

  try {
    // 1. Login page
    console.log('=== 1. Login Page ===');
    await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: '/home/z/my-project/download/01-login.png', fullPage: false });
    console.log('Saved 01-login.png');

    // 2. Login
    console.log('=== 2. Logging in ===');
    const emailInput = await page.$('input[type="email"]');
    const pwInput = await page.$('input[type="password"]');
    
    if (!emailInput || !pwInput) {
      console.log('Login form not found! Page content:', await page.textContent('body').catch(() => 'error'));
    } else {
      await emailInput.fill('demo@dealscope.fr');
      await pwInput.fill('Demo2025!');
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      try {
        await page.waitForURL('**/', { timeout: 20000 });
        console.log('Login successful, redirected to:', page.url());
      } catch(e) {
        console.log('Login redirect timeout, current URL:', page.url());
      }
      
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/home/z/my-project/download/02-dashboard.png', fullPage: false });
      console.log('Saved 02-dashboard.png');

      const currentUrl = page.url();
      
      if (!currentUrl.includes('login')) {
        // 3. Dashboard
        console.log('=== 3. Dashboard ===');
        await page.screenshot({ path: '/home/z/my-project/download/03-dashboard.png', fullPage: false });
        console.log('Saved 03-dashboard.png');

        // 4. Pipeline
        console.log('=== 4. Pipeline ===');
        try {
          await page.evaluate(() => {
            const links = document.querySelectorAll('button, a');
            for (const l of links) {
              if (l.textContent.includes('Pipeline')) { l.click(); break; }
            }
          });
          await page.waitForTimeout(2500);
          await page.screenshot({ path: '/home/z/my-project/download/04-pipeline.png', fullPage: false });
          console.log('Saved 04-pipeline.png');
        } catch(e) { console.log('Pipeline error:', e.message.substring(0,100)); }

        // 5. Chat IA
        console.log('=== 5. Chat IA ===');
        try {
          await page.evaluate(() => {
            const links = document.querySelectorAll('button, a');
            for (const l of links) {
              if (l.textContent.includes('Chat')) { l.click(); break; }
            }
          });
          await page.waitForTimeout(2000);
          await page.screenshot({ path: '/home/z/my-project/download/05-chat.png', fullPage: false });
          console.log('Saved 05-chat.png');
        } catch(e) { console.log('Chat error:', e.message.substring(0,100)); }

        // 6. Settings
        console.log('=== 6. Settings ===');
        try {
          await page.evaluate(() => {
            const links = document.querySelectorAll('button, a');
            for (const l of links) {
              if (l.textContent.includes('Paramètres')) { l.click(); break; }
            }
          });
          await page.waitForTimeout(2000);
          await page.screenshot({ path: '/home/z/my-project/download/06-settings.png', fullPage: false });
          console.log('Saved 06-settings.png');
        } catch(e) { console.log('Settings error:', e.message.substring(0,100)); }

        // 7. News
        console.log('=== 7. News ===');
        try {
          await page.evaluate(() => {
            const links = document.querySelectorAll('button, a');
            for (const l of links) {
              if (l.textContent.includes('Actualités')) { l.click(); break; }
            }
          });
          await page.waitForTimeout(2000);
          await page.screenshot({ path: '/home/z/my-project/download/07-news.png', fullPage: false });
          console.log('Saved 07-news.png');
        } catch(e) { console.log('News error:', e.message.substring(0,100)); }
      } else {
        console.log('STILL ON LOGIN - checking for errors...');
        await page.screenshot({ path: '/home/z/my-project/download/02-login-error.png', fullPage: false });
      }
    }
  } catch(err) {
    console.error('Navigation error:', err.message.substring(0, 200));
    await page.screenshot({ path: '/home/z/my-project/download/error.png', fullPage: false }).catch(() => {});
  }

  await browser.close();
  server.kill();
  console.log('=== ALL DONE ===');
})().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
