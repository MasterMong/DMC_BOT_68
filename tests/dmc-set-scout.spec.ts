import { test, expect } from './fixtures/cdp-fixtures';
import { CsvDataHandler, StudentRecord } from '../src/utils/csv-data-handler';
import * as path from 'path';
import * as fs from 'fs';
import 'dotenv/config';

/**
 * Test suite for DMC scout and red cross data updates
 * Updates student scout/red cross information based on CSV data
 */
test('CDP: Update scout and red cross data from CSV', async ({ cdpPage }) => {
  test.setTimeout(600000); // 10 minutes for update tests
  
  // Environment configuration
  const dmcPortalUrl = process.env.DMC_PORTAL_URL || 'https://portal.bopp-obec.info/obec68';
  const schoolCode = process.env.SCHOOL_CODE || '36022006';
  const educationYear = process.env.EDUCATION_YEAR || '2568';
  const csvFileName = process.env.CSV_FILE_NAME || 'data.csv';
  
  // Navigation to portal
  await cdpPage.goto(`${dmcPortalUrl}/`);
  await cdpPage.waitForLoadState('networkidle');
  await expect(cdpPage).toHaveTitle(/ระบบจัดเก็บข้อมูลนักเรียนรายบุคคล Data Management Center/);

  // Check login status using established pattern
  if (await cdpPage.getByRole('link', { name: '- ดาวน์โหลดรายชื่อนักเรียน (สร้างวันละครั้ง เวลา 2:00 น.)' }).isVisible()) {
    console.log('\n🟢 User is already logged in');
    
    // Load CSV data using established pattern
    const csvHandler = CsvDataHandler.getInstance();
    const csvFilePath = path.join(__dirname, '../data/', csvFileName);
    
    let studentRecords: StudentRecord[];
    try {
      studentRecords = csvHandler.loadStudentData(csvFilePath);
      console.log(`📁 Loaded ${studentRecords.length} students from ${csvFileName}`);
    } catch (error) {
      console.error('❌ Error loading CSV file:', error.message);
      return;
    }

    // Filter students by school code
    const filteredStudents = studentRecords.filter(student => 
      !schoolCode || student.schoolCode === schoolCode
    );
    console.log(`🎯 Processing ${filteredStudents.length} students for school ${schoolCode}`);

    // Data mapping based on frontend form options
    const scoutMapping: { [key: string]: string } = {
      'ลูกเสือ/เนตรนารี': '1',
      'เหล่าอากาศ': '2', 
      'เหล่าสมุทร': '3',
      'ไม่เป็นลูกเสือ/เนตรนารี': '4',
      '-': '',
      '': ''
    };
    
    const redCrossMapping: { [key: string]: string } = {
      'เป็นสมาชิกยุวกาชาด': '1',
      'ไม่เป็นสมาชิกยุวกาชาด': '2',
      '-': '',
      '': ''
    };
    
    // Results tracking
    const results: Array<{
      studentId: string;
      studentName: string;
      status: string;
      scoutUpdate: string;
      redCrossUpdate: string;
      processingTime: number;
      error?: string;
    }> = [];
    
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Process each student with progress tracking
    for (let i = 0; i < filteredStudents.length; i++) {
      const student = filteredStudents[i];
      const itemStartTime = Date.now();
      
      // Progress tracking using established pattern
      const progress = `[${(i + 1).toString().padStart(filteredStudents.length.toString().length, ' ')}/${filteredStudents.length}]`;
      const percentage = `(${((i + 1) / filteredStudents.length * 100).toFixed(1)}%)`;
      
      try {
        // Validate student data
        const validation = csvHandler.validateStudentRecord(student);
        if (!validation.isValid) {
          console.log(`${progress} ${percentage} ⚠️ Skipping ${student.studentNumber} - ${student.firstName} ${student.lastName} - validation errors:`, validation.errors);
          
          results.push({
            studentId: student.studentNumber,
            studentName: `${student.firstName} ${student.lastName}`,
            status: 'skipped',
            scoutUpdate: 'N/A',
            redCrossUpdate: 'N/A',
            processingTime: Date.now() - itemStartTime,
            error: validation.errors.join(', ')
          });
          
          skippedCount++;
          continue;
        }

        // Get mapped values
        const scoutValue = scoutMapping[student.scoutId] || '';
        const redCrossValue = redCrossMapping[student.redcrossyouthId] || '';
        
        console.log(`${progress} ${percentage} 🔄 Processing: ${student.studentNumber} - ${student.firstName} ${student.lastName}`);
        console.log(`  Scout: "${student.scoutId}" -> ${scoutValue || 'skip'}`);
        console.log(`  Red Cross: "${student.redcrossyouthId}" -> ${redCrossValue || 'skip'}`);
        
        // Navigate to student edit page using URL pattern
        const studentUrl = `${dmcPortalUrl}/student/${student.studentNumber}:${schoolCode}/edit`;
        
        try {
          await cdpPage.goto(studentUrl, { timeout: 30000, waitUntil: 'domcontentloaded' });
          await cdpPage.waitForLoadState('networkidle');
          
          // Verify we're on the correct student page
          await expect(cdpPage.getByRole('heading', { name: 'ข้อมูลเบื้องต้น' })).toBeVisible({ timeout: 5000 });
          
          // Navigate to scout/red cross tab
          await cdpPage.getByRole('link', { name: 'ลูกเสือ,เนตรนารี,ยุวกาชาด' }).click();
          await cdpPage.waitForLoadState('networkidle');
          
          // Verify we're on the scout tab
          await expect(cdpPage.locator('#tab-scout')).toBeVisible({ timeout: 5000 });
          
          let scoutUpdated = false;
          let redCrossUpdated = false;
          
          // Update scout information
          if (scoutValue !== '') {
            await cdpPage.locator('#scoutId-select').selectOption(scoutValue);
            scoutUpdated = true;
            console.log(`  ✅ Scout field updated`);
          }
          
          // Update red cross information  
          if (redCrossValue !== '') {
            await cdpPage.locator('#redcrossyouthId-select').selectOption(redCrossValue);
            redCrossUpdated = true;
            console.log(`  ✅ Red Cross field updated`);
          }
          
          // Save changes if any were made
          if (scoutUpdated || redCrossUpdated) {
            const saveButton = cdpPage.getByRole('button', { name: 'บันทึก' });
            if (await saveButton.isVisible()) {
              await saveButton.click();
              await cdpPage.waitForLoadState('networkidle');
              console.log(`  💾 Changes saved successfully`);
              
              results.push({
                studentId: student.studentNumber,
                studentName: `${student.firstName} ${student.lastName}`,
                status: 'success',
                scoutUpdate: scoutUpdated ? 'updated' : 'no change',
                redCrossUpdate: redCrossUpdated ? 'updated' : 'no change',
                processingTime: Date.now() - itemStartTime
              });
              
              successCount++;
            } else {
              throw new Error('Save button not found');
            }
          } else {
            console.log(`  ⚠️ No changes needed, skipping save`);
            
            results.push({
              studentId: student.studentNumber,
              studentName: `${student.firstName} ${student.lastName}`,
              status: 'no_changes',
              scoutUpdate: 'no change needed',
              redCrossUpdate: 'no change needed',
              processingTime: Date.now() - itemStartTime
            });
          }
          
        } catch (error) {
          console.error(`  ❌ Error updating ${student.studentNumber} - ${student.firstName} ${student.lastName}: ${error.message}`);
          
          // Recovery attempt using established pattern
          try {
            console.log('  🔄 Attempting to recover...');
            await cdpPage.goto(`${dmcPortalUrl}/`, { timeout: 10000 });
            await cdpPage.waitForTimeout(2000);
            console.log('  ✅ Recovery successful');
          } catch (recoveryError) {
            console.error('  ❌ Failed to recover');
          }
          
          results.push({
            studentId: student.studentNumber,
            studentName: `${student.firstName} ${student.lastName}`,
            status: 'error',
            scoutUpdate: 'failed',
            redCrossUpdate: 'failed',
            processingTime: Date.now() - itemStartTime,
            error: error.message
          });
          
          errorCount++;
        }
        
        // Rate limiting between requests
        if (i < filteredStudents.length - 1) {
          await cdpPage.waitForTimeout(1000);
        }
        
      } catch (error) {
        console.error(`${progress} ${percentage} ❌ Error processing ${student.studentNumber} - ${student.firstName} ${student.lastName}: ${error.message}`);
        
        results.push({
          studentId: student.studentNumber,
          studentName: `${student.firstName} ${student.lastName}`,
          status: 'error',
          scoutUpdate: 'failed',
          redCrossUpdate: 'failed',
          processingTime: Date.now() - itemStartTime,
          error: error.message
        });
        
        errorCount++;
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    // Save results to CSV using established pattern
    try {
      const outputDir = path.join(__dirname, '../output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const csvHeader = 'StudentID,StudentName,Status,ScoutUpdate,RedCrossUpdate,ProcessingTime(ms),Error\n';
      const csvRows = results.map(row => 
        `${row.studentId},"${row.studentName}",${row.status},${row.scoutUpdate},${row.redCrossUpdate},${row.processingTime},"${row.error || ''}"`
      ).join('\n');
      const csvContent = csvHeader + csvRows;
      
      const filename = path.join(outputDir, `scout_redcross_updates_${timestamp}.csv`);
      fs.writeFileSync(filename, csvContent, 'utf-8');
      console.log(`📄 Results saved to: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
    }
    
    // Summary statistics using established pattern
    const avgProcessingTime = results.reduce((sum, item) => sum + item.processingTime, 0) / results.length;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 EXECUTION SUMMARY');
    console.log('='.repeat(50));
    console.log(`⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`📈 Average processing time: ${avgProcessingTime.toFixed(0)}ms`);
    console.log(`👥 Total processed: ${results.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⚠️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Success rate: ${((successCount / results.length) * 100).toFixed(2)}%`);
    console.log('='.repeat(50));
    
  } else {
    console.log('🔒 User is not logged in, ending session');
    throw new Error('User must be logged in to perform updates');
  }
});
