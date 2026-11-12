/* Admin-only resumable setup. All changes use authenticated WordPress AJAX + nonce. */
(() => {
  const form = document.getElementById('mhc-setup-form');
  if (!form) return;
  const status = document.getElementById('mhc-setup-progress');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const mode = event.submitter?.value || 'continue';
    const data = new FormData(form);
    data.set('action', 'mhc_setup');
    data.set('mode', mode);
    if (mode === 'retry') data.set('offset', '0');
    const buttons = [...form.querySelectorAll('button')];
    buttons.forEach(button => { button.disabled = true; });
    status.textContent = 'راه‌اندازی در حال اجراست؛ این صفحه را باز نگه دارید…';
    status.dataset.state = 'running';
    try {
      while (true) {
        const response = await fetch(mhcSetup.url, { method: 'POST', body: data, credentials: 'same-origin' });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.data?.message || 'پاسخ معتبر دریافت نشد؛ صفحه را تازه کرده و ادامه را بزنید.');
        const result = payload.data;
        document.getElementById('mhc-setup-summary').textContent = JSON.stringify(result.summary || result.pages, null, 2);
        if (result.report) document.getElementById('mhc-import-details').textContent = JSON.stringify(result.report, null, 2);
        if (result.next !== undefined) {
          data.set('offset', String(result.next));
          form.elements.offset.value = result.next;
        }
        if (result.done) {
          status.textContent = mode === 'pages' && !result.failed ? 'برگه‌ها ساخته و اتصال‌ها بررسی شدند. ورود محصولات را جداگانه اجرا کنید.' : result.failed ? `عملیات با ${result.failed} خطا پایان یافت. گزارش را بررسی و پس از رفع علت بازآزمایی کنید.` : 'راه‌اندازی با موفقیت پایان یافت. محصولات واقعی در محصولات ← همه محصولات و فروشگاه در دسترس‌اند. برای به‌روزرسانی جدول صفحات، صفحه را تازه کنید.';
          status.dataset.state = result.failed ? 'error' : 'done';
          break;
        }
        status.textContent = `پیشرفت: ${result.next} از ${result.total} — خطا: ${result.failed}`;
        data.set('mode', 'batch');
      }
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = `متوقف شد: ${error.message} — داده‌های ذخیره‌شده حفظ شده‌اند؛ پس از بررسی، ادامه را بزنید.`;
    } finally { buttons.forEach(button => { button.disabled = false; }); }
  });
})();
