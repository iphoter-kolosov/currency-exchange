import type { Dict } from './en.ts';

export const ar: Dict = {
  start: {
    greeting:
      `مرحبًا {name}! 👋\n\nأنا مستشارك الشخصي للعملات — أعيش في هذه المنظومة 24/7: أسعار لحظية، رسوم بيانية، تنبيهات، وملخصات يومية. أعرف إلى أين يتجه السوق، وأتحدث لغتك 🤝\n\nيمكنك التحدث معي <b>كأنني إنسان</b> — فقط اكتب:\n• <code>100 usd eur</code> — تحويل فوري\n• <code>eur</code> — كل الأسعار مقابل اليورو\n• <code>رسم بياني يورو إلى دولار لسنة</code>\n• <code>كل يوم الساعة 9 صباحًا يورو إلى دولار</code>\n\nأو استخدم <b>الأزرار</b> أدناه — كل شيء في القائمة ⤵️\n\n<i>مشروع من BigRate.app</i>`,
    menu_convert: '💱 تحويل',
    menu_watch: '👁 القائمة',
    menu_chart: '📈 رسم بياني',
    menu_alerts: '🔔 تنبيهات',
    menu_settings: '⚙️ الإعدادات',
    menu_help: '❓ مساعدة',
  },
  common: {
    cancel: 'إلغاء',
    back: '← رجوع',
    done: 'تم',
    delete: 'حذف',
    add: '+ إضافة',
    loading: 'جاري التحميل…',
    error: '⚠️ حدث خطأ ما. حاول مرة أخرى.',
    unknown_currency: 'عملة غير معروفة: <b>{q}</b>',
    llm_unavailable: 'عذرًا، لم أفهم. أعد الصياغة أو اختر الأداة المناسبة من القائمة بالأسفل.',
  },
  convert: {
    prompt: 'أرسل شيئًا مثل <b>100 usd eur</b> أو <b>1000 uah to rub</b>.',
    result: '<b>{amount} {from}</b> = <b>{value} {to}</b>\n\n<i>1 {from} = {rate} {to}</i>\n<code>{date}</code>',
  },
  watchlist: {
    title: '👁 <b>القائمة</b>',
    empty: 'قائمتك فارغة. استخدم القائمة لإضافة عملات.',
    header: 'الأسعار مقابل <b>{amount} {base}</b>:',
    add_prompt: 'أرسل رمز العملة لإضافتها (مثل <b>JPY</b> أو <b>CHF</b>).',
    added: 'تمت إضافة <b>{iso}</b> إلى القائمة.',
    removed: 'تمت إزالة <b>{iso}</b> من القائمة.',
    change_base: '🔁 تغيير الأساس',
    base_prompt: 'أرسل رمز عملة الأساس (مثل <b>EUR</b>).',
    base_changed: 'تم تغيير الأساس إلى <b>{iso}</b>.',
  },
  chart: {
    title: '📈 <b>{target} لكل 1 {base}</b> · {tf}',
    pick_pair: 'أرسل الزوج للرسم البياني (مثل <b>eur usd</b>).',
    pick_tf: 'اختر الفترة:',
    no_data: 'لا توجد بيانات لهذا الزوج/الفترة.',
    current: 'الحالي: <b>{price}</b>  {pct}',
  },
  alerts: {
    list_title: '🔔 <b>تنبيهاتك</b>',
    list_empty: 'ليس لديك تنبيهات بعد. اضغط «تنبيه جديد» لإنشاء واحد.',
    new: '＋ تنبيه جديد',
    pick_pair: 'أرسل الزوج للتنبيه (مثل <b>eur usd</b>).',
    pick_type: 'ما الذي يجب أن يشغل التنبيه؟',
    type_above: '📈 السعر أعلى من',
    type_below: '📉 السعر أقل من',
    type_pct_up: '⬆️ % صعود خلال 24 ساعة',
    type_pct_down: '⬇️ % هبوط خلال 24 ساعة',
    enter_value: 'الزوج: <b>{pair}</b>\nالشرط: <b>{type}</b>\n\nأرسل القيمة ({hint}):',
    hint_price: 'مثل 1.15',
    hint_percent: 'مثل 2 لتعني 2%',
    created: '✅ تم إنشاء التنبيه:\n{summary}',
    deleted: '🗑 تم حذف التنبيه.',
    limit_reached: 'وصلت إلى حد التنبيهات المجاني البالغ {limit} نشط. استخدم /premium للتوسعة.',
    notification_above: '🔔 <b>{pair}</b> تجاوز <b>{target}</b>\n\nالحالي: <b>{price}</b>',
    notification_below: '🔔 <b>{pair}</b> انخفض دون <b>{target}</b>\n\nالحالي: <b>{price}</b>',
    notification_pct_up: '🔔 <b>{pair}</b> ارتفع {pct} خلال 24 ساعة\n\nالحالي: <b>{price}</b>',
    notification_pct_down: '🔔 <b>{pair}</b> انخفض {pct} خلال 24 ساعة\n\nالحالي: <b>{price}</b>',
  },
  settings: {
    title: '⚙️ <b>الإعدادات</b>',
    language: 'اللغة',
    lang_changed: 'تم تحديث اللغة.',
    lang_unsupported: 'هذه اللغة غير مدعومة بعد. المتاح: {supported}.',
    timezone: 'المنطقة الزمنية',
    tz_changed: 'تم تحديث المنطقة الزمنية.',
    tz_prompt: 'اختر منطقتك الزمنية (تستخدم للملخصات اليومية):',
    tz_custom: '✏️ مدينة أخرى',
    tz_custom_prompt: 'أرسل اسم مدينة (الإنجليزية أفضل): <b>Prague</b>، <b>Seoul</b>، <b>Tel Aviv</b>…',
    about: 'حول',
  },
  digest: {
    menu_new: '📅 ملخص يومي',
    scope_pair: 'زوج واحد',
    scope_watchlist: 'القائمة كاملة',
    pick_scope: 'اختر محتوى الملخص:',
    pick_pair: 'أرسل الزوج (مثل <b>eur usd</b>).',
    pick_time: 'اختر وقت الإرسال ({tz}):',
    pick_time_custom: 'أو أرسل وقتًا مخصصًا مثل <b>09:30</b>.',
    created_pair: '✅ تم ضبط الملخص اليومي لـ <b>{pair}</b> عند <b>{time}</b> ({tz}).',
    created_watchlist: '✅ تم ضبط ملخص القائمة اليومي عند <b>{time}</b> ({tz}).',
    label_pair: '📅 {pair} يوميًا @ {time}',
    label_watchlist: '📅 القائمة يوميًا @ {time}',
    pair: '📅 <b>ملخص يومي · {pair}</b>\n\nالآن: <b>{price}</b>  {change}\nالأمس: {prev}',
    watchlist: '📅 <b>ملخص يومي · 1 {base}</b>',
    time_invalid: 'لم أفهم الوقت. أرسل شيئًا مثل <b>09:00</b> أو <b>21:30</b>.',
  },
  reset: {
    prompt: '⚠️ سيؤدي هذا إلى مسح كل شيء: لغتك ومنطقتك الزمنية وقائمتك وكل التنبيهات. المتابعة؟',
    confirm: '🗑 نعم، إعادة ضبط',
    cancel: 'إلغاء',
    done: '✅ تم مسح كل شيء. اختر لغة للبدء من جديد.',
    done_toast: 'تمت إعادة الضبط',
    cancelled: 'أُلغي — لم يتغير شيء.',
  },
  help: {
    text: `<b>ما أستطيع فعله</b>

💱 <b>التحويل</b>
اكتب بطبيعية: <code>100 usd eur</code>، <code>1500 uah to rub</code>، <code>50€ in ₴</code>، <code>ألف دولار إلى هريفنا</code>.

👁 <b>القائمة</b>
أرسل رمز عملة (مثل <code>eur</code>) لرؤية كل الأسعار المتابَعة مقابلها. /watch لإدارتها.

📈 <b>الرسم البياني</b>
<code>chart eur usd</code> أو <code>اتجاه يورو دولار السنة الماضية</code>. اضغط 1D/1W/1M/3M/6M/1Y/2Y أسفل الرسم للتبديل — البطاقة نفسها تتحدث مكانها.

🔔 <b>تنبيهات السعر</b>
/alerts → تنبيه جديد. إشعار عند تجاوز زوج لسعر معين أو حركته ±X% خلال 24 ساعة.

📅 <b>الملخص اليومي</b>
/alerts → 📅 ملخص يومي. اختر زوجًا واحدًا أو كامل قائمتك ووقتًا محليًا — ويصلك صباحًا ملخص بحركة الأمس.
أو قلها مباشرة: <code>كل يوم الساعة 9 صباحًا eur إلى usd</code>.

⚙️ <b>الإعدادات</b>
/settings — اللغة والمنطقة الزمنية (مطلوبة لتوقيت الملخص).

<i>الوضع المضمن: اكتب <code>@{username} 100 usd eur</code> في أي محادثة لمشاركة بطاقة تحويل.</i>`,
  },
};
