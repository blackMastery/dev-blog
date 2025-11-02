# Automatic Profile Creation - Summary

## What Was Added

### 1. Trigger Function: `create_profile_for_user()`

```sql
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**What it does:**
- Automatically extracts user metadata from the signup
- Creates a profile with:
  - `id`: Same as auth.users.id
  - `username`: From metadata OR generated from email (e.g., user@example.com → "user")
  - `full_name`: From metadata (empty string if not provided)
  - `avatar_url`: From metadata (empty string if not provided)

### 2. Database Trigger: `on_auth_user_created`

```sql
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_user();
```

**What it does:**
- Fires automatically after a new row is inserted into `auth.users`
- Calls the `create_profile_for_user()` function
- Runs for EVERY new user signup

## How It Works

```
User Signs Up
     ↓
Supabase Auth creates user in auth.users
     ↓
Trigger fires: on_auth_user_created
     ↓
Function executes: create_profile_for_user()
     ↓
Profile created in public.profiles
     ↓
User can immediately start creating posts!
```

## Usage Examples

### Option 1: Sign up with full metadata (Recommended)

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'john@example.com',
  password: 'securePassword123',
  options: {
    data: {
      username: 'johndoe',
      full_name: 'John Doe',
      avatar_url: 'https://example.com/avatars/john.jpg'
    }
  }
});

// Profile automatically created with:
// - id: [auth.users.id]
// - username: 'johndoe'
// - full_name: 'John Doe'
// - avatar_url: 'https://example.com/avatars/john.jpg'
```

### Option 2: Sign up with minimal data

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'jane@example.com',
  password: 'securePassword123'
});

// Profile automatically created with:
// - id: [auth.users.id]
// - username: 'jane' (extracted from email)
// - full_name: '' (empty)
// - avatar_url: '' (empty)
```

### Option 3: Sign up with partial metadata

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'bob@example.com',
  password: 'securePassword123',
  options: {
    data: {
      username: 'bobsmith'
    }
  }
});

// Profile automatically created with:
// - id: [auth.users.id]
// - username: 'bobsmith'
// - full_name: '' (empty)
// - avatar_url: '' (empty)
```

## Benefits

✅ **No manual profile creation needed** - Profiles are created automatically
✅ **Ensures data consistency** - Every user has a profile
✅ **Flexible** - Works with or without metadata
✅ **Secure** - Uses SECURITY DEFINER to bypass RLS during creation
✅ **Immediate usability** - Users can start posting right after signup

## Important Notes

1. **Username Uniqueness**: Make sure to handle potential username conflicts in your application. The function will fail if the generated username already exists.

2. **Handling Errors**: Consider adding error handling in your application:

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: { username: 'desiredusername' }
  }
});

if (error) {
  if (error.message.includes('duplicate key')) {
    // Username already taken, ask user to choose another
  }
}
```

3. **Profile Updates**: Users can update their profile after signup:

```javascript
const { data, error } = await supabase
  .from('profiles')
  .update({
    bio: 'Software developer and blogger',
    website: 'https://example.com'
  })
  .eq('id', user.id);
```

## Testing

To test the trigger is working:

```sql
-- Check if trigger exists
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'create_profile_for_user';
```

After signing up a test user, verify the profile was created:

```sql
SELECT * FROM profiles WHERE id = '[user-id]';
```
