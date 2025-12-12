# HIPAA Compliance Rules

## NEVER DO
- Log patient names, SSN, DOB to console
- Include PHI in error messages
- Store PHI in plain text
- Commit PHI to git

## ALWAYS DO
- Use anonymized IDs for logging
- Encrypt sensitive data
- Validate all user inputs
- Use environment variables for secrets

## Code Pattern
```javascript
// BAD
console.log(`Patient: ${patient.name}`);

// GOOD  
console.log(`Bill ID: ${bill.id}`);
``