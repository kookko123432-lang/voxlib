# Security Specification: VoxLib

## Data Invariants
1. A **Channel** must belong to the user who created it (`userId == request.auth.uid`).
2. An **Episode** must belong to the user who created it and must link to a valid `channelId`.
3. Users can only read, write, or delete their own documents.
4. `userId`, `createdAt`, and `channelId` (for episodes) are immutable once set.
5. All IDs must be valid alphanumeric strings.
6. All strings and arrays must have size limits to prevent resource exhaustion attacks.

## The Dirty Dozen Payloads (Expected to be DENIED)
1. **Identity Theft (Channel)**: Create a channel with `userId` of another user.
2. **Identity Theft (Episode)**: Create an episode with `userId` of another user.
3. **Privilege Escalation**: Update an existing channel's `userId` to take ownership.
4. **Orphaned Writes**: Create an episode with a non-existent `channelId`.
5. **PII Leak**: Read another user's channel information.
6. **Value Poisoning**: Set `voice` to a 1MB string.
7. **Timestamp Spoofing**: Provide a future `createdAt` date from the client.
8. **Shadow Field Injection**: Create a channel with hidden fields like `isAdmin: true`.
9. **Terminal State Bypass**: Update an episode's script after it's in `completed` status.
10. **ID Injection**: Create a document using an extremely long and malicious ID string.
11. **Collaborative Sabotage**: An authenticated user attempting to delete another user's episode.
12. **Mass Query Scrape**: Attempting to list all channels in the system without a `userId` filter.

## Test Runner (Logic Verification)
Verification will be performed against `firestore.rules` logic.
