import { test, expect } from './fixtures/cdp-fixtures';
import 'dotenv/config';
import { CsvDataHandler } from '../src/utils/csv-data-handler';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test suite for updating weight (น้ำหนัก) and height (ส่วนสูง) for students
 * This test loads student data from CSV and updates health information based on the data
 */
test('CDP: Update student weight and height', async ({ cdpPage }) => {
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
      console.error('❌ Error loading CSV file:', error instanceof Error ? error.message : String(error));
      return;
    }

    // Filter students who have valid student IDs and weight/height data
    const studentsToUpdate = studentRecords.filter(student => 
      student.studentId && 
      student.studentId.trim() !== '' &&
      (student.weight !== undefined && student.weight !== null && student.weight !== 0) ||
      (student.height !== undefined && student.height !== null && student.height !== 0)
    );

    console.log(`⚖️  Found ${studentsToUpdate.length} students with weight/height data to update`);

    const results = [];
    const startTime = Date.now();

    for (let i = 0; i < studentsToUpdate.length; i++) {
      const student = studentsToUpdate[i];
      const itemStartTime = Date.now();
      const progress = `[${(i + 1).toString().padStart(studentsToUpdate.length.toString().length, ' ')}/${studentsToUpdate.length}]`;
      const percentage = `(${((i + 1) / studentsToUpdate.length * 100).toFixed(1)}%)`;
      
      console.log(`${progress} ${percentage} Processing: ${student.studentId} - ${student.firstName} ${student.lastName} (Weight: ${student.weight}, Height: ${student.height})`);

      try {
        // Navigate to student edit page using student ID and school code
        const editUrl = `${dmcPortalUrl}/student/${student.studentId}:${schoolCode}/edit`;
        await cdpPage.goto(editUrl);
        await cdpPage.waitForLoadState('networkidle');

        // Check if we're on the correct student edit page
        if (await cdpPage.getByRole('heading', { name: 'ข้อมูลเบื้องต้น' }).isVisible()) {
          // Navigate to health tab (สุขภาพ)
          await cdpPage.getByRole('link', { name: 'สุขภาพ' }).click();
          await cdpPage.waitForLoadState('networkidle');

          let weightSuccess = false;
          let heightSuccess = false;
          let updateMade = false;

          try {
            // Update weight if data is available
            if (student.weight !== undefined && student.weight !== null && student.weight !== 0) {
              const weightInput = cdpPage.locator('input[name="weight"]');
              if (await weightInput.isVisible({ timeout: 5000 })) {
                // Clear the field and enter new value
                await weightInput.click();
                await weightInput.selectText();
                await weightInput.fill(student.weight.toString());
                weightSuccess = true;
                updateMade = true;
                console.log(`⚖️  Set weight to ${student.weight} for ${student.studentId}`);
              } else {
                console.log(`⚠️  Weight input field not found for ${student.studentId}`);
              }
            }

            // Update height if data is available
            if (student.height !== undefined && student.height !== null && student.height !== 0) {
              const heightInput = cdpPage.locator('input[name="height"]');
              if (await heightInput.isVisible({ timeout: 5000 })) {
                // Clear the field and enter new value
                await heightInput.click();
                await heightInput.selectText();
                await heightInput.fill(student.height.toString());
                heightSuccess = true;
                updateMade = true;
                console.log(`📏 Set height to ${student.height} for ${student.studentId}`);
              } else {
                console.log(`⚠️  Height input field not found for ${student.studentId}`);
              }
            }

            if (updateMade) {
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
                  weight: student.weight,
                  height: student.height,
                  weightUpdated: weightSuccess,
                  heightUpdated: heightSuccess,
                  status: 'success',
                  processingTime
                });

                console.log(`✅ Updated health data for ${student.studentId}`);
              } else {
                results.push({
                  studentId: student.studentId,
                  studentName: `${student.firstName} ${student.lastName}`,
                  weight: student.weight,
                  height: student.height,
                  weightUpdated: weightSuccess,
                  heightUpdated: heightSuccess,
                  status: 'save_button_not_found',
                  processingTime: Date.now() - itemStartTime
                });
                console.log(`⚠️  Save button not found for ${student.studentId}`);
              }
            } else {
              results.push({
                studentId: student.studentId,
                studentName: `${student.firstName} ${student.lastName}`,
                weight: student.weight,
                height: student.height,
                weightUpdated: false,
                heightUpdated: false,
                status: 'no_valid_data',
                processingTime: Date.now() - itemStartTime
              });
              console.log(`⚠️  No valid weight/height data for ${student.studentId}`);
            }
          } catch (healthError) {
            console.error(`⚠️ Health update error for ${student.studentId}: ${healthError instanceof Error ? healthError.message : String(healthError)}`);
            results.push({
              studentId: student.studentId,
              studentName: `${student.firstName} ${student.lastName}`,
              weight: student.weight,
              height: student.height,
              weightUpdated: false,
              heightUpdated: false,
              status: 'health_update_error',
              error: healthError instanceof Error ? healthError.message : String(healthError),
              processingTime: Date.now() - itemStartTime
            });
          }
        } else {
          results.push({
            studentId: student.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            weight: student.weight,
            height: student.height,
            weightUpdated: false,
            heightUpdated: false,
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
        console.error(`⚠️ Error processing ${student.studentId}: ${error instanceof Error ? error.message : String(error)}`);
        
        const processingTime = Date.now() - itemStartTime;
        results.push({
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          weight: student.weight,
          height: student.height,
          weightUpdated: false,
          heightUpdated: false,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
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

    const csvHeader = 'StudentID,StudentName,Weight,Height,WeightUpdated,HeightUpdated,Status,ProcessingTime(ms),Error\n';
    const csvRows = results.map(row => 
      `"${row.studentId}","${row.studentName}",${row.weight || ''},${row.height || ''},"${row.weightUpdated}","${row.heightUpdated}","${row.status}",${row.processingTime || 0},"${row.error || ''}"`
    ).join('\n');
    const csvContent = csvHeader + csvRows;

    const outputFileName = path.join(outputDir, `health_data_update_${timestamp}.csv`);
    fs.writeFileSync(outputFileName, csvContent, 'utf-8');

    // Calculate and display summary
    const totalTime = Date.now() - startTime;
    const successCount = results.filter(item => item.status === 'success').length;
    const errorCount = results.filter(item => item.status === 'error').length;
    const notFoundCount = results.filter(item => item.status === 'student_not_found').length;
    const noDataCount = results.filter(item => item.status === 'no_valid_data').length;
    const weightUpdatedCount = results.filter(item => item.weightUpdated).length;
    const heightUpdatedCount = results.filter(item => item.heightUpdated).length;
    const avgProcessingTime = results.reduce((sum, item) => sum + (item.processingTime || 0), 0) / results.length;

    console.log('\n' + '='.repeat(60));
    console.log('⚖️📏 HEALTH DATA UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`📈 Average processing time: ${avgProcessingTime.toFixed(0)}ms`);
    console.log(`👥 Total processed: ${results.length}`);
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`⚖️  Weight fields updated: ${weightUpdatedCount}`);
    console.log(`📏 Height fields updated: ${heightUpdatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`🔍 Students not found: ${notFoundCount}`);
    console.log(`⚠️  No valid data: ${noDataCount}`);
    console.log(`📊 Success rate: ${((successCount / results.length) * 100).toFixed(2)}%`);
    console.log(`📁 Results saved to: ${outputFileName}`);
    console.log('='.repeat(60));

  } else {
    console.log('🔒 User is not logged in, ending session');
  }
});
