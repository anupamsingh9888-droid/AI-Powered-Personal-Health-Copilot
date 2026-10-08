# Security Specification for HealthLens Firestore Backend

## 1. Data Invariants
1. **User Identity Isolation**: No user can read, create, update, or delete any health data (profiles, records, medications, lab reports, symptoms, chat sessions, chat messages, insights) belonging to another user.
2. **UID Binding**: Any document created or updated must have `incoming().userId == request.auth.uid`.
3. **No Unauthenticated Access**: Unauthenticated callers are denied read and write access to all collections.
4. **No Blanket List Queries**: All `list` operations enforce that every returned resource matches `resource.data.userId == request.auth.uid`.
5. **Immutable Ownership**: The `userId` field cannot be modified once set.
6. **Path & Payload Integrity**: Document IDs must comply with `isValidId()` pattern and payloads must satisfy length limits to prevent resource exhaustion attacks.

## 2. The "Dirty Dozen" Malicious Payloads (Must be rejected)

1. **Payload 1 - Unauthenticated User Write**:
   - Path: `/users/victim_123`
   - Request: `auth: null`, Data: `{ userId: 'victim_123', name: 'Hacker', email: 'hack@bad.com' }`
   - Expected: `PERMISSION_DENIED`

2. **Payload 2 - Impersonated User Profile Creation**:
   - Path: `/users/victim_123`
   - Request: `auth: { uid: 'attacker_456' }`, Data: `{ userId: 'victim_123', name: 'Impersonator', email: 'vic@bad.com' }`
   - Expected: `PERMISSION_DENIED` (userId mismatch)

3. **Payload 3 - Cross-User Health Profile Read**:
   - Path: `/healthProfiles/prof_victim`
   - Request: `auth: { uid: 'attacker_456' }`, Existing: `{ userId: 'victim_123', age: '34' }`
   - Expected: `PERMISSION_DENIED`

4. **Payload 4 - Cross-User Medication Tampering**:
   - Path: `/medications/med_victim`
   - Request: `auth: { uid: 'attacker_456' }`, Existing: `{ userId: 'victim_123', name: 'Metformin' }`
   - Action: `update`, Data: `{ userId: 'victim_123', name: 'Lethal Dose' }`
   - Expected: `PERMISSION_DENIED`

5. **Payload 5 - Identity Theft via Ownership Change**:
   - Path: `/healthRecords/rec_1`
   - Request: `auth: { uid: 'victim_123' }`, Existing: `{ userId: 'victim_123', title: 'Checkup' }`
   - Action: `update`, Data: `{ userId: 'attacker_456', title: 'Checkup' }`
   - Expected: `PERMISSION_DENIED` (attempt to reassign userId)

6. **Payload 6 - Oversized String Buffer Exhaustion**:
   - Path: `/symptoms/sym_1`
   - Request: `auth: { uid: 'user_123' }`, Data: `{ userId: 'user_123', name: 'A'.repeat(50000) }`
   - Expected: `PERMISSION_DENIED` (exceeds maxLength)

7. **Payload 7 - Chat Message Injection to Other User's Session**:
   - Path: `/chatMessages/msg_evil`
   - Request: `auth: { uid: 'attacker_456' }`, Data: `{ sessionId: 'victim_session', userId: 'victim_123', sender: 'assistant', text: 'Malicious advice' }`
   - Expected: `PERMISSION_DENIED`

8. **Payload 8 - Unbounded List Scrape**:
   - Query: `db.collection('healthRecords')` without `where('userId', '==', request.auth.uid)`
   - Expected: `PERMISSION_DENIED`

9. **Payload 9 - ID Poisoning (Path traversal/Excessive ID length)**:
   - Path: `/labReports/${'A'.repeat(500)}`
   - Request: `auth: { uid: 'user_123' }`, Data: `{ userId: 'user_123', testName: 'CBC' }`
   - Expected: `PERMISSION_DENIED` (invalid doc ID)

10. **Payload 10 - Shadow Field Injection**:
    - Path: `/users/user_123`
    - Request: `auth: { uid: 'user_123' }`, Data: `{ userId: 'user_123', name: 'Bob', email: 'bob@ex.com', isAdmin: true, role: 'superadmin' }`
    - Expected: `PERMISSION_DENIED` (disallowed role elevation)

11. **Payload 11 - Cross-User Health Insights Snooping**:
    - Path: `/healthInsights/insight_secret`
    - Request: `auth: { uid: 'attacker_456' }`, Existing: `{ userId: 'victim_123', title: 'Critical Alert' }`
    - Expected: `PERMISSION_DENIED`

12. **Payload 12 - Unauthorized Deletion of Others' Clinical Records**:
    - Path: `/healthRecords/rec_victim`
    - Request: `auth: { uid: 'attacker_456' }`, Existing: `{ userId: 'victim_123' }`
    - Action: `delete`
    - Expected: `PERMISSION_DENIED`
