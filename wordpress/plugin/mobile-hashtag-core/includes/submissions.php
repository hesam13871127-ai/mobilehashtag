<?php
if (!defined('ABSPATH')) { exit; }
function mhc_scalar($data, $key) { return isset($data[$key]) && is_scalar($data[$key]) ? (string) $data[$key] : ''; }
function mhc_real_email($email) { return is_email($email) && !preg_match('/\.(example|invalid|test)$/i', $email); }
/**
 * Contact form. Field order, labels, layout and button match the approved design source
 * (frontend/contact.html): name + email in one row, then the message, then the submit button.
 * The extra fields the plugin needs (phone fallback and the storage consent the source did
 * not have) are placed after the source fields, in the source's own muted-note slot, so the
 * visible layout of the original form is unchanged. Saving is the real database insert.
 */
function mhc_form($atts = []) {
    $a = shortcode_atts(['type'=>'contact'], $atts);
    $type = in_array($a['type'], ['contact','inquiry','newsletter'], true) ? $a['type'] : 'contact';
    $source = get_permalink() ?: home_url('/');
    $arrow = '<svg class="inline-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6" /></svg>';
    ob_start(); ?>
    <form class="mhc-form form-stack" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" dir="rtl">
    <input type="hidden" name="action" value="mhc_submit"><input type="hidden" name="type" value="<?php echo esc_attr($type); ?>">
    <input type="hidden" name="source_url" value="<?php echo esc_url($source); ?>">
    <?php wp_nonce_field('mhc_submit_' . $type, 'mhc_nonce'); ?>
    <?php if ($type === 'newsletter') : ?>
    <label>ایمیل<input name="email" type="email" required maxlength="254" autocomplete="email" dir="ltr"></label>
    <?php else : ?>
    <div class="form-row">
      <label>نام و نام خانوادگی<input name="name" required minlength="2" maxlength="100" autocomplete="name"></label>
      <label>ایمیل<input name="email" type="email" maxlength="254" autocomplete="email" dir="ltr"></label>
    </div>
    <label>پیام شما<textarea name="message" rows="6" required minlength="10" maxlength="5000"></textarea></label>
    <?php endif; ?>
    <div class="mhc-form-extra">
      <?php if ($type !== 'newsletter') : ?>
      <label class="mhc-phone-field">
        <span class="small muted">اگر ترجیح می‌دهید با تلفن پاسخ بگیرید (اختیاری)</span>
        <input name="phone" type="tel" maxlength="32" dir="ltr" autocomplete="tel" placeholder="۰۹۱۲۰۰۰۰۰۰۰">
      </label>
      <label class="mhc-subject-field"><span class="small muted">موضوع (اختیاری)</span><input name="subject" maxlength="160"></label>
      <?php endif; ?>
      <div class="mhc-honeypot" aria-hidden="true"><label>این کادر را خالی بگذارید<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      <label class="check-label"><input type="checkbox" name="consent" value="1" required> با ذخیرهٔ اطلاعات برای <?php echo $type === 'newsletter' ? 'عضویت در خبرنامه' : 'رسیدگی به پیام'; ?> موافقم.</label>
    </div>
    <button type="submit" class="button dark"><?php echo $type === 'newsletter' ? 'عضویت در خبرنامه' : 'ثبت پیام'; ?><?php echo $type === 'newsletter' ? '' : $arrow; ?></button>
    </form><?php $html=ob_get_clean();
    if ($type==='contact') { $html.='<details class="mhc-inquiry" id="preorder"><summary>درخواست پیش‌خرید یا مشاورهٔ محصول</summary><p>نام کالای موردنظر را در موضوع بنویسید. این درخواست سفارش قطعی یا پرداخت نیست.</p>'.mhc_form(['type'=>'inquiry']).'</details>'; }
    return $html;
}
add_shortcode('mh_contact_form', 'mhc_form');
add_shortcode('mh_newsletter', function () { return mhc_form(['type'=>'newsletter']); });
/** Validation is shared by HTTP and automated tests; no false-success path. */
function mhc_save_submission($data) {
    global $wpdb;
    $type = mhc_scalar($data, 'type');
    if (!in_array($type, ['contact','inquiry','newsletter'], true)) { return new WP_Error('type', 'نوع پیام نامعتبر است.'); }
    if (mhc_scalar($data, 'website') !== '' || mhc_scalar($data, 'consent') !== '1') { return new WP_Error('spam', 'اطلاعات فرم یا رضایت ذخیره‌سازی معتبر نیست.'); }
    $name = sanitize_text_field(mhc_scalar($data, 'name'));
    $phone = sanitize_text_field(mhc_scalar($data, 'phone'));
    $email = sanitize_email(mhc_scalar($data, 'email'));
    $subject = sanitize_text_field(mhc_scalar($data, 'subject'));
    if (mb_strlen($subject) > 160) { return new WP_Error('subject', 'موضوع حداکثر ۱۶۰ نویسه است.'); }
    $message = sanitize_textarea_field(mhc_scalar($data, 'message'));
    if (($type === 'newsletter' && !$email) || ($email && !is_email($email)) || strlen($email) > 254 || $email !== trim(mhc_scalar($data, 'email'))) { return new WP_Error('email', 'ایمیل معتبر وارد کنید.'); }
    if ($type !== 'newsletter' && (mb_strlen($name) < 2 || mb_strlen($name) > 100 || mb_strlen($message) < 10 || mb_strlen($message) > 5000)) { return new WP_Error('validation', 'نام باید ۲ تا ۱۰۰ و پیام ۱۰ تا ۵۰۰۰ نویسه باشد.'); }
    if (strlen($phone) > 32 || ($phone && !preg_match('/^[+0-9۰-۹٠-٩() .-]{7,32}$/u', $phone))) { return new WP_Error('phone', 'شماره تلفن معتبر نیست.'); }
    if (!$email && !$phone) { return new WP_Error('contact', 'برای پاسخ‌گویی، ایمیل یا شماره تلفن را وارد کنید.'); }
    // Never store raw IP addresses. Do not trust spoofable X-Forwarded-For headers.
    $rate_key = 'mhc_rate_' . hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown', wp_salt('nonce'));
    $rate = (int) get_transient($rate_key);
    /**
     * Per-IP submissions allowed per hour. The nonce and the honeypot already filter
     * bots; this ceiling only stops flood abuse and is filterable for sites behind a
     * shared proxy or for automated acceptance testing.
     */
    $limit = max(1, (int) apply_filters('mhc_submission_hourly_limit', 12));
    if ($rate >= $limit) { return new WP_Error('rate', 'درخواست‌های زیادی ثبت شده؛ یک ساعت دیگر تلاش کنید.'); }
    set_transient($rate_key, $rate + 1, HOUR_IN_SECONDS);
    $source = esc_url_raw(mhc_scalar($data, 'source_url'), ['https','http']);
    if (wp_parse_url($source, PHP_URL_HOST) !== wp_parse_url(home_url(), PHP_URL_HOST)) { $source = home_url('/'); }
    // Queries may contain account/order keys; keep only path, never private query parameters.
    $source = strtok($source, '?');
    $row = ['uuid'=>wp_generate_uuid4(), 'created_at'=>current_time('mysql', true), 'type'=>$type, 'status'=>'new', 'name'=>$name, 'phone'=>$phone, 'email'=>$email, 'message'=>$message, 'source_url'=>$source, 'fields'=>wp_json_encode(['subject'=>$subject,'consent'=>true,'type'=>$type,'name'=>$name,'phone'=>$phone,'email'=>$email,'message'=>$message,'source_url'=>$source], JSON_UNESCAPED_UNICODE), 'mail_status'=>'pending', 'mail_error'=>''];
    $ok = $wpdb->insert($wpdb->prefix . 'mh_submissions', $row);
    if ($ok === false) { return new WP_Error('database', 'ذخیرهٔ پیام انجام نشد؛ دوباره تلاش کنید.'); }
    $id = (int) $wpdb->insert_id;
    $s = mhc_settings(); $mail_error = ''; $sent = false;
    $capture = function ($error) use (&$mail_error) { $mail_error = mb_substr(sanitize_text_field($error->get_error_message()), 0, 1000); };
    add_action('wp_mail_failed', $capture);
    if (mhc_real_email($s['recipient'])) {
        try {
            $sent = wp_mail($s['recipient'], 'پیام تازه موبایل هشتگ — ' . $row['uuid'], "نوع: $type\nموضوع: $subject\nنام: $name\nایمیل: $email\nتلفن: $phone\n\n$message\n\nمدیریت: " . admin_url('admin.php?page=mhc-submissions&view=' . $id));
        } catch (Throwable $error) { $mail_error = mb_substr(sanitize_text_field($error->getMessage()), 0, 1000); }
        $mail_status = $sent ? 'accepted' : 'failed';
        if (!$sent && !$mail_error) { $mail_error = 'wp_mail returned false'; }
    } else { $mail_status = 'disabled'; $mail_error = 'گیرندهٔ واقعی تنظیم نشده است.'; }
    remove_action('wp_mail_failed', $capture);
    $wpdb->update($wpdb->prefix . 'mh_submissions', ['mail_status'=>$mail_status, 'mail_error'=>$mail_error], ['id'=>$id]);
    return ['id'=>$id,'uuid'=>$row['uuid'],'mail_status'=>$mail_status];
}
function mhc_submit() {
    $data = wp_unslash($_POST); $type = mhc_scalar($data, 'type');
    if (!wp_verify_nonce(mhc_scalar($data, 'mhc_nonce'), 'mhc_submit_' . $type)) { wp_die('اعتبار فرم منقضی است؛ صفحه را تازه کنید.', 'درخواست نامعتبر', ['response'=>403]); }
    $saved = mhc_save_submission($data);
    nocache_headers();
    if (is_wp_error($saved)) { wp_die(esc_html($saved->get_error_message()), 'پیام ذخیره نشد', ['response'=>$saved->get_error_code() === 'rate' ? 429 : 422, 'back_link'=>true]); }
    // A rendered success response only occurs after a successful insert; never a GET flag.
    wp_die('<div dir="rtl"><h1>پیام شما ذخیره شد.</h1><p>شناسه: <bdi>' . esc_html($saved['uuid']) . '</bdi></p><p>این تأیید صرفاً ذخیرهٔ پیام است؛ تحویل ایمیل تأیید نشده است.</p><a href="' . esc_url(function_exists('mhc_page_url')?mhc_page_url('contact'):home_url('/contact/')) . '">بازگشت به فروشگاه</a></div>', 'ثبت پیام', ['response'=>200]);
}
add_action('admin_post_mhc_submit', 'mhc_submit');
add_action('admin_post_nopriv_mhc_submit', 'mhc_submit');
function mhc_submission_where($q) {
    global $wpdb; $where = '1=1';
    foreach (['type'=>['contact','inquiry','newsletter'], 'status'=>['new','contacted','completed']] as $k=>$allowed) {
        $v = mhc_scalar($q, $k); if (in_array($v, $allowed, true)) { $where .= $wpdb->prepare(" AND $k=%s", $v); }
    }
    $search = sanitize_text_field(mhc_scalar($q, 's'));
    if ($search) { $like = '%' . $wpdb->esc_like($search) . '%'; $where .= $wpdb->prepare(' AND (name LIKE %s OR email LIKE %s OR phone LIKE %s OR message LIKE %s OR uuid LIKE %s)', $like,$like,$like,$like,$like); }
    foreach (['from'=>'>=', 'to'=>'<='] as $key=>$op) {
        $v = mhc_scalar($q, $key);
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
            $date = DateTimeImmutable::createFromFormat('!Y-m-d', $v, wp_timezone());
            if ($date && $date->format('Y-m-d') === $v) {
                if ($key === 'to') { $date = $date->setTime(23,59,59); }
                $where .= $wpdb->prepare(" AND created_at $op %s", $date->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s'));
            }
        }
    }
    return $where;
}
function mhc_submissions_page() {
    if (!current_user_can('manage_options')) { return; }
    global $wpdb; $table = $wpdb->prefix . 'mh_submissions'; $q = wp_unslash($_GET);
    echo '<div class="wrap" dir="rtl"><h1>پیام‌ها و خبرنامه</h1><p>زمان‌ها بر اساس منطقهٔ زمانی سایت: ' . esc_html(wp_timezone_string()) . '. وضعیت ایمیل accepted به معنی پذیرش برای ارسال است، نه تحویل.</p>';
    if (!empty($q['view'])) {
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id=%d", absint($q['view'])), ARRAY_A);
        if (!$row) { echo '<p>پیامی پیدا نشد.</p></div>'; return; }
        $fields=json_decode($row['fields'],true)?:[]; echo '<p>موضوع: '.esc_html($fields['subject']??'').'</p>';
        echo '<h2>' . esc_html($row['uuid']) . '</h2><table class="widefat">';
        foreach ($row as $key=>$value) { echo '<tr><th>' . esc_html($key) . '</th><td style="white-space:pre-wrap;overflow-wrap:anywhere">' . esc_html($key === 'created_at' ? get_date_from_gmt($value) : $value) . '</td></tr>'; }
        echo '</table>'; mhc_status_form($row); echo '</div>'; return;
    }
    ?><form method="get"><input type="hidden" name="page" value="mhc-submissions"><input name="s" placeholder="جست‌وجوی پیام، نام، ایمیل، شناسه" value="<?php echo esc_attr(mhc_scalar($q,'s')); ?>">
    <?php foreach (['type'=>['contact'=>'تماس','inquiry'=>'درخواست مشاوره','newsletter'=>'خبرنامه'], 'status'=>['new'=>'جدید','contacted'=>'تماس گرفته شد','completed'=>'تکمیل‌شده']] as $k=>$items) : ?><select name="<?php echo esc_attr($k); ?>"><option value="">همه</option><?php foreach ($items as $v=>$label) : ?><option value="<?php echo esc_attr($v); ?>" <?php selected(mhc_scalar($q,$k), $v); ?>><?php echo esc_html($label); ?></option><?php endforeach; ?></select><?php endforeach; ?>
    <label>از <input type="date" name="from" value="<?php echo esc_attr(mhc_scalar($q,'from')); ?>"></label><label>تا <input type="date" name="to" value="<?php echo esc_attr(mhc_scalar($q,'to')); ?>"></label><button class="button">فیلتر</button></form>
    <?php $where = mhc_submission_where($q); $page = max(1, absint($q['paged'] ?? 1)); $count = (int) $wpdb->get_var("SELECT COUNT(*) FROM $table WHERE $where");
    $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM $table WHERE $where ORDER BY id DESC LIMIT 25 OFFSET %d", ($page-1)*25), ARRAY_A);
    echo '<p>' . esc_html($count) . ' پیام</p><table class="widefat striped"><thead><tr><th>شناسه / زمان</th><th>نام / ایمیل</th><th>نوع / وضعیت</th><th>ایمیل</th><th>مدیریت</th></tr></thead><tbody>';
    foreach ($rows as $r) {
        echo '<tr><td><a href="' . esc_url(admin_url('admin.php?page=mhc-submissions&view=' . $r['id'])) . '">' . esc_html($r['uuid']) . '</a><br>' . esc_html(get_date_from_gmt($r['created_at'])) . '</td><td>' . esc_html($r['name']) . '<br>' . esc_html($r['email']) . '</td><td>' . esc_html($r['type'] . ' / ' . $r['status']) . '</td><td>' . esc_html($r['mail_status']) . '</td><td>'; mhc_status_form($r); echo '</td></tr>';
    }
    echo '</tbody></table>';
    // paginate_links() returns null when everything fits on one page.
    $links = paginate_links(['base'=>add_query_arg('paged','%#%'), 'format'=>'', 'total'=>(int) ceil($count/25), 'current'=>$page]);
    if (is_string($links) && $links !== '') { echo wp_kses_post($links); }
    ?><form action="<?php echo esc_url(admin_url('admin-post.php')); ?>" method="post"><input type="hidden" name="action" value="mhc_export"><?php wp_nonce_field('mhc_export'); foreach (['s','type','status','from','to'] as $k) { echo '<input type="hidden" name="' . esc_attr($k) . '" value="' . esc_attr(mhc_scalar($q,$k)) . '">'; } ?><button class="button">دریافت CSV همین فیلتر</button></form></div><?php
}
function mhc_status_form($r) {
    ?><form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>"><input type="hidden" name="action" value="mhc_status"><input type="hidden" name="id" value="<?php echo absint($r['id']); ?>"><?php wp_nonce_field('mhc_status_' . $r['id']); ?>
    <select name="status"><?php foreach (['new'=>'جدید','contacted'=>'تماس گرفته شد','completed'=>'تکمیل‌شده'] as $value=>$label) : ?><option value="<?php echo esc_attr($value); ?>" <?php selected($r['status'],$value); ?>><?php echo esc_html($label); ?></option><?php endforeach; ?></select><button class="button" name="operation" value="update">ذخیره</button><label><input type="checkbox" name="confirm_delete" value="1">تأیید حذف دائمی</label><button class="button" name="operation" value="delete">حذف</button></form><?php
}
function mhc_change_submission($id,$operation,$status='',$confirm=false) {
    if (!current_user_can('manage_options')) { return new WP_Error('permission','دسترسی مجاز نیست.'); }
    global $wpdb; $id=absint($id); $table=$wpdb->prefix.'mh_submissions';
    if (!$id || !$wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id=%d",$id))) { return new WP_Error('missing','پیام پیدا نشد.'); }
    if ($operation==='delete') {
        if (!$confirm) { return new WP_Error('confirm','برای حذف دائمی، تأیید حذف را انتخاب کنید.'); }
        $result=$wpdb->delete($table,['id'=>$id],['%d']);
    } elseif ($operation==='update' && in_array($status,['new','contacted','completed'],true)) {
        $result=$wpdb->update($table,['status'=>$status],['id'=>$id],['%s'],['%d']);
    } else { return new WP_Error('invalid','عملیات یا وضعیت نامعتبر است.'); }
    return $result===false ? new WP_Error('database','ذخیرهٔ تغییرات ناموفق بود.') : true;
}
add_action('admin_post_mhc_status', function () {
    if (!current_user_can('manage_options')) { wp_die('دسترسی مجاز نیست.', '', ['response'=>403]); }
    $id=absint($_POST['id']??0);check_admin_referer('mhc_status_'.$id);
    $result=mhc_change_submission($id,mhc_scalar($_POST,'operation'),mhc_scalar($_POST,'status'),mhc_scalar($_POST,'confirm_delete')==='1');
    if(is_wp_error($result)){wp_die(esc_html($result->get_error_message()),'تغییر ذخیره نشد',['response'=>422,'back_link'=>true]);}
    wp_safe_redirect(admin_url('admin.php?page=mhc-submissions'));exit;
});
function mhc_csv_cell($value) {
    $value=(string)$value;
    return preg_match('/^[\s\x{FEFF}]*[=+@\-]/u',$value) ? "'".$value : $value;
}
add_action('admin_post_mhc_export', function () {
    if (!current_user_can('manage_options')) { wp_die('دسترسی مجاز نیست.', '', ['response'=>403]); }
    check_admin_referer('mhc_export'); global $wpdb; $where = mhc_submission_where(wp_unslash($_POST));
    nocache_headers(); header('Content-Type: text/csv; charset=utf-8'); header('Content-Disposition: attachment; filename="mobile-hashtag-submissions.csv"'); header('X-Content-Type-Options: nosniff');
    $out = fopen('php://output','w'); fwrite($out, "\xEF\xBB\xBF"); $last=0;
    $columns=['id','uuid','created_at','type','status','name','phone','email','message','source_url','fields','mail_status','mail_error'];
    fputcsv($out,$columns,',','"','');
    $max=(int)$wpdb->get_var("SELECT MAX(id) FROM {$wpdb->prefix}mh_submissions WHERE $where");
    do {
        $rows=$wpdb->get_results($wpdb->prepare("SELECT * FROM {$wpdb->prefix}mh_submissions WHERE $where AND id>%d AND id<=%d ORDER BY id LIMIT 500",$last,$max),ARRAY_A);
        foreach ($rows as $row) {
            $last=(int)$row['id']; $row['created_at']=get_date_from_gmt($row['created_at']);
            $row=array_map('mhc_csv_cell',$row);
            fputcsv($out,$row,',','"','');
        }
    } while (count($rows)===500);
    fclose($out); exit;
});
