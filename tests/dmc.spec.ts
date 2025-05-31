import { test, expect } from './fixtures/cdp-fixtures';

test('CDP: Login DMC', async ({ cdpPage }) => {
  await cdpPage.goto('https://portal.bopp-obec.info/obec68/');

  if (await cdpPage.getByRole('link', { name: '- ดาวน์โหลดรายชื่อนักเรียน (สร้างวันละครั้ง เวลา 2:00 น.)' }).isVisible()) {
    await cdpPage.getByRole('link', { name: 'ออกจากระบบ' }).click();
  }


  // Expect a title "to contain" a substring.
  await expect(cdpPage).toHaveTitle(/ระบบจัดเก็บข้อมูลนักเรียนรายบุคคล Data Management Center/);

  await cdpPage.getByRole('link', { name: 'เข้าระบบ' }).click();
  await cdpPage.getByText('Login ด้วย ThaiD').click();
  await expect(cdpPage.getByRole('heading', { name: 'คิวอาร์โค้ดนี้เป็นสิ่งยืนยันตนทางดิจิทัล ออกให้โดย' })).toBeVisible();

  // Wait for page redirect to the landing page
  await cdpPage.waitForURL('https://portal.bopp-obec.info/obec68/auth/landing');

  await expect(cdpPage.getByRole('heading', { name: 'กรุณาเลือก User' })).toBeVisible();
  await cdpPage.locator('#uid').check();
  await cdpPage.getByRole('button', { name: 'เข้าใช้งานระบบ' }).click();
  await expect(cdpPage.getByRole('link', { name: '- ดาวน์โหลดรายชื่อนักเรียน (สร้างวันละครั้ง เวลา 2:00 น.)' })).toBeVisible();
});
