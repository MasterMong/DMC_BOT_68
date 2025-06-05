import { test, expect } from './fixtures/cdp-fixtures';
import { CsvDataHandler, StudentRecord } from '../src/utils/csv-data-handler';
import * as path from 'path';
import 'dotenv/config';

/**
 * Test suite for DMC scout and red cross data updates
 * This test reads student data from CSV and updates their scout/red cross information
 */
test('CDP: Update scout and red cross data from CSV', async ({ cdpPage }) => {
  // Get configuration from environment
  const dmcPortalUrl = process.env.DMC_PORTAL_URL || 'https://portal.bopp-obec.info/obec68';
  const schoolCode = process.env.SCHOOL_CODE || '36022006';
  const csvFileName = process.env.CSV_FILE_NAME || 'data.csv';
  
  // Initialize CSV data handler
  const csvHandler = CsvDataHandler.getInstance();
  const csvFilePath = path.join(__dirname, '../data', csvFileName);
  
  // Load student data from CSV
  let students: StudentRecord[];
  try {
    students = csvHandler.loadStudentData(csvFilePath);
    console.log(`Loaded ${students.length} students from CSV`);
  } catch (error) {
    console.error('Failed to load student data:', error);
    return;
  }

  // Filter students by school code if specified
  const filteredStudents = students.filter(student => 
    !schoolCode || student.schoolCode === schoolCode
  );
  console.log(`Processing ${filteredStudents.length} students for school ${schoolCode}`);

  // Navigate to the DMC portal
  await cdpPage.goto(`${dmcPortalUrl}/`);
  await cdpPage.waitForLoadState('networkidle');
  await expect(cdpPage).toHaveTitle(/ระบบจัดเก็บข้อมูลนักเรียนรายบุคคล Data Management Center/);

  // Check if user is already logged in
  if (await cdpPage.getByRole('link', { name: '- ดาวน์โหลดรายชื่อนักเรียน (สร้างวันละครั้ง เวลา 2:00 น.)' }).isVisible()) {
    console.log('User is already logged in');
    
    // Scout ID mapping based on frontend form options
    const scoutMapping: { [key: string]: string } = {
      'ลูกเสือ/เนตรนารี': '1',
      'เหล่าอากาศ': '2', 
      'เหล่าสมุทร': '3',
      'ไม่เป็นลูกเสือ/เนตรนารี': '4',
      '-': '',
      '': ''
    };
    
    // Red Cross Youth ID mapping based on frontend form options
    const redCrossMapping: { [key: string]: string } = {
      'เป็นสมาชิกยุวกาชาด': '1',
      'ไม่เป็นสมาชิกยุวกาชาด': '2',
      '-': '',
      '': ''
    };
    
    // Process students in batches to avoid overwhelming the system
    const batchSize = parseInt(process.env.BATCH_SIZE || '5');
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < filteredStudents.length; i += batchSize) {
      const batch = filteredStudents.slice(i, i + batchSize);
      
      for (const student of batch) {
        // Validate required data
        const validation = csvHandler.validateStudentRecord(student);
        if (!validation.isValid) {
          console.log(`Skipping ${student.firstName} ${student.lastName} - validation errors:`, validation.errors);
          errorCount++;
          continue;
        }

        try {
          // Navigate to student edit page using Student Number and school code
          const studentUrl = `${dmcPortalUrl}/student/${student.studentNumber}:${schoolCode}/edit`;
          await cdpPage.goto(studentUrl);
          await cdpPage.waitForLoadState('networkidle');
          
          // Verify we're on the correct student page
          await expect(cdpPage.getByRole('heading', { name: 'ข้อมูลเบื้องต้น' })).toBeVisible();
          
          // Navigate to scout/red cross tab
          await cdpPage.getByRole('link', { name: 'ลูกเสือ,เนตรนารี,ยุวกาชาด' }).click();
          await cdpPage.waitForLoadState('networkidle');
          
          // Verify we're on the scout tab
          await expect(cdpPage.locator('#tab-scout')).toBeVisible();
          
          // Get the mapped values for scout and red cross
          const scoutValue = scoutMapping[student.scoutId] || '';
          const redCrossValue = redCrossMapping[student.redcrossyouthId] || '';
          
          console.log(`Updating ${student.firstName} ${student.lastName}:`);
          console.log(`  Scout: ${student.scoutId} -> ${scoutValue}`);
          console.log(`  Red Cross: ${student.redcrossyouthId} -> ${redCrossValue}`);
          
          // Update scout information
          if (scoutValue !== '') {
            await cdpPage.locator('#scoutId-select').selectOption(scoutValue);
            console.log(`  ✓ Scout field updated`);
          } else {
            console.log(`  ⚠ Scout field skipped (empty value)`);
          }
          
          // Update red cross information  
          if (redCrossValue !== '') {
            await cdpPage.locator('#redcrossyouthId-select').selectOption(redCrossValue);
            console.log(`  ✓ Red Cross field updated`);
          } else {
            console.log(`  ⚠ Red Cross field skipped (empty value)`);
          }
          
          // Only save if we made changes
          if (scoutValue !== '' || redCrossValue !== '') {
            // Look for save button
            const saveButton = cdpPage.getByRole('button', { name: 'บันทึก' });
            if (await saveButton.isVisible()) {
              await saveButton.click();
              await cdpPage.waitForLoadState('networkidle');
              console.log(`  ✓ Changes saved successfully`);
              successCount++;
            } else {
              console.log(`  ⚠ Save button not found`);
            }
          } else {
            console.log(`  ⚠ No changes made, skipping save`);
          }
          
          // Brief pause between students to avoid rate limiting
          await cdpPage.waitForTimeout(1000);
          
        } catch (error) {
          console.error(`  ✗ Error updating ${student.firstName} ${student.lastName}:`, error.message);
          errorCount++;
          continue;
        }
      }
      
      // Longer pause between batches
      if (i + batchSize < filteredStudents.length) {
        const batchNumber = Math.floor(i / batchSize) + 1;
        console.log(`Completed batch ${batchNumber}, pausing before next batch...`);
        await cdpPage.waitForTimeout(3000);
      }
    }
    
    console.log(`\nUpdate Summary:`);
    console.log(`  Total students processed: ${filteredStudents.length}`);
    console.log(`  Successful updates: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    
  } else {
    console.log('User is not logged in, ending session');
    throw new Error('User must be logged in to perform updates');
  }
});
