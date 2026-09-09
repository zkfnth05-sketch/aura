const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'aura-media';

async function migratePhotos() {
  console.log('🚀 Starting profile photos migration to Supabase Storage...');

  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
  if (!bucketExists) {
    console.log(`Creating public bucket '${BUCKET_NAME}'...`);
    const { error: createErr } = await supabase.storage.createBucket(BUCKET_NAME, { public: true });
    if (createErr) {
      console.error('Failed to create bucket:', createErr);
      return;
    }
  }

  // Fetch all users
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, photo_urls');

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`Found ${users.length} users in Supabase.`);

  let migratedUsersCount = 0;
  let totalPhotosMigrated = 0;
  let skippedPhotosCount = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const photoUrls = user.photo_urls || [];
    let hasChanges = false;
    const newPhotoUrls = [];

    for (let pIdx = 0; pIdx < photoUrls.length; pIdx++) {
      const photoStr = photoUrls[pIdx];

      if (typeof photoStr === 'string' && photoStr.startsWith('data:image/')) {
        try {
          const matches = photoStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const ext = mimeType.includes('png') ? 'png' : 'jpg';
            const fileName = `profiles/${user.id}_${pIdx}_${Date.now()}.${ext}`;

            const { error: uploadErr } = await supabase.storage
              .from(BUCKET_NAME)
              .upload(fileName, buffer, {
                contentType: mimeType,
                upsert: true,
              });

            if (uploadErr) {
              console.error(`  ❌ Failed to upload photo for ${user.name} (${user.id}):`, uploadErr.message);
              newPhotoUrls.push(photoStr); // Keep original on error
            } else {
              const { data: urlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(fileName);

              newPhotoUrls.push(urlData.publicUrl);
              hasChanges = true;
              totalPhotosMigrated++;
            }
          } else {
            newPhotoUrls.push(photoStr);
          }
        } catch (e) {
          console.error(`  ❌ Exception processing photo for ${user.name}:`, e.message);
          newPhotoUrls.push(photoStr);
        }
      } else {
        newPhotoUrls.push(photoStr);
        skippedPhotosCount++;
      }
    }

    if (hasChanges) {
      const { error: updateErr } = await supabase
        .from('users')
        .update({ photo_urls: newPhotoUrls })
        .eq('id', user.id);

      if (updateErr) {
        console.error(`  ❌ Failed to update user row for ${user.name}:`, updateErr.message);
      } else {
        migratedUsersCount++;
        console.log(`  ✅ [${i + 1}/${users.length}] ${user.name} (${user.id}): ${photoUrls.length} photo(s) migrated to CDN.`);
      }
    }
  }

  console.log('\n=============================================');
  console.log('🎉 Profile Photos Migration Completed!');
  console.log(`- Total Users Checked: ${users.length}`);
  console.log(`- Users Updated: ${migratedUsersCount}`);
  console.log(`- Photos Migrated to Storage: ${totalPhotosMigrated}`);
  console.log(`- Photos Already CDN/Skipped: ${skippedPhotosCount}`);
  console.log('=============================================\n');
}

migratePhotos().catch(console.error);
