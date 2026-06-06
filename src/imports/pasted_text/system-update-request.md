System Update Request

I would like to make two changes to the current system: one minor enhancement and one major feature replacement.

---

1. Minor Change: Shipment Transport Type

Currently, shipments contain tracking and logistics information, but there is no indication of the transportation method.

Please add a new field to every shipment called:

Transport Type (نوع النقل)

Possible values:

- Air Freight (طيران)
- Sea Freight (بحر)
- Land Transport (بري)
- Express Courier (سريع)
- Other (أخرى)

Requirements

Shipment Creation Form

Add a required field:

Transport Type

The user must select how the shipment is being transported.

Shipment Details Page

Display the selected transport type prominently within the shipment information.

Dashboard

Allow filtering shipments by transport type.

Scanner Results

When a shipment is scanned, display:

- Tracking Number
- Responsible Agent
- Shipment Status
- Transport Type

Receipt Generation

All generated receipts must include the transport type.

Example:

Transport Type: Air Freight

or

نوع النقل: طيران

This field should also be available as a template variable:

{{transportType}}

so users can include it in custom receipt templates.

---

2. Major Change: Replace Chat Module with Currency & Business Calculator Center

The current Chat module is no longer needed.

Completely remove:

- Chat navigation item
- Chat pages
- Chat services
- Chat-related components
- Chat notifications

Replace it with a new module called:

محول العملات والحسابات

(Currency & Calculations)

This module should become one of the most useful tools in the entire platform.

---

Important Business Rule

This module must NOT use live market exchange rates.

Do NOT use:

- Forex APIs
- Exchange-rate APIs
- Online rate providers
- Automatic market updates

The business owner manually defines the exchange rates used in daily operations.

Example:

1 EUR = 260 DZD

1 CNY = 21 DZD

1 USD = 235 DZD

The system must always use the manually configured rates, even if they differ from official market rates.

These rates are considered business rates, not market rates.

---

Navigation

Replace:

المحادثات

with:

محول العملات والحسابات

---

Currency & Calculations Module Structure

The module should contain three main tabs.

---

Tab 1: Currency Converter

Purpose:

Quick currency conversion using user-defined exchange rates.

Input Section

- Amount
- Source Currency
- Target Currency

Examples:

- DZD → EUR
- EUR → DZD
- DZD → CNY
- CNY → DZD
- EUR → CNY
- CNY → EUR

Result Section

Display:

- Converted Amount
- Exchange Rate Used
- Conversion Timestamp

Example:

100,000 DZD = 384.62 EUR

Rate Used:

1 EUR = 260 DZD

Date:

06/06/2026 15:45

User Experience

Provide:

- Swap currencies button
- Clear form button
- Copy result button
- Save calculation button

---

Custom Currency Management

The system must not be limited to EUR, DZD and CNY.

Users can create and manage their own currencies.

Examples:

- DZD
- EUR
- CNY
- USD
- AED
- TRY
- GBP
- Any custom business currency

Currency Fields

- Currency Name
- Currency Code
- Currency Symbol
- User-defined Exchange Rate

Currency Operations

- Add Currency
- Edit Currency
- Delete Currency
- Enable / Disable Currency
- Set Default Currency

All currencies must be stored locally in Phase 1.

---

Tab 2: Conversion History

Create a dedicated history section.

Store:

- Amount
- Source Currency
- Target Currency
- Exchange Rate Used
- Result
- Date & Time

Features

- Search History
- Filter History
- Delete Entry
- Clear All History
- Export History

This allows users to review previous calculations and business decisions.

---

Tab 3: Business Calculator

This is a major feature.

Create a complete calculator specifically designed for logistics, import/export and shipment management.

Basic Calculator

Include:

- Addition
- Subtraction
- Multiplication
- Division
- Percentages

---

Shipment Cost Calculator

Allow users to calculate:
- Shipment Value
- Transport Cost
- Agent Commission
- Packaging Cost
- Customs Expenses
- Warehouse Expenses
- Miscellaneous Costs

Example:

Products Value:
500,000 DZD

Transport:
50,000 DZD

Agent Commission:
20,000 DZD

Other Costs:
10,000 DZD

Result:

Total Cost:
580,000 DZD

---

Profit Calculator

Allow users to calculate:

- Selling Price
- Total Cost
- Profit
- Profit Margin %

Example:

Sales:
800,000 DZD

Costs:
580,000 DZD

Profit:
220,000 DZD

Margin:
37.93%

---

Shipment Totals Calculator

Integrate directly with shipment records.

The user can select multiple shipments and automatically calculate:

- Total Shipment Value
- Total Weight
- Total Transport Cost
- Total Number of Packages
- Total Estimated Profit

This should work using data already stored in the system.

---

Dashboard Integration

Add dashboard widgets showing:

- Most Used Currency
- Recent Conversions
- Latest Exchange Rates
- Total Calculations This Month

---

Phase 1

Use Local Storage for:

- Currencies
- Exchange Rates
- Conversion History
- Calculator Records

---

Phase 2

Move all storage to Supabase while keeping the same UI and workflow.

The architecture should be built so the data layer can be replaced without redesigning the frontend.

---

Final Goal

After these changes, the navigation should become:

- Dashboard (لوحة التحكم)
- Shipments (الشحنات)
- Agents (الوكلاء)
- Scanner (الماسح الضوئي)
- Currency & Calculations (محول العملات والحسابات)
- Settings (الإعدادات)

The platform should remain focused on shipment management while providing a powerful financial toolkit that helps business owners manage exchange rates, shipment costs, profitability and daily operational calculations using their own custom business rates.