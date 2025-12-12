# ClaimGuardian Medical Billing Rules for Cline

## Project Context
ClaimGuardian AI - A medical billing advocate helping patients identify billing errors.

## Development Rules

### When Writing Billing Code
- Validate CPT codes match: `^[0-9]{5}(-[A-Z0-9]{2})?$`
- Validate ICD-10 codes match: `^[A-Z][0-9]{2}\.?[0-9A-Z]{0,4}$`
- Always compare charges against Medicare rates
- Flag overcharges > 20% as HIGH priority

### When Writing API Endpoints
- Never expose patient PII in responses
- Always validate input CPT/ICD codes
- Return structured error messages
- Log only anonymized bill IDs

### When Writing Frontend Components
- Use TypeScript for all components
- Include loading and error states
- Make billing amounts clearly visible
- Use red color for overcharges

### MCP Tools Available
Use these tools when working on medical billing features:
- `lookup_cpt_code` - Verify CPT codes
- `calculate_medicare_rate` - Get fair pricing
- `detect_billing_errors` - Find overcharges
- `generate_appeal_letter` - Create appeals