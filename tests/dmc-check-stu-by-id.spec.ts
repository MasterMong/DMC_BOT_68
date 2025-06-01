import { test, expect } from './fixtures/cdp-fixtures';
import 'dotenv/config';
import { CsvDataHandler } from '../src/utils/csv-data-handler';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test suite for checking student existence in DMC system by Student ID
 * This test verifies if students exist in the system by their Student ID
 */
test('CDP: Check student existence by Student ID in DMC system', async ({ cdpPage }) => {
  // Set longer timeout for this test
  test.setTimeout(300000); // 5 minutes

  // Navigate to the DMC portal
  const dmcPortalUrl = process.env.DMC_PORTAL_URL || 'https://portal.bopp-obec.info/obec68';
  await cdpPage.goto(`${dmcPortalUrl}/`);
  await cdpPage.waitForLoadState('networkidle');
  await expect(cdpPage).toHaveTitle(/ระบบจัดเก็บข้อมูลนักเรียนรายบุคคล Data Management Center/);

  // Check if user is already logged in
  if (await cdpPage.getByRole('link', { name: '- ดาวน์โหลดรายชื่อนักเรียน (สร้างวันละครั้ง เวลา 2:00 น.)' }).isVisible()) {
    console.log('\n🟢 User is already logged in');
    
    // Initialize CSV data handler
    const csvHandler = CsvDataHandler.getInstance();
    const csvFileName = process.env.CSV_FILE_NAME || 'data.csv';
    const csvFilePath = path.join(__dirname, '../data/', csvFileName);
    
    // Load student data from CSV
    let studentIds: string[] = [];
    try {
      const studentRecords = csvHandler.loadStudentData(csvFilePath);
      studentIds = studentRecords.map(student => student.studentNumber).filter(id => id.trim() !== '');
      console.log(`📁 Loaded ${studentIds.length} student IDs from CSV file: ${csvFileName}`);
    } catch (error) {
      console.error('❌ Error loading CSV file:', error.message);
      return;
    }
    
    if (studentIds.length === 0) {
      console.log('⚠️  No student IDs found in CSV file');
      return;
    }

    // Student existence check logic
    const data: { studentId: string; status: boolean; processingTime?: number }[] = [];
    const schoolCode = process.env.SCHOOL_CODE || '36022006';
    const educationYear = process.env.EDUCATION_YEAR || '2568';
    const levelDtlCode = process.env.LEVEL_DTL_CODE || '14';

    console.log('\n📊 Student Existence Check by Student ID Configuration:');
    console.log(`   School Code: ${schoolCode}`);
    console.log(`   Education Year: ${educationYear}`);
    console.log(`   Level Detail Code: ${levelDtlCode}`);
    console.log(`\n🚀 Starting check for ${studentIds.length} students...\n`);

    const startTime = Date.now();

    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];
      const itemStartTime = Date.now();
      
      try {
        const progress = `[${(i + 1).toString().padStart(studentIds.length.toString().length, ' ')}/${studentIds.length}]`;
        const percentage = `(${((i + 1) / studentIds.length * 100).toFixed(1)}%)`;
        
        console.log(`${progress} ${percentage} Processing: ${studentId}`);
        
        const searchUrl = `${dmcPortalUrl}/studentprogram/add?schoolCode=${schoolCode}&studentNo=${studentId}&cifNo=&cifType=&educationYear=${educationYear}&levelDtlCode=${levelDtlCode}&classroom=&firstNameTh=&lastNameTh=&action=search`;
        
        // Navigate with timeout
        await cdpPage.goto(searchUrl, { timeout: 30000, waitUntil: 'domcontentloaded' });
        await cdpPage.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Check if student exists
        const found = await cdpPage.isVisible('input[type="checkbox"]', { timeout: 5000 });
        
        const processingTime = Date.now() - itemStartTime;
        
        if (!found) {
          data.push({ studentId, status: false, processingTime });
          console.log(`   ❌ ${studentId} - Not found! (${processingTime}ms)`);
        } else {
          data.push({ studentId, status: true, processingTime });
          console.log(`   ✅ ${studentId} - Found! (${processingTime}ms)`);
        }

        // Add delay between requests to avoid overwhelming the server
        if (i < studentIds.length - 1) {
          await cdpPage.waitForTimeout(1000); // 1 second delay
        }

      } catch (error) {
        const processingTime = Date.now() - itemStartTime;
        console.error(`   ⚠️  Error checking studentId ${studentId}: ${error.message} (${processingTime}ms)`);
        data.push({ studentId, status: false, processingTime });
        
        // Try to recover by going back to main page
        try {
          console.log('   🔄 Attempting to recover...');
          await cdpPage.goto(`${dmcPortalUrl}/`, { timeout: 10000 });
          await cdpPage.waitForTimeout(2000);
          console.log('   ✅ Recovery successful');
        } catch (recoveryError) {
          console.error('   ❌ Failed to recover, continuing with next studentId');
        }
      }
    }

    const totalTime = Date.now() - startTime;

    // Convert data to CSV string
    const csvHeader = 'StudentId,Status,ProcessingTime(ms)\n';
    const csvRows = data.map(row => `${row.studentId},${row.status},${row.processingTime || 0}`).join('\n');
    const csvContent = csvHeader + csvRows;

    // Ensure output directory exists
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save to CSV file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(outputDir, `student_check_by_id_${timestamp}.csv`);
    
    try {
      fs.writeFileSync(filename, csvContent, 'utf-8');
      console.log(`\n💾 Results saved to: ${filename}`);
      
      // Log summary statistics
      const foundCount = data.filter(item => item.status).length;
      const notFoundCount = data.length - foundCount;
      const avgProcessingTime = data.reduce((sum, item) => sum + (item.processingTime || 0), 0) / data.length;
      
      console.log('\n' + '='.repeat(50));
      console.log('📊 EXECUTION SUMMARY (BY STUDENT ID)');
      console.log('='.repeat(50));
      console.log(`⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)}s`);
      console.log(`📈 Average processing time per student: ${avgProcessingTime.toFixed(0)}ms`);
      console.log(`👥 Total students checked: ${data.length}`);
      console.log(`✅ Found in system: ${foundCount}`);
      console.log(`❌ Not found: ${notFoundCount}`);
      console.log(`📊 Success rate: ${((foundCount / data.length) * 100).toFixed(2)}%`);
      console.log(`⚡ Processing speed: ${(data.length / (totalTime / 1000)).toFixed(2)} students/second`);
      console.log('='.repeat(50));
    } catch (error) {
      console.error('💥 Error saving CSV file:', error);
    }
  } else {
    // end session if user is not logged in
    console.log('🔒 User is not logged in, ending session');
  }
});
