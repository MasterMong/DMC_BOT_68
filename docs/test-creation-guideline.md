# DMC_BOT_68 Test Creation Guideline

This document provides comprehensive guidelines for creating new tests in the DMC_BOT_68 project. The project uses Playwright with TypeScript for automated testing of the DMC (Data Management Center) portal.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Test Structure](#test-structure)
3. [Environment Configuration](#environment-configuration)
4. [Common Patterns](#common-patterns)
5. [CSV Data Handling](#csv-data-handling)
6. [Test Templates](#test-templates)
7. [Best Practices](#best-practices)
8. [Output Management](#output-management)
9. [Error Handling](#error-handling)

## Project Overview

The DMC_BOT_68 project automates interactions with the Thai education system's Data Management Center portal. It includes functionality for:

- Student authentication and login
- Student data verification by CID and Student ID
- Classroom management and updates
- CSV data processing and validation

## Test Structure

### File Organization

```
tests/
├── fixtures/
│   └── cdp-fixtures.ts          # Playwright fixtures
├── dmc-login.spec.ts           # Login functionality
├── dmc-check-stu-by-cid.spec.ts # Student check by CID
├── dmc-check-stu-by-id.spec.ts  # Student check by Student ID
├── dmc-change-classroom.spec.ts # Classroom management
└── dmc-template.spec.ts        # Basic template

src/
└── utils/
    └── csv-data-handler.ts     # CSV processing utilities

data/
├── stu.csv                     # Student data (Thai headers)
├── data.csv                    # Student data (different format)
└── .gitignore                  # Data file exclusions

config/
└── data-dictionary.json       # Field definitions and validation
```

### Basic Test Structure

```typescript
import { test, expect } from './fixtures/cdp-fixtures';
import 'dotenv/config';

test('CDP: Your Test Name', async ({ cdpPage }) => {
  // Test implementation
});
```

## Environment Configuration

### Required Environment Variables

```properties
# DMC Portal Configuration
DMC_PORTAL_URL=https://portal.bopp-obec.info/obec68
SCHOOL_CODE=36022006
EDUCATION_YEAR=2568

# Grade Level Codes (LEVEL_DTL_CODE)
# 01-03: Kindergarten (อนุบาล 1-3)
# 04-09: Primary (ประถมศึกษาปีที่ 1-6)
# 10-15: Secondary (มัธยมศึกษาปีที่ 1-6)
# 16-18: Vocational (ประกาศนียบัตรวิชาชีพปีที่ 1-3)
LEVEL_DTL_CODE=11

# CSV Configuration
CSV_FILE_NAME=data.csv
```

### Grade Level Reference

| Code | Thai Name | English Name |
|------|-----------|--------------|
| 01-03 | อนุบาล 1-3 | Kindergarten 1-3 |
| 04-09 | ประถมศึกษาปีที่ 1-6 | Primary 1-6 |
| 10-15 | มัธยมศึกษาปีที่ 1-6 | Secondary 1-6 |
| 16-18 | ประกาศนียบัตรวิชาชีพปีที่ 1-3 | Vocational Certificate 1-3 |

## Common Patterns

### 1. Login Check Pattern

```typescript
// Check if user is already logged in
if (await cdpPage.getByRole('link', { name: '- ดาวน์โหลดรายชื่อนักเรียน (สร้างวันละครั้ง เวลา 2:00 น.)' }).isVisible()) {
  console.log('🟢 User is already logged in');
  // Test logic here
} else {
  console.log('🔒 User is not logged in, ending session');
}
```

### 2. Navigation Pattern

```typescript
const dmcPortalUrl = process.env.DMC_PORTAL_URL || 'https://portal.bopp-obec.info/obec68';
await cdpPage.goto(`${dmcPortalUrl}/`);
await cdpPage.waitForLoadState('networkidle');
await expect(cdpPage).toHaveTitle(/ระบบจัดเก็บข้อมูลนักเรียนรายบุคคล Data Management Center/);
```

### 3. Error Recovery Pattern

```typescript
try {
  // Test operations
} catch (error) {
  console.error(`⚠️ Error: ${error.message}`);
  
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
```

## CSV Data Handling

### Loading Student Data

```typescript
import { CsvDataHandler } from '../src/utils/csv-data-handler';

const csvHandler = CsvDataHandler.getInstance();
const csvFileName = process.env.CSV_FILE_NAME || 'data.csv';
const csvFilePath = path.join(__dirname, '../data/', csvFileName);

try {
  const studentRecords = csvHandler.loadStudentData(csvFilePath);
  console.log(`📁 Loaded ${studentRecords.length} students from ${csvFileName}`);
} catch (error) {
  console.error('❌ Error loading CSV file:', error.message);
  return;
}
```

### Data Mapping Examples

```typescript
// Extract specific fields
const studentCids = studentRecords.map(student => student.studentCid).filter(cid => cid.trim() !== '');
const studentIds = studentRecords.map(student => student.studentNumber).filter(id => id.trim() !== '');

// Create custom data structure
const students = studentRecords.map(student => ({
  cid: student.studentCid,
  id: student.studentNumber,
  room: student.room,
  firstName: student.firstName,
  lastName: student.lastName
}));
```

## Test Templates

### 1. Student Verification Test Template

```typescript
test('CDP: Verify students by [FIELD]', async ({ cdpPage }) => {
  test.setTimeout(300000); // 5 minutes
  
  const dmcPortalUrl = process.env.DMC_PORTAL_URL || 'https://portal.bopp-obec.info/obec68';
  await cdpPage.goto(`${dmcPortalUrl}/`);
  await cdpPage.waitForLoadState('networkidle');
  
  if (await cdpPage.getByRole('link', { name: '- ดาวน์โหลดรายชื่อนักเรียน (สร้างวันละครั้ง เวลา 2:00 น.)' }).isVisible()) {
    // Load data
    const csvHandler = CsvDataHandler.getInstance();
    const csvFilePath = path.join(__dirname, '../data/', process.env.CSV_FILE_NAME || 'data.csv');
    const studentRecords = csvHandler.loadStudentData(csvFilePath);
    
    // Process students
    const results = [];
    const startTime = Date.now();
    
    for (let i = 0; i < studentRecords.length; i++) {
      const student = studentRecords[i];
      const itemStartTime = Date.now();
      
      try {
        // Your verification logic here
        const found = await verifyStudent(cdpPage, student);
        const processingTime = Date.now() - itemStartTime;
        
        results.push({
          studentId: student.studentCid,
          status: found,
          processingTime
        });
        
        console.log(`[${i + 1}/${studentRecords.length}] ${student.studentCid}: ${found ? '✅' : '❌'}`);
        
      } catch (error) {
        console.error(`Error processing ${student.studentCid}: ${error.message}`);
      }
    }
    
    // Save results
    await saveResults(results, 'verification_results');
  }
});
```

### 2. Data Update Test Template

```typescript
test('CDP: Update student [FIELD]', async ({ cdpPage }) => {
  test.setTimeout(600000); // 10 minutes
  
  const dmcPortalUrl = process.env.DMC_PORTAL_URL || 'https://portal.bopp-obec.info/obec68';
  await cdpPage.goto(`${dmcPortalUrl}/`);
  
  if (await cdpPage.getByRole('link', { name: '- ดาวน์โหลดรายชื่อนักเรียน (สร้างวันละครั้ง เวลา 2:00 น.)' }).isVisible()) {
    // Load and process data
    const results = [];
    
    for (const student of students) {
      try {
        // Navigate to update section
        await navigateToUpdateSection(cdpPage);
        
        // Search for student
        await searchStudent(cdpPage, student);
        
        // Update field
        const success = await updateStudentField(cdpPage, student);
        
        results.push({
          studentId: student.cid,
          status: success ? 'success' : 'failed'
        });
        
      } catch (error) {
        results.push({
          studentId: student.cid,
          status: 'error',
          error: error.message
        });
      }
    }
    
    await saveResults(results, 'update_results');
  }
});
```

## Best Practices

### 1. Timeouts and Waits

```typescript
// Set appropriate test timeout
test.setTimeout(300000); // 5 minutes for verification tests
test.setTimeout(600000); // 10 minutes for update tests

// Use specific waits
await cdpPage.waitForLoadState('networkidle');
await cdpPage.waitForTimeout(1000); // Rate limiting between requests
await cdpPage.isVisible('selector', { timeout: 5000 }); // Element visibility
```

### 2. Progress Tracking

```typescript
const progress = `[${(i + 1).toString().padStart(total.toString().length, ' ')}/${total}]`;
const percentage = `(${((i + 1) / total * 100).toFixed(1)}%)`;
console.log(`${progress} ${percentage} Processing: ${identifier}`);
```

### 3. Performance Monitoring

```typescript
const itemStartTime = Date.now();
// Processing logic
const processingTime = Date.now() - itemStartTime;

// Track in results
results.push({
  identifier,
  status,
  processingTime
});
```

### 4. Rate Limiting

```typescript
// Add delays between requests
if (i < items.length - 1) {
  await cdpPage.waitForTimeout(1000); // 1 second delay
}
```

## Output Management

### CSV Output Format

```typescript
const csvHeader = 'Identifier,Status,ProcessingTime(ms),Error\n';
const csvRows = results.map(row => 
  `${row.identifier},${row.status},${row.processingTime || 0},"${row.error || ''}"`
).join('\n');
const csvContent = csvHeader + csvRows;

// Save with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = path.join(__dirname, '../output', `test_results_${timestamp}.csv`);
fs.writeFileSync(filename, csvContent, 'utf-8');
```

### Summary Statistics

```typescript
const successCount = results.filter(item => item.status === 'success').length;
const errorCount = results.filter(item => item.status === 'error').length;
const avgProcessingTime = results.reduce((sum, item) => sum + (item.processingTime || 0), 0) / results.length;

console.log('\n' + '='.repeat(50));
console.log('📊 EXECUTION SUMMARY');
console.log('='.repeat(50));
console.log(`⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)}s`);
console.log(`📈 Average processing time: ${avgProcessingTime.toFixed(0)}ms`);
console.log(`👥 Total processed: ${results.length}`);
console.log(`✅ Successful: ${successCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`📊 Success rate: ${((successCount / results.length) * 100).toFixed(2)}%`);
```

## Error Handling

### Common Error Patterns

```typescript
// Navigation errors
try {
  await cdpPage.goto(url, { timeout: 30000, waitUntil: 'domcontentloaded' });
} catch (error) {
  console.error(`Navigation failed: ${error.message}`);
}

// Element interaction errors
try {
  await cdpPage.getByRole('button', { name: 'Submit' }).click();
} catch (error) {
  console.error(`Button click failed: ${error.message}`);
}

// Data processing errors
try {
  const studentRecords = csvHandler.loadStudentData(csvFilePath);
} catch (error) {
  console.error('CSV loading failed:', error.message);
  return; // Exit test early
}
```

### Recovery Strategies

```typescript
// Page recovery
async function recoverPage(cdpPage, dmcPortalUrl) {
  try {
    await cdpPage.goto(`${dmcPortalUrl}/`, { timeout: 10000 });
    await cdpPage.waitForTimeout(2000);
    return true;
  } catch {
    return false;
  }
}

// Retry mechanism
async function retryOperation(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

## URL Construction Patterns

### Student Search URLs

```typescript
// Search by CID
const searchByCidUrl = `${dmcPortalUrl}/studentprogram/add?schoolCode=${schoolCode}&studentNo=&cifNo=${studentCid}&cifType=&educationYear=${educationYear}&levelDtlCode=${levelDtlCode}&classroom=&firstNameTh=&lastNameTh=&action=search`;

// Search by Student ID
const searchByIdUrl = `${dmcPortalUrl}/studentprogram/add?schoolCode=${schoolCode}&studentNo=${studentId}&cifNo=&cifType=&educationYear=${educationYear}&levelDtlCode=${levelDtlCode}&classroom=&firstNameTh=&lastNameTh=&action=search`;
```

### Navigation Patterns

```typescript
// Menu navigation
await cdpPage.getByText('โรงเรียน', { exact: true }).click();
await cdpPage.getByRole('link', { name: '2.7.7' }).click();
await cdpPage.getByRole('link', { name: 'จัดห้องนร/แก้ไขชั้นเรียน' }).click();
```

## Creating a New Test

### Step-by-Step Process

1. **Define Test Purpose**: Clearly identify what functionality you want to test
2. **Choose Template**: Select appropriate template based on test type (verification/update)
3. **Configure Environment**: Set required environment variables
4. **Prepare Data**: Ensure CSV data is properly formatted
5. **Implement Logic**: Add specific test logic using common patterns
6. **Add Error Handling**: Implement appropriate error handling and recovery
7. **Test Output**: Configure result saving and summary statistics
8. **Test Execution**: Run test with appropriate timeout settings

### Example: Creating a Grade Update Test

```typescript
import { test, expect } from './fixtures/cdp-fixtures';
import 'dotenv/config';
import { CsvDataHandler } from '../src/utils/csv-data-handler';
import * as fs from 'fs';
import * as path from 'path';

test('CDP: Update student grades', async ({ cdpPage }) => {
  test.setTimeout(600000); // 10 minutes

  const dmcPortalUrl = process.env.DMC_PORTAL_URL || 'https://portal.bopp-obec.info/obec68';
  await cdpPage.goto(`${dmcPortalUrl}/`);
  await cdpPage.waitForLoadState('networkidle');

  if (await cdpPage.getByRole('link', { name: '- ดาวน์โหลดรายชื่อนักเรียน (สร้างวันละครั้ง เวลา 2:00 น.)' }).isVisible()) {
    console.log('\n🟢 User is already logged in');
    
    // Load student data
    const csvHandler = CsvDataHandler.getInstance();
    const csvFilePath = path.join(__dirname, '../data/', process.env.CSV_FILE_NAME || 'data.csv');
    const studentRecords = csvHandler.loadStudentData(csvFilePath);
    
    const results = [];
    const startTime = Date.now();
    
    for (let i = 0; i < studentRecords.length; i++) {
      const student = studentRecords[i];
      
      try {
        // Navigate to grade update section
        await cdpPage.getByText('นักเรียน', { exact: true }).click();
        await cdpPage.getByRole('link', { name: 'แก้ไขข้อมูลนักเรียน' }).click();
        
        // Search and update logic here
        // ... implementation details ...
        
        results.push({
          studentId: student.studentCid,
          status: 'success',
          processingTime: Date.now() - itemStartTime
        });
        
      } catch (error) {
        results.push({
          studentId: student.studentCid,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // Save results and show summary
    await saveResultsToCSV(results, 'grade_updates');
    showSummary(results, Date.now() - startTime);
  }
});
```

This guideline provides a comprehensive foundation for creating new tests in the DMC_BOT_68 project. Follow these patterns and best practices to ensure consistent, reliable, and maintainable test code.