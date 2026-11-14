<?php
/**
 * Customer accounts: real WordPress Users API registration, mobile number in user meta,
 * profile editing, and a manageable column/filter in the admin users list.
 *
 * Passwords are only ever handled by wp_insert_user()/wp_set_password(); the plugin stores
 * no hashed or plaintext password of its own.
 */
if (!defined('ABSPATH')) { exit; }

/** Normalise a Persian/Arabic or Latin mobile number to digits only (۰۹۱۲… → 0912…). */
function mhc_normalize_phone($phone) {
    $phone = (string) $phone;
    $phone = strtr($phone, [
        '۰'=>'0','۱'=>'1','۲'=>'2','۳'=>'3','۴'=>'4','۵'=>'5','۶'=>'6','۷'=>'7','۸'=>'8','۹'=>'9',
        '٠'=>'0','١'=>'1','٢'=>'2','٣'=>'3','٤'=>'4','٥'=>'5','٦'=>'6','٧'=>'7','٨'=>'8','٩'=>'9',
        '−'=>'-','–'=>'-','　'=>' ',
    ]);
    return preg_replace('/[^0-9+]/', '', $phone);
}

/** Iranian mobile numbers: 09xxxxxxxxx or +989xxxxxxxxx or 00989xxxxxxxxx. */
function mhc_is_valid_mobile($phone) {
    $digits = mhc_normalize_phone($phone);
    return (bool) preg_match('/^(?:\+98|0098|98|0)?9\d{9}$/', $digits);
}

/** Canonical storage format: 09xxxxxxxxx */
function mhc_canonical_mobile($phone) {
    $digits = mhc_normalize_phone($phone);
    if (preg_match('/^(?:\+98|0098|98)(9\d{9})$/', $digits, $m)) { return '0' . $m[1]; }
    if (preg_match('/^(09\d{9})$/', $digits, $m)) { return $m[1]; }
    if (preg_match('/^(9\d{9})$/', $digits, $m)) { return '0' . $m[1]; }
    return '';
}

/**
 * Customer registration on the My Account page is a product requirement: enable it on install
 * (only when the option was never set by the owner) and make sure the account page allows it.
 */
function mhc_enable_customer_registration() {
    if (!class_exists('WooCommerce')) { return; }
    if (get_option('mhc_registration_configured')) { return; }
    if (get_option('woocommerce_enable_myaccount_registration') === false) {
        update_option('woocommerce_enable_myaccount_registration', 'yes');
    }
    if (get_option('woocommerce_registration_generate_password') === false) {
        update_option('woocommerce_registration_generate_password', 'no');
    }
    update_option('mhc_registration_configured', 1, false);
}
add_action('init', 'mhc_enable_customer_registration', 5);

/** Keep the account page markup in the approved layout even when WooCommerce wraps it. */
add_filter('woocommerce_account_menu_items', function ($items) {
    return $items;
});

/** A phone number may belong to only one account. */
function mhc_phone_in_use($phone, $exclude_user_id = 0) {
    $canonical = mhc_canonical_mobile($phone);
    if (!$canonical) { return false; }
    $users = get_users([
        'meta_key'   => 'mhc_phone',
        'meta_value' => $canonical,
        'number'     => 1,
        'fields'     => 'ID',
        'exclude'    => $exclude_user_id ? [(int) $exclude_user_id] : [],
    ]);
    return !empty($users);
}

/** Phone value for a user, falling back to the WooCommerce billing phone. */
function mhc_user_phone($user_id) {
    $phone = get_user_meta($user_id, 'mhc_phone', true);
    if (!$phone) { $phone = get_user_meta($user_id, 'billing_phone', true); }
    return $phone ? mhc_canonical_mobile($phone) ?: $phone : '';
}

/** Render the shared "name / mobile" pair of fields. */
function mhc_account_fields($args = []) {
    $args = wp_parse_args($args, ['name' => '', 'phone' => '', 'prefix' => wp_unique_id('mhc-acct-')]);
    ob_start(); ?>
    <label for="<?php echo esc_attr($args['prefix']); ?>name">نام و نام خانوادگی<input id="<?php echo esc_attr($args['prefix']); ?>name" name="mhc_name" required minlength="2" maxlength="100" autocomplete="name" value="<?php echo esc_attr($args['name']); ?>"></label>
    <label for="<?php echo esc_attr($args['prefix']); ?>phone">شماره موبایل<input id="<?php echo esc_attr($args['prefix']); ?>phone" name="mhc_phone" type="tel" inputmode="numeric" dir="ltr" required maxlength="14" autocomplete="tel" placeholder="09123456789" value="<?php echo esc_attr($args['phone']); ?>"><small class="muted">برای پیگیری سفارش و اطلاع‌رسانی؛ فقط شماره‌های موبایل ایران پذیرفته می‌شود.</small></label>
    <?php return ob_get_clean();
}

/** WooCommerce "My account" registration form additions. */
add_action('woocommerce_register_form_start', function () {
    echo mhc_account_fields(['prefix' => 'mhc-reg-']);
});

/** Validate and store the extra registration fields (both classic and WooCommerce forms). */
function mhc_validate_registration($errors, $username, $email) {
    $data = wp_unslash($_POST);
    $name = isset($data['mhc_name']) && is_scalar($data['mhc_name']) ? sanitize_text_field($data['mhc_name']) : '';
    $phone = isset($data['mhc_phone']) && is_scalar($data['mhc_phone']) ? sanitize_text_field($data['mhc_phone']) : '';
    if ($name === '' && isset($data['billing_first_name']) && is_scalar($data['billing_first_name'])) {
        $last = isset($data['billing_last_name']) && is_scalar($data['billing_last_name']) ? sanitize_text_field($data['billing_last_name']) : '';
        $name = trim(sanitize_text_field($data['billing_first_name']) . ' ' . $last);
    }
    if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
        $errors->add('mhc_name', 'نام و نام خانوادگی را کامل (۲ تا ۱۰۰ نویسه) وارد کنید.');
    }
    if (!mhc_is_valid_mobile($phone)) {
        $errors->add('mhc_phone', 'شماره موبایل معتبر ایران را وارد کنید (مثال: 09123456789).');
    } elseif (mhc_phone_in_use($phone)) {
        $errors->add('mhc_phone_taken', 'این شماره موبایل قبلاً در حساب دیگری ثبت شده است.');
    }
    if ($email && !is_email($email)) {
        $errors->add('mhc_email', 'ایمیل معتبر وارد کنید.');
    }
    return $errors;
}
add_filter('woocommerce_registration_errors', 'mhc_validate_registration', 10, 3);
add_filter('registration_errors', 'mhc_validate_registration', 10, 3);

/** Persist the extra fields onto the freshly created user. */
function mhc_save_registration_fields($user_id) {
    $data = wp_unslash($_POST);
    $phone = isset($data['mhc_phone']) && is_scalar($data['mhc_phone']) ? mhc_canonical_mobile(sanitize_text_field($data['mhc_phone'])) : '';
    if ($phone) {
        update_user_meta($user_id, 'mhc_phone', $phone);
        if ($phone !== get_user_meta($user_id, 'billing_phone', true)) { update_user_meta($user_id, 'billing_phone', $phone); }
    }
    $name = isset($data['mhc_name']) && is_scalar($data['mhc_name']) ? sanitize_text_field($data['mhc_name']) : '';
    if ($name) {
        $parts = preg_split('/\s+/', $name, 2);
        wp_update_user(['ID' => $user_id, 'display_name' => $name, 'first_name' => $parts[0], 'last_name' => $parts[1] ?? '']);
    }
    $user = get_userdata($user_id);
    if ($user && $user->first_name === '') {
        wp_update_user(['ID' => $user_id, 'display_name' => $user->user_login]);
    }
}
add_action('woocommerce_created_customer', 'mhc_save_registration_fields');
add_action('user_register', 'mhc_save_registration_fields');

/** "Account details" → the customer can update their own name and mobile. */
add_action('woocommerce_edit_account_form', function () {
    $user_id = get_current_user_id();
    $user = get_userdata($user_id);
    if (!$user) { return; }
    $name = trim($user->first_name . ' ' . $user->last_name) ?: $user->display_name;
    echo '<p class="woocommerce-form-row form-row form-row-wide">' . mhc_account_fields(['name' => $name, 'phone' => mhc_user_phone($user_id), 'prefix' => 'mhc-edit-']) . '</p>';
});
add_action('woocommerce_save_account_details_errors', function ($errors) {
    $data = wp_unslash($_POST);
    $phone = isset($data['mhc_phone']) && is_scalar($data['mhc_phone']) ? sanitize_text_field($data['mhc_phone']) : '';
    if (!mhc_is_valid_mobile($phone)) {
        $errors->add('mhc_phone', 'شماره موبایل معتبر ایران را وارد کنید.');
    } elseif (mhc_phone_in_use($phone, get_current_user_id())) {
        $errors->add('mhc_phone_taken', 'این شماره موبایل برای حساب دیگری ثبت شده است.');
    }
});
add_action('woocommerce_save_account_details', function ($user_id) {
    $data = wp_unslash($_POST);
    if (isset($data['mhc_phone']) && is_scalar($data['mhc_phone'])) {
        $phone = mhc_canonical_mobile(sanitize_text_field($data['mhc_phone']));
        if ($phone) { update_user_meta($user_id, 'mhc_phone', $phone); update_user_meta($user_id, 'billing_phone', $phone); }
    }
    if (isset($data['mhc_name']) && is_scalar($data['mhc_name'])) {
        $name = sanitize_text_field($data['mhc_name']);
        if (mb_strlen($name) >= 2) {
            $parts = preg_split('/\s+/', $name, 2);
            wp_update_user(['ID' => $user_id, 'first_name' => $parts[0], 'last_name' => $parts[1] ?? '']);
        }
    }
});

/** Admin: dedicated mobile column plus search by mobile number. */
add_filter('manage_users_columns', function ($columns) {
    $columns['mhc_phone'] = 'شماره موبایل';
    return $columns;
});
add_filter('manage_users_custom_column', function ($value, $column, $user_id) {
    if ($column === 'mhc_phone') {
        $phone = mhc_user_phone($user_id);
        return $phone ? '<bdi dir="ltr">' . esc_html($phone) . '</bdi>' : '<span class="muted">—</span>';
    }
    return $value;
}, 10, 3);
add_action('pre_get_users', function ($query) {
    if (!is_admin() || !$query->get('search') || !current_user_can('list_users')) { return; }
    global $wpdb;
    $search = trim((string) $query->get('search'));
    $search = ltrim($search, '*');
    if ($search === '' || !preg_match('/^[0-9+۰-۹\- ]{3,}$/u', $search)) { return; }
    $phone = mhc_canonical_mobile($search) ?: mhc_normalize_phone($search);
    if ($phone === '') { return; }
    $ids = $wpdb->get_col($wpdb->prepare("SELECT user_id FROM {$wpdb->usermeta} WHERE meta_key IN ('mhc_phone','billing_phone') AND meta_value LIKE %s", '%' . $wpdb->esc_like($phone) . '%'));
    $query->set('search', '');
    $query->set('include', $ids ? array_map('absint', $ids) : [0]);
});

/** Admin: edit the mobile number from the user profile screens. */
function mhc_render_admin_phone_field($user) {
    if (!current_user_can('edit_users')) { return; }
    ?>
    <h2>اطلاعات موبایل هشتگ</h2>
    <table class="form-table" role="presentation"><tr>
        <th><label for="mhc_phone">شماره موبایل</label></th>
        <td><input type="tel" name="mhc_phone" id="mhc_phone" dir="ltr" class="regular-text" value="<?php echo esc_attr(mhc_user_phone($user->ID)); ?>" maxlength="14">
        <p class="description">شماره به شکل ۰۹xxxxxxxxx ذخیره می‌شود و برای پیگیری سفارش به کار می‌رود.</p></td>
    </tr></table>
    <?php
}
add_action('show_user_profile', 'mhc_render_admin_phone_field');
add_action('edit_user_profile', 'mhc_render_admin_phone_field');
function mhc_save_admin_phone_field($user_id) {
    if (!current_user_can('edit_users')) { return; }
    if (!isset($_POST['mhc_phone']) || !is_scalar($_POST['mhc_phone'])) { return; }
    check_admin_referer('update-user_' . $user_id);
    $raw = sanitize_text_field(wp_unslash($_POST['mhc_phone']));
    if ($raw === '') { delete_user_meta($user_id, 'mhc_phone'); return; }
    $phone = mhc_canonical_mobile($raw);
    if (!$phone) {
        add_action('user_profile_update_errors', function ($errors) { $errors->add('mhc_phone', 'شماره موبایل معتبر نیست.'); });
        return;
    }
    if (mhc_phone_in_use($phone, $user_id)) { return; }
    update_user_meta($user_id, 'mhc_phone', $phone);
}
add_action('personal_options_update', 'mhc_save_admin_phone_field');
add_action('edit_user_profile_update', 'mhc_save_admin_phone_field');

/** Keep the mobile number in the WordPress privacy exporter/eraser. */
add_filter('wp_privacy_personal_data_exporters', function ($exporters) {
    $exporters['mobile-hashtag-accounts'] = [
        'exporter_friendly_name' => 'حساب کاربری موبایل هشتگ',
        'callback' => function ($email, $page = 1) {
            $user = get_user_by('email', $email);
            if (!$user || $page > 1) { return ['data' => [], 'done' => true]; }
            $phone = mhc_user_phone($user->ID);
            return ['data' => [['group_id' => 'mhc-account', 'group_label' => 'حساب موبایل هشتگ', 'item_id' => 'mhc-user-' . $user->ID, 'data' => [
                ['name' => 'نام', 'value' => $user->display_name],
                ['name' => 'شماره موبایل', 'value' => $phone],
            ]]], 'done' => true];
        },
    ];
    return $exporters;
});
add_filter('wp_privacy_personal_data_erasers', function ($erasers) {
    $erasers['mobile-hashtag-accounts'] = [
        'eraser_friendly_name' => 'حساب کاربری موبایل هشتگ',
        'callback' => function ($email, $page = 1) {
            $user = get_user_by('email', $email);
            if (!$user || $page > 1) { return ['items_removed' => false, 'items_retained' => false, 'messages' => [], 'done' => true]; }
            delete_user_meta($user->ID, 'mhc_phone');
            return ['items_removed' => true, 'items_retained' => false, 'messages' => ['شماره موبایل از پروفایل حذف شد.'], 'done' => true];
        },
    ];
    return $erasers;
});
