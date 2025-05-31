import { test, expect } from './fixtures/cdp-fixtures';
// import 'dotenv/config';
import { cids } from '../data/is_exitst_cid';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test suite for checking student existence in DMC system
 * This test verifies if students exist in the system by their CID
 */
test('CDP: Check student existence in DMC system', async ({ cdpPage }) => {
  // Set longer timeout for this test
  test.setTimeout(300000); // 5 minutes

  // Navigate to the DMC portal
  await cdpPage.goto('https://portal.bopp-obec.info/obec68/');
  await cdpPage.waitForLoadState('networkidle');
  await expect(cdpPage).toHaveTitle(/ระบบจัดเก็บข้อมูลนักเรียนรายบุคคล Data Management Center/);

  // Check if user is already logged in
  if (await cdpPage.getByRole('link', { name: '- ดาวน์โหลดรายชื่อนักเรียน (สร้างวันละครั้ง เวลา 2:00 น.)' }).isVisible()) {
    console.log('User is already logged in');
    
    // Student existence check logic
    const data: { cid: string; status: boolean }[] = [];
    const schoolCode = '36022006';
    const educationYear = '2568'; // Updated for current year
    const levelDtlCode = '14';

    console.log(`Starting check for ${cids.length} students...`);

    for (let i = 0; i < cids.length; i++) {
      const cid = cids[i];
      try {
        console.log(`Processing ${i + 1}/${cids.length}: ${cid}`);
        
        const searchUrl = `https://portal.bopp-obec.info/obec68/studentprogram/add?schoolCode=${schoolCode}&studentNo=&cifNo=${cid}&cifType=&educationYear=${educationYear}&levelDtlCode=${levelDtlCode}&classroom=&firstNameTh=&lastNameTh=&action=search`;
        
        // Navigate with timeout
        await cdpPage.goto(searchUrl, { timeout: 30000, waitUntil: 'domcontentloaded' });
        await cdpPage.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Check if student exists
        const found = await cdpPage.isVisible('input[type="checkbox"]', { timeout: 5000 });
        
        if (!found) {
          data.push({ cid, status: false });
          console.log(`${cid} - Not found!`);
        } else {
          data.push({ cid, status: true });
          console.log(`${cid} - Found!`);
        }

        // Add delay between requests to avoid overwhelming the server
        if (i < cids.length - 1) {
          await cdpPage.waitForTimeout(1000); // 1 second delay
        }

      } catch (error) {
        console.error(`Error checking CID ${cid}:`, error.message);
        data.push({ cid, status: false });
        
        // Try to recover by going back to main page
        try {
          await cdpPage.goto('https://portal.bopp-obec.info/obec68/', { timeout: 10000 });
          await cdpPage.waitForTimeout(2000);
        } catch (recoveryError) {
          console.error('Failed to recover, continuing with next CID');
        }
      }
    }

    // Convert data to CSV string
    const csvHeader = 'CID,Status\n';
    const csvRows = data.map(row => `${row.cid},${row.status}`).join('\n');
    const csvContent = csvHeader + csvRows;

    // Ensure output directory exists
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save to CSV file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(outputDir, `student_check_${timestamp}.csv`);
    
    try {
      fs.writeFileSync(filename, csvContent, 'utf-8');
      console.log(`Results saved to ${filename}`);
      
      // Log summary statistics
      const foundCount = data.filter(item => item.status).length;
      const notFoundCount = data.length - foundCount;
      console.log(`\n=== Summary ===`);
      console.log(`Total students checked: ${data.length}`);
      console.log(`Found in system: ${foundCount}`);
      console.log(`Not found: ${notFoundCount}`);
      console.log(`Success rate: ${((foundCount / data.length) * 100).toFixed(2)}%`);
    } catch (error) {
      console.error('Error saving CSV file:', error);
    }
  } else {
    // end session if user is not logged in
    console.log('User is not logged in, ending session');
  }
});


