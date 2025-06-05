import { test, expect } from './fixtures/cdp-fixtures';
import 'dotenv/config';

/**
 * Test suite for DMC (Data Management Center) login functionality
 * This test verifies the complete login flow using ThaiD authentication
 */
test('CDP: Go to school info page', async ({ cdpPage }) => {
  // Navigate to the DMC portal
  const dmcPortalUrl = process.env.DMC_PORTAL_URL || 'https://portal.bopp-obec.info/obec68';
  await cdpPage.goto(`${dmcPortalUrl}/`);
  await cdpPage.waitForLoadState('networkidle');
  await expect(cdpPage).toHaveTitle(/ระบบจัดเก็บข้อมูลนักเรียนรายบุคคล Data Management Center/);

  // Check if user is already logged in
  if (await cdpPage.getByRole('link', { name: '- ดาวน์โหลดรายชื่อนักเรียน (สร้างวันละครั้ง เวลา 2:00 น.)' }).isVisible()) {
    console.log('User is already logged in');
    // do login flow here
    await cdpPage.goto(`${dmcPortalUrl}/student/38739:36022006/edit`); // replace with actual student ID and school ID
    await cdpPage.waitForLoadState('networkidle');
    await expect(cdpPage.getByRole('heading', { name: 'ข้อมูลเบื้องต้น' })).toBeVisible();
    await cdpPage.getByRole('link', { name: 'รายละเอียดนักเรียน' }).click();
    await cdpPage.locator('#swimmableFlag1').check();
    await cdpPage.getByRole('button', { name: 'บันทึก' }).click();
  } else {
    // end session if user is not logged in
    console.log('User is not logged in, ending session');
  }
});


