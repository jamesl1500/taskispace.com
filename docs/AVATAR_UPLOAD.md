# Avatar Upload Setup

This guide explains how to set up avatar image uploads with Supabase Storage.

## Migration

Run the avatar storage migration to create the storage bucket and policies:

```bash
# Using Supabase CLI
supabase db push

# Or manually apply the migration file:
# supabase\migrations\20250117000000_create_avatars_storage.sql
```

## What the Migration Does

1. **Creates Storage Bucket**: Creates a public bucket named `avatars` for storing profile pictures
2. **Sets Up Policies**:
   - Users can upload their own avatars (organized by user ID)
   - Users can update their own avatars
   - Users can delete their own avatars
   - Anyone can view avatars (public read access)

## Storage Structure

Avatars are stored in the following structure:
```
avatars/
  ├── {user_id}/
  │   ├── {timestamp}.jpg
  │   ├── {timestamp}.png
  │   └── ...
```

## Features

### Frontend (Settings Page)
- **Upload**: Select and upload a new avatar image
- **Preview**: See avatar preview before uploading
- **Delete**: Remove current avatar
- **Validation**: 
  - File types: JPEG, JPG, PNG, GIF, WebP
  - Max size: 5MB

### Backend (API Routes)

#### POST `/api/settings/profile/avatar`
- Uploads a new avatar
- Validates file type and size
- Deletes old avatar if exists
- Updates profile with new avatar URL

#### DELETE `/api/settings/profile/avatar`
- Deletes current avatar from storage
- Removes avatar URL from profile

### Utility Functions (`lib/utils/uploadAvatar.ts`)
- `uploadAvatar()`: Client-side upload helper
- `deleteAvatar()`: Client-side delete helper
- `getAvatarUrl()`: Get public URL for an avatar

## Usage

### In the Settings Page
1. Navigate to Settings → Profile
2. Click "Choose Image" to select an avatar
3. Click "Upload" to save the new avatar
4. Click "Remove" to delete the current avatar

### Programmatically
```typescript
import { uploadAvatar, deleteAvatar, getAvatarUrl } from '@/lib/utils/uploadAvatar'

// Upload an avatar
const result = await uploadAvatar(file, userId)
if (result.error) {
  console.error(result.error)
} else {
  console.log('Avatar URL:', result.url)
}

// Delete an avatar
const success = await deleteAvatar(storagePath)

// Get public URL
const url = getAvatarUrl(storagePath)
```

## Security

- **Authentication Required**: Only authenticated users can upload/delete
- **User Isolation**: Users can only manage their own avatars
- **Public Access**: Avatars are publicly readable for display purposes
- **File Validation**: Type and size validation on both client and server

## Troubleshooting

### "Failed to upload avatar"
- Check Supabase storage bucket exists
- Verify RLS policies are applied
- Ensure file meets validation requirements

### "Avatar not displaying"
- Check the avatar_url in the profiles table
- Verify the storage bucket is public
- Check browser console for CORS errors

### "Permission denied"
- Ensure user is authenticated
- Verify storage policies are correctly applied
- Check user ID matches the folder structure
