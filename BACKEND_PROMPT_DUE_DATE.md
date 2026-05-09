# Backend Implementation: Add Due Date Field to Grinds

## Overview
We need to add a `due_date` field to the Grind model so users can set when a grind needs to be completed by. This field will be:
- **Optional** during creation (user can leave it blank)
- **Nullable** in the database
- **Returned** in all grind API responses
- **Updatable** via the grind update endpoint

## Database Changes

### Migration
Create a new migration to add the `due_date` column to the `grinds` table:

```sql
ALTER TABLE grinds ADD COLUMN due_date DATETIME NULL AFTER target_tier_id;
```

**Migration file naming:** `YYYY_MM_DD_HHMMSS_add_due_date_to_grinds_table.php`

## Model Changes

### Grind Model (`app/Models/Grind.php`)
1. Add `due_date` to the `$fillable` array
2. Cast `due_date` as a datetime:
   ```php
   protected $casts = [
       'due_date' => 'datetime',
       // ... existing casts
   ];
   ```

## Controller Changes

### GrindController (`app/Http/Controllers/GrindController.php`)

**In `store()` method:**
- Accept `due_date` from request
- Validation: must be a valid date and must be in the future (optional check: `nullable|date|after:now`)
- Pass to `Grind::create()`

**In `update()` method:**
- Accept `due_date` from request
- Same validation as store
- Update the grind with new due_date

**In responses (show, index, store):**
- Include `due_date` in the returned grind data

## Validation Rules

Add to the validation in both `store()` and `update()` methods:
```php
'due_date' => 'nullable|date|after:now'
```

Notes:
- `nullable` - user can omit or send null
- `date` - must be a valid date format (ISO 8601 preferred: `YYYY-MM-DD` or `YYYY-MM-DD HH:MM:SS`)
- `after:now` - must be a future date (optional - remove if you want to allow past dates)

## API Contract

### Create Grind Request
```json
{
  "customer_id": 1,
  "game": "CODM",
  "service_type": "rank_boost",
  "starting_tier_id": 1,
  "target_tier_id": 5,
  "base_price": 1500.00,
  "final_price": 1500.00,
  "account_username": "player123",
  "special_instructions": "Be careful with...",
  "payment_method_type_id": 1,
  "due_date": "2026-05-20 18:00:00"
}
```

### Grind Response (all endpoints)
Add this field to existing grind responses:
```json
{
  "id": 1,
  "grind_number": "GRD-001",
  "customer_id": 1,
  "game": "CODM",
  "service_type": "rank_boost",
  "starting_tier_id": 1,
  "target_tier_id": 5,
  "status": "not_started",
  "progress_percentage": 0,
  "base_price": "1500.00",
  "final_price": "1500.00",
  "account_username": "player123",
  "special_instructions": "Be careful with...",
  "payment_method_type_id": 1,
  "due_date": "2026-05-20T18:00:00.000000Z",
  "started_at": null,
  "completed_at": null,
  "cancelled_at": null,
  "created_at": "2026-05-09T10:30:00.000000Z",
  "updated_at": "2026-05-09T10:30:00.000000Z"
}
```

## Testing
- Create a grind with a valid future due_date ✓
- Create a grind without due_date (should accept null) ✓
- Update a grind's due_date ✓
- Verify due_date is returned in all grind responses ✓
- Test validation (past dates should be rejected if using `after:now`) ✓

## Notes
- Use ISO 8601 datetime format for consistency with existing timestamps
- Consider adding a scope in the Grind model for sorting by due date: `scopeByDueDate()`
- Consider adding a query filter for overdue grinds in the future
