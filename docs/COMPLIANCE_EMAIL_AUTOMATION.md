# Compliance email automation — V11.1

The app stores compliance data in the existing Supabase segment table:
- complianceRecords
- complianceSettings
- complianceEmailLog

`complianceSettings.reportEmails` contains the comma-separated recipients.
`emailAlertsEnabled` controls automatic alerts; `weeklyDigestEnabled` controls the weekly digest.

The scheduled ChatGPT/Gmail monitor should send only operational deadline data (subject name, requirement/category, company, expiry date, days remaining and responsible). Never include diagnoses or clinical details.

Recommended alert thresholds: 60, 30, 15, 7, 1 days and overdue.
