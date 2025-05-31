import { test, expect } from './fixtures/cdp-fixtures';
import 'dotenv/config';
import { CsvDataHandler } from '../src/utils/csv-data-handler';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test suite for changing student classrooms in DMC system
 * This test loads student data from CSV and updates their classroom assignments
 */
test('CDP: Change student classroom in DMC system', async ({ cdpPage }) => {
  // Set longer timeout for this test
  test.setTimeout(600000); // 10 minutes

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
    let students: { cid: string; room: string; firstName: string; lastName: string }[] = [];
    try {
      const studentRecords = csvHandler.loadStudentData(csvFilePath);
      students = studentRecords.map(student => ({
        cid: student.studentId,
        room: student.room,
        firstName: student.firstName,
        lastName: student.lastName
      })).filter(student => student.cid.trim() !== '');
      
      console.log(`📁 Loaded ${students.length} students from CSV file: ${csvFileName}`);
    } catch (error) {
      console.error('❌ Error loading CSV file:', error.message);
      return;
    }
    
    if (students.length === 0) {
      console.log('⚠️  No students found in CSV file');
      return;
    }

    // Classroom change logic
    const results: { cid: string; name: string; room: string; status: 'success' | 'not_found' | 'error'; error?: string; processingTime?: number }[] = [];
    const levelDtlCode = process.env.LEVEL_DTL_CODE || '11';

    console.log('\n📊 Classroom Change Configuration:');
    console.log(`   Level Detail Code: ${levelDtlCode}`);
    console.log(`\n🚀 Starting classroom changes for ${students.length} students...\n`);

    const startTime = Date.now();

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const itemStartTime = Date.now();
      
      try {
        const progress = `[${(i + 1).toString().padStart(students.length.toString().length, ' ')}/${students.length}]`;
        const percentage = `(${((i + 1) / students.length * 100).toFixed(1)}%)`;
        
        console.log(`${progress} ${percentage} Processing: ${student.cid} - ${student.firstName} ${student.lastName} -> Room ${student.room}`);

        // Navigate to classroom management section
        await cdpPage.getByText('โรงเรียน', { exact: true }).click();
        await cdpPage.getByRole('link', { name: '2.7.7' }).click();
        await cdpPage.getByRole('link', { name: 'จัดห้องนร/แก้ไขชั้นเรียน' }).click();
        await cdpPage.waitForLoadState('networkidle');

        // Search for student by CID
        await cdpPage.getByRole('group').locator('input[name="cifNo"]').click();
        await cdpPage.getByRole('group').locator('input[name="cifNo"]').fill(student.cid);
        await cdpPage.getByRole('button', { name: 'ค้นหา' }).click();
        await cdpPage.waitForLoadState('networkidle');

        // Check if student was found
        const found = await cdpPage.isVisible('input[type="checkbox"]', { timeout: 5000 });
        
        if (found) {
          // Select student and change classroom
          await cdpPage.getByRole('checkbox').check();
          await cdpPage.locator('input[name="items\\[0\\]\\.newClassroom"]').click();
          await cdpPage.locator('input[name="items\\[0\\]\\.newClassroom"]').fill(student.room);
          await cdpPage.getByRole('button', { name: 'บันทึก' }).click();
          await cdpPage.waitForLoadState('networkidle');

          const processingTime = Date.now() - itemStartTime;
          results.push({
            cid: student.cid,
            name: `${student.firstName} ${student.lastName}`,
            room: student.room,
            status: 'success',
            processingTime
          });
          
          console.log(`   ✅ ${student.cid} - Successfully updated to room ${student.room} (${processingTime}ms)`);
        } else {
          const processingTime = Date.now() - itemStartTime;
          results.push({
            cid: student.cid,
            name: `${student.firstName} ${student.lastName}`,
            room: student.room,
            status: 'not_found',
            processingTime
          });
          
          console.log(`   ❌ ${student.cid} - Student not found! (${processingTime}ms)`);
        }

        // Add delay between requests to avoid overwhelming the server
        if (i < students.length - 1) {
          await cdpPage.waitForTimeout(1500); // 1.5 second delay
        }

      } catch (error) {
        const processingTime = Date.now() - itemStartTime;
        console.error(`   ⚠️  Error processing ${student.cid}: ${error.message} (${processingTime}ms)`);
        
        results.push({
          cid: student.cid,
          name: `${student.firstName} ${student.lastName}`,
          room: student.room,
          status: 'error',
          error: error.message,
          processingTime
        });
        
        // Try to recover by going back to main page
        try {
          console.log('   🔄 Attempting to recover...');
          await cdpPage.goto(`${dmcPortalUrl}/`, { timeout: 10000 });
          await cdpPage.waitForTimeout(2000);
          console.log('   ✅ Recovery successful');
        } catch (recoveryError) {
          console.error('   ❌ Failed to recover, continuing with next student');
        }
      }
    }

    const totalTime = Date.now() - startTime;

    // Convert results to CSV string
    const csvHeader = 'CID,Name,TargetRoom,Status,Error,ProcessingTime(ms)\n';
    const csvRows = results.map(row => 
      `${row.cid},"${row.name}",${row.room},${row.status},"${row.error || ''}",${row.processingTime || 0}`
    ).join('\n');
    const csvContent = csvHeader + csvRows;

    // Ensure output directory exists
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save to CSV file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(outputDir, `classroom_changes_${timestamp}.csv`);
    
    try {
      fs.writeFileSync(filename, csvContent, 'utf-8');
      console.log(`\n💾 Results saved to: ${filename}`);
      
      // Log summary statistics
      const successCount = results.filter(item => item.status === 'success').length;
      const notFoundCount = results.filter(item => item.status === 'not_found').length;
      const errorCount = results.filter(item => item.status === 'error').length;
      const avgProcessingTime = results.reduce((sum, item) => sum + (item.processingTime || 0), 0) / results.length;
      
      console.log('\n' + '='.repeat(60));
      console.log('📊 CLASSROOM CHANGE EXECUTION SUMMARY');
      console.log('='.repeat(60));
      console.log(`⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)}s`);
      console.log(`📈 Average processing time per student: ${avgProcessingTime.toFixed(0)}ms`);
      console.log(`👥 Total students processed: ${results.length}`);
      console.log(`✅ Successfully updated: ${successCount}`);
      console.log(`❌ Not found in system: ${notFoundCount}`);
      console.log(`⚠️  Errors encountered: ${errorCount}`);
      console.log(`📊 Success rate: ${((successCount / results.length) * 100).toFixed(2)}%`);
      console.log(`⚡ Processing speed: ${(results.length / (totalTime / 1000)).toFixed(2)} students/second`);
      console.log('='.repeat(60));
    } catch (error) {
      console.error('💥 Error saving CSV file:', error);
    }
  } else {
    // end session if user is not logged in
    console.log('🔒 User is not logged in, ending session');
  }
});
