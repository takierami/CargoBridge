"""Built-in supplier receipt templates (Buying/Payment × AR/EN/ZH).

Seed via upsert_supplier_default_templates(org). Identified by stable system_key.
Bodies are self-contained HTML with embedded <style> and {{variable}} placeholders.
"""

SUPPLIER_DEFAULT_TEMPLATES = [
    {
        'system_key': 'sys.buying.ar',
        'template_name': 'إيصال شراء (عربي)',
        'kind': 'buying',
        'locale': 'ar',
        'template_body': '''<style>
:root { --accent:#1F4E79; --accent-light:#DAE6F2; --muted:#6B7280; --text:#1F2937; --border:#BFC9D1; }
* { box-sizing:border-box; }
body { font-family: -apple-system, "Segoe UI", "Microsoft YaHei", "Sakkal Majalla", sans-serif;
       background:#fff; color:var(--text); margin:0; padding:16px; }
.receipt { background:#fff; border:1px solid var(--border); border-radius:8px; padding:28px 32px;
           box-shadow:0 4px 12px rgba(0,0,0,.06); position:relative; }
.receipt.rtl { direction:rtl; }
.receipt.rtl .header-block, .receipt.rtl .meta-strip { direction:rtl; }
.receipt.rtl .kv-table td, .receipt.rtl .kv-table th { text-align:right; }
.receipt.rtl .items-table th, .receipt.rtl .items-table td { text-align:right; }
.receipt.rtl .totals-table td.label { text-align:right; }
.receipt.rtl .totals-table td.value { text-align:left; }
.receipt.rtl .sig-block  { direction:rtl; }
.receipt.rtl .sig-block .col { text-align:right; }

.header-block { display:grid; grid-template-columns: 1.4fr 1fr; gap:24px; margin-bottom:18px; }
.brand-name   { font-size:22px; font-weight:700; color:var(--accent); }
.brand-sub    { font-size:12px; color:var(--muted); margin-top:4px; }
.meta-right   { text-align:right; font-size:12px; color:var(--muted); }
.meta-right .meta-val { color:var(--text); font-weight:700; font-size:14px; }

.title-band   { text-align:center; font-size:26px; font-weight:700; color:var(--accent);
                border-top:3px solid var(--accent); border-bottom:1px solid var(--border);
                padding:14px 0; margin:8px 0 18px; letter-spacing:2px; }

.meta-strip   { display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;
                border:1px solid var(--border); border-radius:6px; padding:12px; margin-bottom:18px;
                background:#FAFBFC; }
.meta-strip .item { text-align:center; }
.meta-strip .label { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; }
.meta-strip .value { font-size:14px; font-weight:700; color:var(--accent); margin-top:4px; }

.section-h { background:var(--accent-light); color:var(--accent); font-weight:700;
             padding:6px 12px; border-left:4px solid var(--accent); border-radius:4px;
             margin:18px 0 8px; font-size:13px; }

.kv-table { width:100%; border-collapse:collapse; margin-bottom:12px; }
.kv-table td { border:1px solid var(--border); padding:8px 10px; font-size:12px; }
.kv-table td.label { background:#F2F6FB; color:var(--accent); font-weight:700; width:35%; }

.items-table { width:100%; border-collapse:collapse; margin-bottom:12px; font-size:12px; }
.items-table th { background:var(--accent); color:#fff; padding:8px; font-weight:700; }
.items-table td { border:1px solid var(--border); padding:8px; }
.items-table td.items-cell { font-style:italic; color:var(--muted); }

.totals-table { width:100%; border-collapse:collapse; margin-top:6px; }
.totals-table td { border:1px solid var(--border); padding:8px 10px; font-size:12px; }
.totals-table td.label { background:#F2F6FB; color:var(--accent); font-weight:700; width:35%; }
.totals-table tr.grand td { background:var(--accent); color:#fff; font-weight:700; font-size:14px; }

.notes-block { margin-top:16px; font-size:11px; color:var(--muted); font-style:italic; }
.notes-block strong { font-style:normal; color:var(--text); }

.sig-block { display:grid; grid-template-columns: 1fr 1fr; gap:32px; margin-top:28px; font-size:12px; }
.sig-block .line { border-top:1px solid var(--text); padding-top:6px; color:var(--muted); }
.sig-block .col { text-align:left; }

.thank-you { text-align:center; margin-top:20px; color:var(--accent); font-style:italic; font-size:13px; }

.receipt.rtl .meta-right { text-align:left; }
.receipt.rtl .section-h   { border-left:none; border-right:4px solid var(--accent); }
.receipt.rtl .items-table th, .receipt.rtl .items-table td { text-align:right; }
.receipt.rtl .totals-table td.value { text-align:left; }
.receipt.rtl .kv-table td.label { text-align:right; }
.receipt.rtl .kv-table td.value { text-align:left; }
.receipt.rtl .sig-block .col { text-align:right; }
</style>
<div class="receipt rtl">
      <div class="header-block">
        <div>
          <div class="brand-name">{{supplierName}}</div>
          <div class="brand-sub">وثيقة رسمية</div>
        </div>
        <div class="meta-right">
          رقم الإيصال: <span class="meta-val">{{poNumber}}</span><br>
          تاريخ الإصدار: <span class="meta-val">{{todayDate}}</span>
        </div>
      </div>

      <div class="title-band">إيصال شراء</div>

      <div class="meta-strip"><div class="item"><div class="label">رقم أمر الشراء</div><div class="value">{{purchaseOrderNumber}}</div></div>
<div class="item"><div class="label">تاريخ الطلب</div><div class="value">{{orderDate}}</div></div>
<div class="item"><div class="label">الحالة · الرقم المرجعي</div><div class="value">{{status}}  |  {{imageNumber}}</div></div></div>

      <div class="section-h">معلومات المورد</div>
      <table class="kv-table"><tr><td class="label">اسم المورد</td><td class="value">{{supplierName}}</td></tr>
<tr><td class="label">العنوان</td><td class="value">{{address}}</td></tr>
<tr><td class="label">المدينة</td><td class="value">{{city}}</td></tr>
<tr><td class="label">الهاتف</td><td class="value">{{phone}}</td></tr>
<tr><td class="label">البريد الإلكتروني</td><td class="value">{{email}}</td></tr></table>

      <div class="section-h">تفاصيل</div>
      <table class="kv-table"><tr><td class="label">رقم أمر الشراء</td><td class="value">{{purchaseOrderNumber}}</td></tr>
<tr><td class="label">تاريخ الطلب</td><td class="value">{{orderDate}}</td></tr>
<tr><td class="label">طريقة الدفع</td><td class="value">{{paymentMethod}}</td></tr>
<tr><td class="label">تاريخ الدفع</td><td class="value">{{paymentDate}}</td></tr>
<tr><td class="label">رقم الدفعة</td><td class="value">{{paymentNumber}}</td></tr></table>

      <div class="section-h">بنود الطلب</div>
      <table class="items-table">
    <tr>
      <th>#</th><th>بنود الطلب</th><th>الكمية</th>
      <th>المبلغ</th><th>الإجمالي</th>
    </tr>
    <tr>
      <td style="text-align:center;">—</td>
      <td class="items-cell">{{lineItems}}</td>
      <td style="text-align:center;">{{quantity}}</td>
      <td style="text-align:center;">{{amount}} {{currency}}</td>
      <td style="text-align:center;">{{totalAmount}} {{currency}}</td>
    </tr>
    </table>

      <div class="section-h">المبالغ</div>
      <table class="totals-table"><tr><td class="label">الكمية</td><td class="value">{{quantity}}</td></tr>
<tr><td class="label">المبلغ</td><td class="value">{{amount}} {{currency}}</td></tr>
<tr><td class="label">القيمة</td><td class="value">{{value}} {{currency}}</td></tr>
<tr class="grand"><td class="label">الإجمالي</td><td class="value">{{totalAmount}} {{currency}}</td></tr>
<tr class="grand"><td class="label">المبلغ المدفوع</td><td class="value">{{amountPaid}} {{currency}}</td></tr>
<tr><td class="label">الرصيد المتبقي</td><td class="value">{{totalAmount}} - {{amountPaid}}  ({{currency}})</td></tr></table>

      
    <div class="notes-block">
      <strong>ملاحظات:</strong> {{lineItems}}<br>
      هذا الإيصال صادر إلكترونياً ولا يحتاج إلى ختم أو توقيع ورقي عند التحقق من خلال النظام.
    </div>
    
      
    <div class="sig-block">
      <div class="col">
        <div class="line">________________________</div>
        <div>التوقيع المعتمد  —  {{supplierName}}</div>
      </div>
      <div class="col" style="text-align:right;">
        <div class="line">________________________</div>
        <div>تاريخ الإصدار:  {{todayDate}}</div>
      </div>
    </div>
    
      <div class="thank-you">— شكراً لتعاملكم معنا —</div>
    </div>''',
    },
    {
        'system_key': 'sys.buying.en',
        'template_name': 'Buying Receipt (English)',
        'kind': 'buying',
        'locale': 'en',
        'template_body': '''<style>
:root { --accent:#1F4E79; --accent-light:#DAE6F2; --muted:#6B7280; --text:#1F2937; --border:#BFC9D1; }
* { box-sizing:border-box; }
body { font-family: -apple-system, "Segoe UI", "Microsoft YaHei", "Sakkal Majalla", sans-serif;
       background:#fff; color:var(--text); margin:0; padding:16px; }
.receipt { background:#fff; border:1px solid var(--border); border-radius:8px; padding:28px 32px;
           box-shadow:0 4px 12px rgba(0,0,0,.06); position:relative; }
.receipt.rtl { direction:rtl; }
.receipt.rtl .header-block, .receipt.rtl .meta-strip { direction:rtl; }
.receipt.rtl .kv-table td, .receipt.rtl .kv-table th { text-align:right; }
.receipt.rtl .items-table th, .receipt.rtl .items-table td { text-align:right; }
.receipt.rtl .totals-table td.label { text-align:right; }
.receipt.rtl .totals-table td.value { text-align:left; }
.receipt.rtl .sig-block  { direction:rtl; }
.receipt.rtl .sig-block .col { text-align:right; }

.header-block { display:grid; grid-template-columns: 1.4fr 1fr; gap:24px; margin-bottom:18px; }
.brand-name   { font-size:22px; font-weight:700; color:var(--accent); }
.brand-sub    { font-size:12px; color:var(--muted); margin-top:4px; }
.meta-right   { text-align:right; font-size:12px; color:var(--muted); }
.meta-right .meta-val { color:var(--text); font-weight:700; font-size:14px; }

.title-band   { text-align:center; font-size:26px; font-weight:700; color:var(--accent);
                border-top:3px solid var(--accent); border-bottom:1px solid var(--border);
                padding:14px 0; margin:8px 0 18px; letter-spacing:2px; }

.meta-strip   { display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;
                border:1px solid var(--border); border-radius:6px; padding:12px; margin-bottom:18px;
                background:#FAFBFC; }
.meta-strip .item { text-align:center; }
.meta-strip .label { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; }
.meta-strip .value { font-size:14px; font-weight:700; color:var(--accent); margin-top:4px; }

.section-h { background:var(--accent-light); color:var(--accent); font-weight:700;
             padding:6px 12px; border-left:4px solid var(--accent); border-radius:4px;
             margin:18px 0 8px; font-size:13px; }

.kv-table { width:100%; border-collapse:collapse; margin-bottom:12px; }
.kv-table td { border:1px solid var(--border); padding:8px 10px; font-size:12px; }
.kv-table td.label { background:#F2F6FB; color:var(--accent); font-weight:700; width:35%; }

.items-table { width:100%; border-collapse:collapse; margin-bottom:12px; font-size:12px; }
.items-table th { background:var(--accent); color:#fff; padding:8px; font-weight:700; }
.items-table td { border:1px solid var(--border); padding:8px; }
.items-table td.items-cell { font-style:italic; color:var(--muted); }

.totals-table { width:100%; border-collapse:collapse; margin-top:6px; }
.totals-table td { border:1px solid var(--border); padding:8px 10px; font-size:12px; }
.totals-table td.label { background:#F2F6FB; color:var(--accent); font-weight:700; width:35%; }
.totals-table tr.grand td { background:var(--accent); color:#fff; font-weight:700; font-size:14px; }

.notes-block { margin-top:16px; font-size:11px; color:var(--muted); font-style:italic; }
.notes-block strong { font-style:normal; color:var(--text); }

.sig-block { display:grid; grid-template-columns: 1fr 1fr; gap:32px; margin-top:28px; font-size:12px; }
.sig-block .line { border-top:1px solid var(--text); padding-top:6px; color:var(--muted); }
.sig-block .col { text-align:left; }

.thank-you { text-align:center; margin-top:20px; color:var(--accent); font-style:italic; font-size:13px; }

.receipt.rtl .meta-right { text-align:left; }
.receipt.rtl .section-h   { border-left:none; border-right:4px solid var(--accent); }
.receipt.rtl .items-table th, .receipt.rtl .items-table td { text-align:right; }
.receipt.rtl .totals-table td.value { text-align:left; }
.receipt.rtl .kv-table td.label { text-align:right; }
.receipt.rtl .kv-table td.value { text-align:left; }
.receipt.rtl .sig-block .col { text-align:right; }
</style>
<div class="receipt ">
      <div class="header-block">
        <div>
          <div class="brand-name">{{supplierName}}</div>
          <div class="brand-sub">Official Document</div>
        </div>
        <div class="meta-right">
          Receipt No.: <span class="meta-val">{{poNumber}}</span><br>
          Issue Date: <span class="meta-val">{{todayDate}}</span>
        </div>
      </div>

      <div class="title-band">BUYING RECEIPT</div>

      <div class="meta-strip"><div class="item"><div class="label">Purchase Order No.</div><div class="value">{{purchaseOrderNumber}}</div></div>
<div class="item"><div class="label">Order Date</div><div class="value">{{orderDate}}</div></div>
<div class="item"><div class="label">Status · Reference No.</div><div class="value">{{status}}  |  {{imageNumber}}</div></div></div>

      <div class="section-h">Supplier Information</div>
      <table class="kv-table"><tr><td class="label">Supplier Name</td><td class="value">{{supplierName}}</td></tr>
<tr><td class="label">Address</td><td class="value">{{address}}</td></tr>
<tr><td class="label">City</td><td class="value">{{city}}</td></tr>
<tr><td class="label">Phone</td><td class="value">{{phone}}</td></tr>
<tr><td class="label">Email</td><td class="value">{{email}}</td></tr></table>

      <div class="section-h">Details</div>
      <table class="kv-table"><tr><td class="label">Purchase Order No.</td><td class="value">{{purchaseOrderNumber}}</td></tr>
<tr><td class="label">Order Date</td><td class="value">{{orderDate}}</td></tr>
<tr><td class="label">Payment Method</td><td class="value">{{paymentMethod}}</td></tr>
<tr><td class="label">Payment Date</td><td class="value">{{paymentDate}}</td></tr>
<tr><td class="label">Payment No.</td><td class="value">{{paymentNumber}}</td></tr></table>

      <div class="section-h">Order Items</div>
      <table class="items-table">
    <tr>
      <th>#</th><th>Order Items</th><th>Quantity</th>
      <th>Amount</th><th>Total</th>
    </tr>
    <tr>
      <td style="text-align:center;">—</td>
      <td class="items-cell">{{lineItems}}</td>
      <td style="text-align:center;">{{quantity}}</td>
      <td style="text-align:center;">{{amount}} {{currency}}</td>
      <td style="text-align:center;">{{totalAmount}} {{currency}}</td>
    </tr>
    </table>

      <div class="section-h">Amounts</div>
      <table class="totals-table"><tr><td class="label">Quantity</td><td class="value">{{quantity}}</td></tr>
<tr><td class="label">Amount</td><td class="value">{{amount}} {{currency}}</td></tr>
<tr><td class="label">Value</td><td class="value">{{value}} {{currency}}</td></tr>
<tr class="grand"><td class="label">Total</td><td class="value">{{totalAmount}} {{currency}}</td></tr>
<tr class="grand"><td class="label">Amount Paid</td><td class="value">{{amountPaid}} {{currency}}</td></tr>
<tr><td class="label">Balance Due</td><td class="value">{{totalAmount}} - {{amountPaid}}  ({{currency}})</td></tr></table>

      
    <div class="notes-block">
      <strong>Notes:</strong> {{lineItems}}<br>
      This receipt was generated electronically and does not require a physical stamp or signature when verified through the system.
    </div>
    
      
    <div class="sig-block">
      <div class="col">
        <div class="line">________________________</div>
        <div>Authorized Signature  —  {{supplierName}}</div>
      </div>
      <div class="col" style="text-align:right;">
        <div class="line">________________________</div>
        <div>Issue Date:  {{todayDate}}</div>
      </div>
    </div>
    
      <div class="thank-you">— Thank you for your business —</div>
    </div>''',
    },
    {
        'system_key': 'sys.buying.zh',
        'template_name': '采购收据 (中文)',
        'kind': 'buying',
        'locale': 'zh',
        'template_body': '''<style>
:root { --accent:#1F4E79; --accent-light:#DAE6F2; --muted:#6B7280; --text:#1F2937; --border:#BFC9D1; }
* { box-sizing:border-box; }
body { font-family: -apple-system, "Segoe UI", "Microsoft YaHei", "Sakkal Majalla", sans-serif;
       background:#fff; color:var(--text); margin:0; padding:16px; }
.receipt { background:#fff; border:1px solid var(--border); border-radius:8px; padding:28px 32px;
           box-shadow:0 4px 12px rgba(0,0,0,.06); position:relative; }
.receipt.rtl { direction:rtl; }
.receipt.rtl .header-block, .receipt.rtl .meta-strip { direction:rtl; }
.receipt.rtl .kv-table td, .receipt.rtl .kv-table th { text-align:right; }
.receipt.rtl .items-table th, .receipt.rtl .items-table td { text-align:right; }
.receipt.rtl .totals-table td.label { text-align:right; }
.receipt.rtl .totals-table td.value { text-align:left; }
.receipt.rtl .sig-block  { direction:rtl; }
.receipt.rtl .sig-block .col { text-align:right; }

.header-block { display:grid; grid-template-columns: 1.4fr 1fr; gap:24px; margin-bottom:18px; }
.brand-name   { font-size:22px; font-weight:700; color:var(--accent); }
.brand-sub    { font-size:12px; color:var(--muted); margin-top:4px; }
.meta-right   { text-align:right; font-size:12px; color:var(--muted); }
.meta-right .meta-val { color:var(--text); font-weight:700; font-size:14px; }

.title-band   { text-align:center; font-size:26px; font-weight:700; color:var(--accent);
                border-top:3px solid var(--accent); border-bottom:1px solid var(--border);
                padding:14px 0; margin:8px 0 18px; letter-spacing:2px; }

.meta-strip   { display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;
                border:1px solid var(--border); border-radius:6px; padding:12px; margin-bottom:18px;
                background:#FAFBFC; }
.meta-strip .item { text-align:center; }
.meta-strip .label { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; }
.meta-strip .value { font-size:14px; font-weight:700; color:var(--accent); margin-top:4px; }

.section-h { background:var(--accent-light); color:var(--accent); font-weight:700;
             padding:6px 12px; border-left:4px solid var(--accent); border-radius:4px;
             margin:18px 0 8px; font-size:13px; }

.kv-table { width:100%; border-collapse:collapse; margin-bottom:12px; }
.kv-table td { border:1px solid var(--border); padding:8px 10px; font-size:12px; }
.kv-table td.label { background:#F2F6FB; color:var(--accent); font-weight:700; width:35%; }

.items-table { width:100%; border-collapse:collapse; margin-bottom:12px; font-size:12px; }
.items-table th { background:var(--accent); color:#fff; padding:8px; font-weight:700; }
.items-table td { border:1px solid var(--border); padding:8px; }
.items-table td.items-cell { font-style:italic; color:var(--muted); }

.totals-table { width:100%; border-collapse:collapse; margin-top:6px; }
.totals-table td { border:1px solid var(--border); padding:8px 10px; font-size:12px; }
.totals-table td.label { background:#F2F6FB; color:var(--accent); font-weight:700; width:35%; }
.totals-table tr.grand td { background:var(--accent); color:#fff; font-weight:700; font-size:14px; }

.notes-block { margin-top:16px; font-size:11px; color:var(--muted); font-style:italic; }
.notes-block strong { font-style:normal; color:var(--text); }

.sig-block { display:grid; grid-template-columns: 1fr 1fr; gap:32px; margin-top:28px; font-size:12px; }
.sig-block .line { border-top:1px solid var(--text); padding-top:6px; color:var(--muted); }
.sig-block .col { text-align:left; }

.thank-you { text-align:center; margin-top:20px; color:var(--accent); font-style:italic; font-size:13px; }

.receipt.rtl .meta-right { text-align:left; }
.receipt.rtl .section-h   { border-left:none; border-right:4px solid var(--accent); }
.receipt.rtl .items-table th, .receipt.rtl .items-table td { text-align:right; }
.receipt.rtl .totals-table td.value { text-align:left; }
.receipt.rtl .kv-table td.label { text-align:right; }
.receipt.rtl .kv-table td.value { text-align:left; }
.receipt.rtl .sig-block .col { text-align:right; }
</style>
<div class="receipt ">
      <div class="header-block">
        <div>
          <div class="brand-name">{{supplierName}}</div>
          <div class="brand-sub">正式凭证</div>
        </div>
        <div class="meta-right">
          收据编号: <span class="meta-val">{{poNumber}}</span><br>
          开据日期: <span class="meta-val">{{todayDate}}</span>
        </div>
      </div>

      <div class="title-band">采 购 收 据</div>

      <div class="meta-strip"><div class="item"><div class="label">采购订单号</div><div class="value">{{purchaseOrderNumber}}</div></div>
<div class="item"><div class="label">订单日期</div><div class="value">{{orderDate}}</div></div>
<div class="item"><div class="label">状态 · 参考编号</div><div class="value">{{status}}  |  {{imageNumber}}</div></div></div>

      <div class="section-h">供应商信息</div>
      <table class="kv-table"><tr><td class="label">供应商名称</td><td class="value">{{supplierName}}</td></tr>
<tr><td class="label">地址</td><td class="value">{{address}}</td></tr>
<tr><td class="label">城市</td><td class="value">{{city}}</td></tr>
<tr><td class="label">电话</td><td class="value">{{phone}}</td></tr>
<tr><td class="label">电子邮件</td><td class="value">{{email}}</td></tr></table>

      <div class="section-h">详细信息</div>
      <table class="kv-table"><tr><td class="label">采购订单号</td><td class="value">{{purchaseOrderNumber}}</td></tr>
<tr><td class="label">订单日期</td><td class="value">{{orderDate}}</td></tr>
<tr><td class="label">付款方式</td><td class="value">{{paymentMethod}}</td></tr>
<tr><td class="label">付款日期</td><td class="value">{{paymentDate}}</td></tr>
<tr><td class="label">付款编号</td><td class="value">{{paymentNumber}}</td></tr></table>

      <div class="section-h">订单项目</div>
      <table class="items-table">
    <tr>
      <th>#</th><th>订单项目</th><th>数量</th>
      <th>金额</th><th>总计</th>
    </tr>
    <tr>
      <td style="text-align:center;">—</td>
      <td class="items-cell">{{lineItems}}</td>
      <td style="text-align:center;">{{quantity}}</td>
      <td style="text-align:center;">{{amount}} {{currency}}</td>
      <td style="text-align:center;">{{totalAmount}} {{currency}}</td>
    </tr>
    </table>

      <div class="section-h">金额明细</div>
      <table class="totals-table"><tr><td class="label">数量</td><td class="value">{{quantity}}</td></tr>
<tr><td class="label">金额</td><td class="value">{{amount}} {{currency}}</td></tr>
<tr><td class="label">价值</td><td class="value">{{value}} {{currency}}</td></tr>
<tr class="grand"><td class="label">总计</td><td class="value">{{totalAmount}} {{currency}}</td></tr>
<tr class="grand"><td class="label">已付金额</td><td class="value">{{amountPaid}} {{currency}}</td></tr>
<tr><td class="label">应付余额</td><td class="value">{{totalAmount}} - {{amountPaid}}  ({{currency}})</td></tr></table>

      
    <div class="notes-block">
      <strong>备注:</strong> {{lineItems}}<br>
      本收据由系统电子生成，经系统核验后无需纸质盖章或签字。
    </div>
    
      
    <div class="sig-block">
      <div class="col">
        <div class="line">________________________</div>
        <div>授权签字  —  {{supplierName}}</div>
      </div>
      <div class="col" style="text-align:right;">
        <div class="line">________________________</div>
        <div>开据日期:  {{todayDate}}</div>
      </div>
    </div>
    
      <div class="thank-you">— 感谢您的合作 —</div>
    </div>''',
    },
    {
        'system_key': 'sys.payment.ar',
        'template_name': 'إيصال دفع (عربي)',
        'kind': 'payment',
        'locale': 'ar',
        'template_body': '''<style>
:root { --accent:#1F4E79; --accent-light:#DAE6F2; --muted:#6B7280; --text:#1F2937; --border:#BFC9D1; }
* { box-sizing:border-box; }
body { font-family: -apple-system, "Segoe UI", "Microsoft YaHei", "Sakkal Majalla", sans-serif;
       background:#fff; color:var(--text); margin:0; padding:16px; }
.receipt { background:#fff; border:1px solid var(--border); border-radius:8px; padding:28px 32px;
           box-shadow:0 4px 12px rgba(0,0,0,.06); position:relative; }
.receipt.rtl { direction:rtl; }
.receipt.rtl .header-block, .receipt.rtl .meta-strip { direction:rtl; }
.receipt.rtl .kv-table td, .receipt.rtl .kv-table th { text-align:right; }
.receipt.rtl .items-table th, .receipt.rtl .items-table td { text-align:right; }
.receipt.rtl .totals-table td.label { text-align:right; }
.receipt.rtl .totals-table td.value { text-align:left; }
.receipt.rtl .sig-block  { direction:rtl; }
.receipt.rtl .sig-block .col { text-align:right; }

.header-block { display:grid; grid-template-columns: 1.4fr 1fr; gap:24px; margin-bottom:18px; }
.brand-name   { font-size:22px; font-weight:700; color:var(--accent); }
.brand-sub    { font-size:12px; color:var(--muted); margin-top:4px; }
.meta-right   { text-align:right; font-size:12px; color:var(--muted); }
.meta-right .meta-val { color:var(--text); font-weight:700; font-size:14px; }

.title-band   { text-align:center; font-size:26px; font-weight:700; color:var(--accent);
                border-top:3px solid var(--accent); border-bottom:1px solid var(--border);
                padding:14px 0; margin:8px 0 18px; letter-spacing:2px; }

.meta-strip   { display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;
                border:1px solid var(--border); border-radius:6px; padding:12px; margin-bottom:18px;
                background:#FAFBFC; }
.meta-strip .item { text-align:center; }
.meta-strip .label { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; }
.meta-strip .value { font-size:14px; font-weight:700; color:var(--accent); margin-top:4px; }

.section-h { background:var(--accent-light); color:var(--accent); font-weight:700;
             padding:6px 12px; border-left:4px solid var(--accent); border-radius:4px;
             margin:18px 0 8px; font-size:13px; }

.kv-table { width:100%; border-collapse:collapse; margin-bottom:12px; }
.kv-table td { border:1px solid var(--border); padding:8px 10px; font-size:12px; }
.kv-table td.label { background:#F2F6FB; color:var(--accent); font-weight:700; width:35%; }

.items-table { width:100%; border-collapse:collapse; margin-bottom:12px; font-size:12px; }
.items-table th { background:var(--accent); color:#fff; padding:8px; font-weight:700; }
.items-table td { border:1px solid var(--border); padding:8px; }
.items-table td.items-cell { font-style:italic; color:var(--muted); }

.totals-table { width:100%; border-collapse:collapse; margin-top:6px; }
.totals-table td { border:1px solid var(--border); padding:8px 10px; font-size:12px; }
.totals-table td.label { background:#F2F6FB; color:var(--accent); font-weight:700; width:35%; }
.totals-table tr.grand td { background:var(--accent); color:#fff; font-weight:700; font-size:14px; }

.notes-block { margin-top:16px; font-size:11px; color:var(--muted); font-style:italic; }
.notes-block strong { font-style:normal; color:var(--text); }

.sig-block { display:grid; grid-template-columns: 1fr 1fr; gap:32px; margin-top:28px; font-size:12px; }
.sig-block .line { border-top:1px solid var(--text); padding-top:6px; color:var(--muted); }
.sig-block .col { text-align:left; }

.thank-you { text-align:center; margin-top:20px; color:var(--accent); font-style:italic; font-size:13px; }

.receipt.rtl .meta-right { text-align:left; }
.receipt.rtl .section-h   { border-left:none; border-right:4px solid var(--accent); }
.receipt.rtl .items-table th, .receipt.rtl .items-table td { text-align:right; }
.receipt.rtl .totals-table td.value { text-align:left; }
.receipt.rtl .kv-table td.label { text-align:right; }
.receipt.rtl .kv-table td.value { text-align:left; }
.receipt.rtl .sig-block .col { text-align:right; }
</style>
<div class="receipt rtl">
      <div class="header-block">
        <div>
          <div class="brand-name">{{supplierName}}</div>
          <div class="brand-sub">وثيقة رسمية</div>
        </div>
        <div class="meta-right">
          رقم الإيصال: <span class="meta-val">{{poNumber}}</span><br>
          تاريخ الإصدار: <span class="meta-val">{{todayDate}}</span>
        </div>
      </div>

      <div class="title-band">إيصال دفع</div>

      <div class="meta-strip"><div class="item"><div class="label">رقم الدفعة</div><div class="value">{{paymentNumber}}</div></div>
<div class="item"><div class="label">تاريخ الدفع</div><div class="value">{{paymentDate}}</div></div>
<div class="item"><div class="label">الحالة · الرقم المرجعي</div><div class="value">{{status}}  |  {{imageNumber}}</div></div></div>

      <div class="section-h">معلومات المورد</div>
      <table class="kv-table"><tr><td class="label">اسم المورد</td><td class="value">{{supplierName}}</td></tr>
<tr><td class="label">العنوان</td><td class="value">{{address}}</td></tr>
<tr><td class="label">المدينة</td><td class="value">{{city}}</td></tr>
<tr><td class="label">الهاتف</td><td class="value">{{phone}}</td></tr>
<tr><td class="label">البريد الإلكتروني</td><td class="value">{{email}}</td></tr></table>

      <div class="section-h">تفاصيل</div>
      <table class="kv-table"><tr><td class="label">رقم أمر الشراء</td><td class="value">{{purchaseOrderNumber}}</td></tr>
<tr><td class="label">تاريخ الطلب</td><td class="value">{{orderDate}}</td></tr>
<tr><td class="label">رقم الدفعة</td><td class="value">{{paymentNumber}}</td></tr>
<tr><td class="label">تاريخ الدفع</td><td class="value">{{paymentDate}}</td></tr>
<tr><td class="label">طريقة الدفع</td><td class="value">{{paymentMethod}}</td></tr></table>

      <div class="section-h">بنود الطلب</div>
      <table class="items-table">
    <tr>
      <th>#</th><th>بنود الطلب</th><th>الكمية</th>
      <th>المبلغ</th><th>الإجمالي</th>
    </tr>
    <tr>
      <td style="text-align:center;">—</td>
      <td class="items-cell">{{lineItems}}</td>
      <td style="text-align:center;">{{quantity}}</td>
      <td style="text-align:center;">{{amount}} {{currency}}</td>
      <td style="text-align:center;">{{totalAmount}} {{currency}}</td>
    </tr>
    </table>

      <div class="section-h">المبالغ</div>
      <table class="totals-table"><tr><td class="label">الكمية</td><td class="value">{{quantity}}</td></tr>
<tr><td class="label">المبلغ</td><td class="value">{{amount}} {{currency}}</td></tr>
<tr><td class="label">القيمة</td><td class="value">{{value}} {{currency}}</td></tr>
<tr class="grand"><td class="label">الإجمالي</td><td class="value">{{totalAmount}} {{currency}}</td></tr>
<tr class="grand"><td class="label">المبلغ المدفوع</td><td class="value">{{amountPaid}} {{currency}}</td></tr>
<tr><td class="label">الرصيد المتبقي</td><td class="value">{{totalAmount}} - {{amountPaid}}  ({{currency}})</td></tr></table>

      
    <div class="notes-block">
      <strong>ملاحظات:</strong> {{lineItems}}<br>
      هذا الإيصال صادر إلكترونياً ولا يحتاج إلى ختم أو توقيع ورقي عند التحقق من خلال النظام.
    </div>
    
      
    <div class="sig-block">
      <div class="col">
        <div class="line">________________________</div>
        <div>التوقيع المعتمد  —  {{supplierName}}</div>
      </div>
      <div class="col" style="text-align:right;">
        <div class="line">________________________</div>
        <div>تاريخ الإصدار:  {{todayDate}}</div>
      </div>
    </div>
    
      <div class="thank-you">— شكراً لتعاملكم معنا —</div>
    </div>''',
    },
    {
        'system_key': 'sys.payment.en',
        'template_name': 'Payment Receipt (English)',
        'kind': 'payment',
        'locale': 'en',
        'template_body': '''<style>
:root { --accent:#1F4E79; --accent-light:#DAE6F2; --muted:#6B7280; --text:#1F2937; --border:#BFC9D1; }
* { box-sizing:border-box; }
body { font-family: -apple-system, "Segoe UI", "Microsoft YaHei", "Sakkal Majalla", sans-serif;
       background:#fff; color:var(--text); margin:0; padding:16px; }
.receipt { background:#fff; border:1px solid var(--border); border-radius:8px; padding:28px 32px;
           box-shadow:0 4px 12px rgba(0,0,0,.06); position:relative; }
.receipt.rtl { direction:rtl; }
.receipt.rtl .header-block, .receipt.rtl .meta-strip { direction:rtl; }
.receipt.rtl .kv-table td, .receipt.rtl .kv-table th { text-align:right; }
.receipt.rtl .items-table th, .receipt.rtl .items-table td { text-align:right; }
.receipt.rtl .totals-table td.label { text-align:right; }
.receipt.rtl .totals-table td.value { text-align:left; }
.receipt.rtl .sig-block  { direction:rtl; }
.receipt.rtl .sig-block .col { text-align:right; }

.header-block { display:grid; grid-template-columns: 1.4fr 1fr; gap:24px; margin-bottom:18px; }
.brand-name   { font-size:22px; font-weight:700; color:var(--accent); }
.brand-sub    { font-size:12px; color:var(--muted); margin-top:4px; }
.meta-right   { text-align:right; font-size:12px; color:var(--muted); }
.meta-right .meta-val { color:var(--text); font-weight:700; font-size:14px; }

.title-band   { text-align:center; font-size:26px; font-weight:700; color:var(--accent);
                border-top:3px solid var(--accent); border-bottom:1px solid var(--border);
                padding:14px 0; margin:8px 0 18px; letter-spacing:2px; }

.meta-strip   { display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;
                border:1px solid var(--border); border-radius:6px; padding:12px; margin-bottom:18px;
                background:#FAFBFC; }
.meta-strip .item { text-align:center; }
.meta-strip .label { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; }
.meta-strip .value { font-size:14px; font-weight:700; color:var(--accent); margin-top:4px; }

.section-h { background:var(--accent-light); color:var(--accent); font-weight:700;
             padding:6px 12px; border-left:4px solid var(--accent); border-radius:4px;
             margin:18px 0 8px; font-size:13px; }

.kv-table { width:100%; border-collapse:collapse; margin-bottom:12px; }
.kv-table td { border:1px solid var(--border); padding:8px 10px; font-size:12px; }
.kv-table td.label { background:#F2F6FB; color:var(--accent); font-weight:700; width:35%; }

.items-table { width:100%; border-collapse:collapse; margin-bottom:12px; font-size:12px; }
.items-table th { background:var(--accent); color:#fff; padding:8px; font-weight:700; }
.items-table td { border:1px solid var(--border); padding:8px; }
.items-table td.items-cell { font-style:italic; color:var(--muted); }

.totals-table { width:100%; border-collapse:collapse; margin-top:6px; }
.totals-table td { border:1px solid var(--border); padding:8px 10px; font-size:12px; }
.totals-table td.label { background:#F2F6FB; color:var(--accent); font-weight:700; width:35%; }
.totals-table tr.grand td { background:var(--accent); color:#fff; font-weight:700; font-size:14px; }

.notes-block { margin-top:16px; font-size:11px; color:var(--muted); font-style:italic; }
.notes-block strong { font-style:normal; color:var(--text); }

.sig-block { display:grid; grid-template-columns: 1fr 1fr; gap:32px; margin-top:28px; font-size:12px; }
.sig-block .line { border-top:1px solid var(--text); padding-top:6px; color:var(--muted); }
.sig-block .col { text-align:left; }

.thank-you { text-align:center; margin-top:20px; color:var(--accent); font-style:italic; font-size:13px; }

.receipt.rtl .meta-right { text-align:left; }
.receipt.rtl .section-h   { border-left:none; border-right:4px solid var(--accent); }
.receipt.rtl .items-table th, .receipt.rtl .items-table td { text-align:right; }
.receipt.rtl .totals-table td.value { text-align:left; }
.receipt.rtl .kv-table td.label { text-align:right; }
.receipt.rtl .kv-table td.value { text-align:left; }
.receipt.rtl .sig-block .col { text-align:right; }
</style>
<div class="receipt ">
      <div class="header-block">
        <div>
          <div class="brand-name">{{supplierName}}</div>
          <div class="brand-sub">Official Document</div>
        </div>
        <div class="meta-right">
          Receipt No.: <span class="meta-val">{{poNumber}}</span><br>
          Issue Date: <span class="meta-val">{{todayDate}}</span>
        </div>
      </div>

      <div class="title-band">PAYMENT RECEIPT</div>

      <div class="meta-strip"><div class="item"><div class="label">Payment No.</div><div class="value">{{paymentNumber}}</div></div>
<div class="item"><div class="label">Payment Date</div><div class="value">{{paymentDate}}</div></div>
<div class="item"><div class="label">Status · Reference No.</div><div class="value">{{status}}  |  {{imageNumber}}</div></div></div>

      <div class="section-h">Supplier Information</div>
      <table class="kv-table"><tr><td class="label">Supplier Name</td><td class="value">{{supplierName}}</td></tr>
<tr><td class="label">Address</td><td class="value">{{address}}</td></tr>
<tr><td class="label">City</td><td class="value">{{city}}</td></tr>
<tr><td class="label">Phone</td><td class="value">{{phone}}</td></tr>
<tr><td class="label">Email</td><td class="value">{{email}}</td></tr></table>

      <div class="section-h">Details</div>
      <table class="kv-table"><tr><td class="label">Purchase Order No.</td><td class="value">{{purchaseOrderNumber}}</td></tr>
<tr><td class="label">Order Date</td><td class="value">{{orderDate}}</td></tr>
<tr><td class="label">Payment No.</td><td class="value">{{paymentNumber}}</td></tr>
<tr><td class="label">Payment Date</td><td class="value">{{paymentDate}}</td></tr>
<tr><td class="label">Payment Method</td><td class="value">{{paymentMethod}}</td></tr></table>

      <div class="section-h">Order Items</div>
      <table class="items-table">
    <tr>
      <th>#</th><th>Order Items</th><th>Quantity</th>
      <th>Amount</th><th>Total</th>
    </tr>
    <tr>
      <td style="text-align:center;">—</td>
      <td class="items-cell">{{lineItems}}</td>
      <td style="text-align:center;">{{quantity}}</td>
      <td style="text-align:center;">{{amount}} {{currency}}</td>
      <td style="text-align:center;">{{totalAmount}} {{currency}}</td>
    </tr>
    </table>

      <div class="section-h">Amounts</div>
      <table class="totals-table"><tr><td class="label">Quantity</td><td class="value">{{quantity}}</td></tr>
<tr><td class="label">Amount</td><td class="value">{{amount}} {{currency}}</td></tr>
<tr><td class="label">Value</td><td class="value">{{value}} {{currency}}</td></tr>
<tr class="grand"><td class="label">Total</td><td class="value">{{totalAmount}} {{currency}}</td></tr>
<tr class="grand"><td class="label">Amount Paid</td><td class="value">{{amountPaid}} {{currency}}</td></tr>
<tr><td class="label">Balance Due</td><td class="value">{{totalAmount}} - {{amountPaid}}  ({{currency}})</td></tr></table>

      
    <div class="notes-block">
      <strong>Notes:</strong> {{lineItems}}<br>
      This receipt was generated electronically and does not require a physical stamp or signature when verified through the system.
    </div>
    
      
    <div class="sig-block">
      <div class="col">
        <div class="line">________________________</div>
        <div>Authorized Signature  —  {{supplierName}}</div>
      </div>
      <div class="col" style="text-align:right;">
        <div class="line">________________________</div>
        <div>Issue Date:  {{todayDate}}</div>
      </div>
    </div>
    
      <div class="thank-you">— Thank you for your business —</div>
    </div>''',
    },
    {
        'system_key': 'sys.payment.zh',
        'template_name': '付款收据 (中文)',
        'kind': 'payment',
        'locale': 'zh',
        'template_body': '''<style>
:root { --accent:#1F4E79; --accent-light:#DAE6F2; --muted:#6B7280; --text:#1F2937; --border:#BFC9D1; }
* { box-sizing:border-box; }
body { font-family: -apple-system, "Segoe UI", "Microsoft YaHei", "Sakkal Majalla", sans-serif;
       background:#fff; color:var(--text); margin:0; padding:16px; }
.receipt { background:#fff; border:1px solid var(--border); border-radius:8px; padding:28px 32px;
           box-shadow:0 4px 12px rgba(0,0,0,.06); position:relative; }
.receipt.rtl { direction:rtl; }
.receipt.rtl .header-block, .receipt.rtl .meta-strip { direction:rtl; }
.receipt.rtl .kv-table td, .receipt.rtl .kv-table th { text-align:right; }
.receipt.rtl .items-table th, .receipt.rtl .items-table td { text-align:right; }
.receipt.rtl .totals-table td.label { text-align:right; }
.receipt.rtl .totals-table td.value { text-align:left; }
.receipt.rtl .sig-block  { direction:rtl; }
.receipt.rtl .sig-block .col { text-align:right; }

.header-block { display:grid; grid-template-columns: 1.4fr 1fr; gap:24px; margin-bottom:18px; }
.brand-name   { font-size:22px; font-weight:700; color:var(--accent); }
.brand-sub    { font-size:12px; color:var(--muted); margin-top:4px; }
.meta-right   { text-align:right; font-size:12px; color:var(--muted); }
.meta-right .meta-val { color:var(--text); font-weight:700; font-size:14px; }

.title-band   { text-align:center; font-size:26px; font-weight:700; color:var(--accent);
                border-top:3px solid var(--accent); border-bottom:1px solid var(--border);
                padding:14px 0; margin:8px 0 18px; letter-spacing:2px; }

.meta-strip   { display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;
                border:1px solid var(--border); border-radius:6px; padding:12px; margin-bottom:18px;
                background:#FAFBFC; }
.meta-strip .item { text-align:center; }
.meta-strip .label { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; }
.meta-strip .value { font-size:14px; font-weight:700; color:var(--accent); margin-top:4px; }

.section-h { background:var(--accent-light); color:var(--accent); font-weight:700;
             padding:6px 12px; border-left:4px solid var(--accent); border-radius:4px;
             margin:18px 0 8px; font-size:13px; }

.kv-table { width:100%; border-collapse:collapse; margin-bottom:12px; }
.kv-table td { border:1px solid var(--border); padding:8px 10px; font-size:12px; }
.kv-table td.label { background:#F2F6FB; color:var(--accent); font-weight:700; width:35%; }

.items-table { width:100%; border-collapse:collapse; margin-bottom:12px; font-size:12px; }
.items-table th { background:var(--accent); color:#fff; padding:8px; font-weight:700; }
.items-table td { border:1px solid var(--border); padding:8px; }
.items-table td.items-cell { font-style:italic; color:var(--muted); }

.totals-table { width:100%; border-collapse:collapse; margin-top:6px; }
.totals-table td { border:1px solid var(--border); padding:8px 10px; font-size:12px; }
.totals-table td.label { background:#F2F6FB; color:var(--accent); font-weight:700; width:35%; }
.totals-table tr.grand td { background:var(--accent); color:#fff; font-weight:700; font-size:14px; }

.notes-block { margin-top:16px; font-size:11px; color:var(--muted); font-style:italic; }
.notes-block strong { font-style:normal; color:var(--text); }

.sig-block { display:grid; grid-template-columns: 1fr 1fr; gap:32px; margin-top:28px; font-size:12px; }
.sig-block .line { border-top:1px solid var(--text); padding-top:6px; color:var(--muted); }
.sig-block .col { text-align:left; }

.thank-you { text-align:center; margin-top:20px; color:var(--accent); font-style:italic; font-size:13px; }

.receipt.rtl .meta-right { text-align:left; }
.receipt.rtl .section-h   { border-left:none; border-right:4px solid var(--accent); }
.receipt.rtl .items-table th, .receipt.rtl .items-table td { text-align:right; }
.receipt.rtl .totals-table td.value { text-align:left; }
.receipt.rtl .kv-table td.label { text-align:right; }
.receipt.rtl .kv-table td.value { text-align:left; }
.receipt.rtl .sig-block .col { text-align:right; }
</style>
<div class="receipt ">
      <div class="header-block">
        <div>
          <div class="brand-name">{{supplierName}}</div>
          <div class="brand-sub">正式凭证</div>
        </div>
        <div class="meta-right">
          收据编号: <span class="meta-val">{{poNumber}}</span><br>
          开据日期: <span class="meta-val">{{todayDate}}</span>
        </div>
      </div>

      <div class="title-band">付 款 收 据</div>

      <div class="meta-strip"><div class="item"><div class="label">付款编号</div><div class="value">{{paymentNumber}}</div></div>
<div class="item"><div class="label">付款日期</div><div class="value">{{paymentDate}}</div></div>
<div class="item"><div class="label">状态 · 参考编号</div><div class="value">{{status}}  |  {{imageNumber}}</div></div></div>

      <div class="section-h">供应商信息</div>
      <table class="kv-table"><tr><td class="label">供应商名称</td><td class="value">{{supplierName}}</td></tr>
<tr><td class="label">地址</td><td class="value">{{address}}</td></tr>
<tr><td class="label">城市</td><td class="value">{{city}}</td></tr>
<tr><td class="label">电话</td><td class="value">{{phone}}</td></tr>
<tr><td class="label">电子邮件</td><td class="value">{{email}}</td></tr></table>

      <div class="section-h">详细信息</div>
      <table class="kv-table"><tr><td class="label">采购订单号</td><td class="value">{{purchaseOrderNumber}}</td></tr>
<tr><td class="label">订单日期</td><td class="value">{{orderDate}}</td></tr>
<tr><td class="label">付款编号</td><td class="value">{{paymentNumber}}</td></tr>
<tr><td class="label">付款日期</td><td class="value">{{paymentDate}}</td></tr>
<tr><td class="label">付款方式</td><td class="value">{{paymentMethod}}</td></tr></table>

      <div class="section-h">订单项目</div>
      <table class="items-table">
    <tr>
      <th>#</th><th>订单项目</th><th>数量</th>
      <th>金额</th><th>总计</th>
    </tr>
    <tr>
      <td style="text-align:center;">—</td>
      <td class="items-cell">{{lineItems}}</td>
      <td style="text-align:center;">{{quantity}}</td>
      <td style="text-align:center;">{{amount}} {{currency}}</td>
      <td style="text-align:center;">{{totalAmount}} {{currency}}</td>
    </tr>
    </table>

      <div class="section-h">金额明细</div>
      <table class="totals-table"><tr><td class="label">数量</td><td class="value">{{quantity}}</td></tr>
<tr><td class="label">金额</td><td class="value">{{amount}} {{currency}}</td></tr>
<tr><td class="label">价值</td><td class="value">{{value}} {{currency}}</td></tr>
<tr class="grand"><td class="label">总计</td><td class="value">{{totalAmount}} {{currency}}</td></tr>
<tr class="grand"><td class="label">已付金额</td><td class="value">{{amountPaid}} {{currency}}</td></tr>
<tr><td class="label">应付余额</td><td class="value">{{totalAmount}} - {{amountPaid}}  ({{currency}})</td></tr></table>

      
    <div class="notes-block">
      <strong>备注:</strong> {{lineItems}}<br>
      本收据由系统电子生成，经系统核验后无需纸质盖章或签字。
    </div>
    
      
    <div class="sig-block">
      <div class="col">
        <div class="line">________________________</div>
        <div>授权签字  —  {{supplierName}}</div>
      </div>
      <div class="col" style="text-align:right;">
        <div class="line">________________________</div>
        <div>开据日期:  {{todayDate}}</div>
      </div>
    </div>
    
      <div class="thank-you">— 感谢您的合作 —</div>
    </div>''',
    },
]


def upsert_supplier_default_templates(org):
    """Idempotently seed built-in supplier templates for an organization.

    - Creates missing system_key rows.
    - Never overwrites existing name/body (preserves user edits).
    - Never undeletes soft-deleted system templates.
    """
    from api.models import SupplierDocumentTemplate

    for tpl in SUPPLIER_DEFAULT_TEMPLATES:
        SupplierDocumentTemplate.objects.get_or_create(
            organization=org,
            system_key=tpl['system_key'],
            defaults={
                'template_name': tpl['template_name'],
                'template_body': tpl['template_body'],
                'kind': tpl['kind'],
                'is_deleted': False,
            },
        )
