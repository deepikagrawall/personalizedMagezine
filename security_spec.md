# Security Specification - Artifacts Collection

## Data Invariants
1. A product must have a valid type (`pdf` or `site`).
2. Only admins can create, update, or delete products and categories.
3. Anyone can read products and categories.
4. Timestamps must be validated against server time.
5. IDs must be strictly validated.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to write a product as a non-admin.
2. **Type Corruption**: Set `type` to `malicious_script`.
3. **Price Manipulation**: Set price to `0` or excessive strings.
4. **ID Poisoning**: Inject a 2KB string as `productId`.
5. **Schema Bypass**: Add `isVerified: true` to a product.
6. **Immutable Violation**: Change `createdAt` on update.
7. **Role Escalation**: Attempt to write to a hypothetical `admins` collection.
8. **Malicious Seed**: Large or negative seeds.
9. **Category Injection**: Create a category with XSS payload.
10. **Orphaned Product**: Create product with non-existent category (though categories are just strings here, we validate strings).
11. **Timestamp Spoofing**: Provide a client-side date for `createdAt`.
12. **Mass Deletion**: Attempt to delete all products as a regular user.

## The Test Runner
Tests will be implemented to ensure `PERMISSION_DENIED` for unauthorized writes.
