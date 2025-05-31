import { test, expect } from './fixtures/cdp-fixtures';
import 'dotenv/config';

/**
 * Test suite for DMC (Data Management Center) login functionality
 * This test verifies the complete login flow using ThaiD authentication
 */
test('CDP: Login DMC', async ({ cdpPage }) => {
  // Navigate to the DMC portal
  const dmcPortalUrl = process.env.DMC_PORTAL_URL || 'https://portal.bopp-obec.info/obec68';
  await cdpPage.goto(`${dmcPortalUrl}/`);
  await cdpPage.waitForLoadState('networkidle');

  // Check if user is already logged in and logout if necessary
  if (await cdpPage.getByRole('link', { name: '- ดาวน์โหลดรายชื่อนักเรียน (สร้างวันละครั้ง เวลา 2:00 น.)' }).isVisible()) {
    await cdpPage.getByRole('link', { name: 'ออกจากระบบ' }).click();
    await cdpPage.waitForLoadState('networkidle');
  }

  // Verify we're on the correct DMC portal page
  await expect(cdpPage).toHaveTitle(/ระบบจัดเก็บข้อมูลนักเรียนรายบุคคล Data Management Center/);
  
  // Initiate login process
  await cdpPage.getByRole('link', { name: 'เข้าระบบ' }).click();
  await cdpPage.waitForLoadState('networkidle');
  
  // Select ThaiD authentication method
  await cdpPage.getByText('Login ด้วย ThaiD').click();
  await cdpPage.waitForLoadState('networkidle');
  
  // Verify ThaiD QR code authentication page is displayed
  await expect(cdpPage.getByRole('heading', { name: 'คิวอาร์โค้ดนี้เป็นสิ่งยืนยันตนทางดิจิทัล ออกให้โดย' })).toBeVisible();

  // Wait for successful authentication and redirect to landing page
  await cdpPage.waitForURL(`${dmcPortalUrl}/auth/landing`);
  await cdpPage.waitForLoadState('networkidle');
  
  // Verify user selection page is displayed
  await expect(cdpPage.getByRole('heading', { name: 'กรุณาเลือก User' })).toBeVisible();
  
  // Select user account and proceed to system
  await cdpPage.locator('#uid').check();
  await cdpPage.getByRole('button', { name: 'เข้าใช้งานระบบ' }).click();
  await cdpPage.waitForLoadState('networkidle');
  
  // Verify successful login by checking for authenticated user content
  await expect(cdpPage.getByRole('link', { name: '- ดาวน์โหลดรายชื่อนักเรียน (สร้างวันละครั้ง เวลา 2:00 น.)' })).toBeVisible();
});
