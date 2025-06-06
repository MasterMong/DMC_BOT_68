import { test, expect } from './fixtures/cdp-fixtures';
import 'dotenv/config';
import { CsvDataHandler } from '../src/utils/csv-data-handler';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test suite for updating swimming skills (ทักษะการว่ายน้ำ) for students
 * This test loads student data from CSV and updates swimming skills based on the data
 */
test('CDP: Update student swimming skills', async ({ cdpPage }) => {
  // test.setTimeout(600000); // 10 minutes

  const dmcPortalUrl = process.env.DMC_PORTAL_URL || 'https://portal.bopp-obec.info/obec68';
  const schoolCode = process.env.SCHOOL_CODE || '36022006';
  
  // Navigate to the DMC portal
  await cdpPage.goto(`${dmcPortalUrl}/`);
  await cdpPage.waitForLoadState('networkidle');
  await expect(cdpPage).toHaveTitle(/ระบบจัดเก็บข้อมูลนักเรียนรายบุคคล Data Management Center/);

  // Check if user is already logged in
  if (await cdpPage.getByRole('link', { name: '- ดาวน์โหลดรายชื่อนักเรียน (สร้างวันละครั้ง เวลา 2:00 น.)' }).isVisible()) {
    console.log('\n🟢 User is already logged in');
    
    // Load student data from CSV
    const csvHandler = CsvDataHandler.getInstance();
    const csvFileName = process.env.CSV_FILE_NAME || 'data.csv';
    const csvFilePath = path.join(__dirname, '../data/', csvFileName);
    
    let studentRecords;
    try {
      studentRecords = csvHandler.loadStudentData(csvFilePath);
      console.log(`📁 Loaded ${studentRecords.length} students from ${csvFileName}`);
    } catch (error) {
      console.error('❌ Error loading CSV file:', error.message);
      return;
    }

    // Filter students who have valid student IDs and swimming skills data
    const studentsToUpdate = studentRecords.filter(student => 
      student.studentId && 
      student.studentId.trim() !== '' &&
      student.swimmingSkills !== undefined &&
      student.swimmingSkills !== ''
    );

    console.log(`🏊 Found ${studentsToUpdate.length} students with swimming skills data to update`);

    const results = [];
    const startTime = Date.now();

    for (let i = 0; i < studentsToUpdate.length; i++) {
      const student = studentsToUpdate[i];
      const itemStartTime = Date.now();
      const progress = `[${(i + 1).toString().padStart(studentsToUpdate.length.toString().length, ' ')}/${studentsToUpdate.length}]`;
      const percentage = `(${((i + 1) / studentsToUpdate.length * 100).toFixed(1)}%)`;
      
      console.log(`${progress} ${percentage} Processing: ${student.studentId} - ${student.firstName} ${student.lastName}`);

      try {
        // Navigate to student edit page using student ID and school code
        const editUrl = `${dmcPortalUrl}/student/${student.studentId}:${schoolCode}/edit`;
        await cdpPage.goto(editUrl);
        await cdpPage.waitForLoadState('networkidle');

        // Check if we're on the correct student edit page
        if (await cdpPage.getByRole('heading', { name: 'ข้อมูลเบื้องต้น' }).isVisible()) {
          // Navigate to student details section
          await cdpPage.getByRole('link', { name: 'รายละเอียดนักเรียน' }).click();
          await cdpPage.waitForLoadState('networkidle');

          // Update swimming skills based on CSV data
          const swimmingValue = student.swimmingSkills;
          let success = false;

          try {
            if (swimmingValue === '1' || swimmingValue === 'True' || swimmingValue === 'true' || swimmingValue === 'TRUE') {
              // Check if swimming skills checkbox exists
              const swimmingCheckbox = cdpPage.locator('#swimmableFlag1');
              if (await swimmingCheckbox.isVisible({ timeout: 5000 })) {
                // Check current state before clicking
                const isCurrentlyChecked = await swimmingCheckbox.isChecked();
                if (!isCurrentlyChecked) {
                  await swimmingCheckbox.check();
                  success = true;
                  console.log(`🏊 Set swimming to TRUE for ${student.studentId}`);
                } else {
                  success = true;
                  console.log(`✓ Swimming already set to TRUE for ${student.studentId}`);
                }
              } else {
                console.log(`⚠️  Swimming checkbox not found for ${student.studentId}`);
              }
            } else if (swimmingValue === '0' || swimmingValue === 'False' || swimmingValue === 'false' || swimmingValue === 'FALSE') {
              // Check if swimming skills checkbox exists
              const swimmingCheckbox = cdpPage.locator('#swimmableFlag1');
              if (await swimmingCheckbox.isVisible({ timeout: 5000 })) {
                // Check current state before clicking
                const isCurrentlyChecked = await swimmingCheckbox.isChecked();
                if (isCurrentlyChecked) {
                  await swimmingCheckbox.uncheck();
                  success = true;
                  console.log(`🚫 Set swimming to FALSE for ${student.studentId}`);
                } else {
                  success = true;
                  console.log(`✓ Swimming already set to FALSE for ${student.studentId}`);
                }
              } else {
                console.log(`⚠️  Swimming checkbox not found for ${student.studentId}`);
              }
            } else {
              console.log(`⚠️  Unknown swimming value: ${swimmingValue} for ${student.studentId}`);
            }

            if (success) {
              // Wait a moment before saving
              await cdpPage.waitForTimeout(500);
              
              // Check if save button exists and is clickable
              const saveButton = cdpPage.getByRole('button', { name: 'บันทึก' });
              if (await saveButton.isVisible({ timeout: 5000 })) {
                await saveButton.click();
                await cdpPage.waitForTimeout(2000); // Wait for save to complete
                
                const processingTime = Date.now() - itemStartTime;
                results.push({
                  studentId: student.studentId,
                  studentName: `${student.firstName} ${student.lastName}`,
                  swimmingValue: swimmingValue,
                  status: 'success',
                  processingTime
                });

                console.log(`✅ Updated swimming skills for ${student.studentId}`);
              } else {
                results.push({
                  studentId: student.studentId,
                  studentName: `${student.firstName} ${student.lastName}`,
                  swimmingValue: swimmingValue,
                  status: 'save_button_not_found',
                  processingTime: Date.now() - itemStartTime
                });
                console.log(`⚠️  Save button not found for ${student.studentId}`);
              }
            } else {
              results.push({
                studentId: student.studentId,
                studentName: `${student.firstName} ${student.lastName}`,
                swimmingValue: swimmingValue,
                status: 'invalid_value',
                processingTime: Date.now() - itemStartTime
              });
            }
          } catch (swimmingError) {
            console.error(`⚠️ Swimming update error for ${student.studentId}: ${swimmingError.message}`);
            results.push({
              studentId: student.studentId,
              studentName: `${student.firstName} ${student.lastName}`,
              swimmingValue: swimmingValue,
              status: 'swimming_update_error',
              error: swimmingError.message,
              processingTime: Date.now() - itemStartTime
            });
          }
        } else {
          results.push({
            studentId: student.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            swimmingValue: student.swimmingSkills,
            status: 'student_not_found',
            processingTime: Date.now() - itemStartTime
          });

          console.log(`❌ Student not found: ${student.studentId}`);
        }

        // Rate limiting between requests
        if (i < studentsToUpdate.length - 1) {
          await cdpPage.waitForTimeout(1500); // Increased delay
        }

      } catch (error) {
        console.error(`⚠️ Error processing ${student.studentId}: ${error.message}`);
        
        const processingTime = Date.now() - itemStartTime;
        results.push({
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          swimmingValue: student.swimmingSkills,
          status: 'error',
          error: error.message,
          processingTime
        });

        // Recovery attempt
        try {
          console.log('🔄 Attempting to recover...');
          await cdpPage.goto(`${dmcPortalUrl}/`, { timeout: 10000 });
          await cdpPage.waitForTimeout(2000);
          console.log('✅ Recovery successful');
        } catch (recoveryError) {
          console.error('❌ Failed to recover');
        }
      }
    }

    // Save results to CSV
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, '../output');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const csvHeader = 'StudentID,StudentName,SwimmingValue,Status,ProcessingTime(ms),Error\n';
    const csvRows = results.map(row => 
      `"${row.studentId}","${row.studentName}","${row.swimmingValue}","${row.status}",${row.processingTime || 0},"${row.error || ''}"`
    ).join('\n');
    const csvContent = csvHeader + csvRows;

    const outputFileName = path.join(outputDir, `swimming_skills_update_${timestamp}.csv`);
    fs.writeFileSync(outputFileName, csvContent, 'utf-8');

    // Calculate and display summary
    const totalTime = Date.now() - startTime;
    const successCount = results.filter(item => item.status === 'success').length;
    const errorCount = results.filter(item => item.status === 'error').length;
    const notFoundCount = results.filter(item => item.status === 'student_not_found').length;
    const invalidValueCount = results.filter(item => item.status === 'invalid_value').length;
    const avgProcessingTime = results.reduce((sum, item) => sum + (item.processingTime || 0), 0) / results.length;

    console.log('\n' + '='.repeat(60));
    console.log('🏊 SWIMMING SKILLS UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`📈 Average processing time: ${avgProcessingTime.toFixed(0)}ms`);
    console.log(`👥 Total processed: ${results.length}`);
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`🔍 Students not found: ${notFoundCount}`);
    console.log(`⚠️  Invalid swimming values: ${invalidValueCount}`);
    console.log(`📊 Success rate: ${((successCount / results.length) * 100).toFixed(2)}%`);
    console.log(`📁 Results saved to: ${outputFileName}`);
    console.log('='.repeat(60));

  } else {
    console.log('🔒 User is not logged in, ending session');
  }
});


