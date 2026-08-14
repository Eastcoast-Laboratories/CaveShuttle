# Plan: Email and Password Change for Cave Shuttle

## Current State

### Auto-Login Flow (already working for Roboyard)

1. App auto-registers via `POST /api/mobile/caveshuttle/auto-register` with `profile_uid` + `password`
2. Gets back an API token
3. App can open web via `GET /auto-login?token=XXX&redirect=/settings`
4. `MobileApiController::autoLogin()` (line 775) logs user into web session via token
5. User lands on `/settings` page

### Settings Page (`resources/views/users/settings.blade.php`)

- "Change Password" card requires `current_password` field
- `UserSettingsController::updatePassword()` (line 80) validates `current_password` with `required|current_password`
- Auto-registered users don't know their password (it's auto-generated), so they can't use this form

### Auto-Registered Users

- Get placeholder email: `{profile_uid}@device.caveshuttle.local`
- Have `registered_via_api = true` in users table
- Password is the auto-generated string from `high-score-manager.js` (32 random chars)
- User never sees or types this password manually

## What Needs to Be Done

### Phase 1: Detect Auto-Generated Password & Allow Setting

**1. Database: Add `has_manual_password` column**

- New boolean column on `users` table, default `false`
- Set to `true` when user manually sets their password
- Auto-registered users start with `false`

Migration:
```php
Schema::table('users', function (Blueprint $table) {
    $table->boolean('has_manual_password')->default(false);
});
```

**2. Backend: `UserSettingsController::updatePassword()`**

- If `has_manual_password` is `false`: skip `current_password` validation
- If `has_manual_password` is `true`: require `current_password` as before
- After successful password update: set `has_manual_password = true`

```php
public function updatePassword(Request $request)
{
    $user = Auth::user();
    
    $rules = [
        'password' => ['required', 'confirmed', new StrongPassword],
    ];
    
    if ($user->has_manual_password) {
        $rules['current_password'] = 'required|current_password';
    }
    
    $validated = $request->validate($rules);
    
    $user->password = Hash::make($validated['password']);
    $user->has_manual_password = true;
    $user->save();
    
    return redirect()->route('user.settings')->with('status', 'Password set successfully!');
}
```

**3. Settings View: Conditional UI (`users/settings.blade.php`)**

- If `has_manual_password` is `false`:
  - Title: "Set Password" (not "Change Password")
  - Hide `current_password` field
  - Info text: "You don't have a personal password yet. Set one to log in manually."
- If `has_manual_password` is `true`:
  - Keep existing "Change Password" form with `current_password`

**4. Email Change on Settings Page**

- Add email field to the password form (or separate card)
- If email is placeholder (`@device.caveshuttle.local`): show "Set Email"
- Otherwise: show "Change Email" with current email displayed
- Validate email uniqueness
- After email change, update user's email

**5. Frontend: HamburgerMenu (`src/ui/HamburgerMenu.jsx`)**

- Add "Account Settings" button that opens web via auto-login:
  ```js
  const token = autoAccountManager.getToken();
  const url = `${COMMUNITY_API_URL.replace('/api/mobile/caveshuttle', '')}/auto-login?token=${token}&redirect=/settings`;
  window.open(url, '_blank');
  ```
- Show registration status (registered/pending)
- No in-app password form needed — user does it on the web

### Phase 2: Security Enhancements (later)

**6. Email Verification**

- Send verification email when email is set/changed
- Add `email_verified_at` timestamp (Laravel built-in, column may already exist)
- Unverified email shows warning in UI

**7. Password Recovery**

- Standard Laravel password reset flow via email
- Works once user has set a real email + password
- Auto-accounts without real email: use auto-login from app as fallback

## Implementation Order

1. **Migration** — add `has_manual_password` column
2. **Backend** — update `updatePassword()` to skip `current_password` for auto-accounts
3. **View** — conditional "Set Password" vs "Change Password" UI + email field
4. **Frontend** — "Account Settings" button in HamburgerMenu opening web via auto-login
5. **Phase 2** — email verification, password recovery (later)

## Open Questions

- Should we also allow email change in the same form as password, or separate card?
- Should the app show the current email status (placeholder vs real) in the HamburgerMenu?
