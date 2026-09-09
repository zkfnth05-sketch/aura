const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [k, ...v] = trimmed.split('=');
    if (k && v.length > 0) {
      process.env[k.trim()] = v.join('=').trim();
    }
  });
}

const firebaseConfig = {
  projectId: 'aura-ai-dating-38251551-64a99',
  appId: '1:865239923716:web:85bf2f929b180117920951',
  storageBucket: 'aura-ai-dating-38251551-64a99.firebasestorage.app',
  apiKey: 'AIzaSyBi2ZtcLyrkNuUkihBn4Rj8a_ym6RxtqOg',
  authDomain: 'aura-ai-dating-38251551-64a99.firebaseapp.com',
  messagingSenderId: '865239923716',
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key if available for full admin bypass of RLS, else anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function toIsoString(val) {
  if (!val) return new Date().toISOString();
  if (typeof val.toDate === 'function') return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return new Date(val).toISOString();
  return new Date().toISOString();
}

function toSupabaseUser(id, data) {
  return {
    id: id,
    name: data.name || '',
    email: data.email || null,
    phone_number: data.phoneNumber || null,
    age: typeof data.age === 'number' ? data.age : (parseInt(data.age, 10) || 25),
    gender: data.gender || '여성',
    bio: data.bio || '',
    location: data.location || '서울',
    lat: typeof data.lat === 'number' ? data.lat : null,
    lng: typeof data.lng === 'number' ? data.lng : null,
    language: data.language || 'ko',
    hobbies: Array.isArray(data.hobbies) ? data.hobbies : [],
    interests: Array.isArray(data.interests) ? data.interests : [],
    photo_urls: Array.isArray(data.photoUrls) ? data.photoUrls : [],
    video_urls: Array.isArray(data.videoUrls) ? data.videoUrls : [],
    relationship: Array.isArray(data.relationship) ? data.relationship : [],
    values: Array.isArray(data.values) ? data.values : [],
    communication: Array.isArray(data.communication) ? data.communication : [],
    lifestyle: Array.isArray(data.lifestyle) ? data.lifestyle : [],
    blocked_users: Array.isArray(data.blockedUsers) ? data.blockedUsers : [],
    completed_coach_marks: Array.isArray(data.completedCoachMarks) ? data.completedCoachMarks : [],
    created_at: toIsoString(data.createdAt),
    updated_at: new Date().toISOString(),
  };
}

async function migrate() {
  console.log('--- 1. Authenticating to Firebase ---');
  await signInAnonymously(auth);
  console.log('Firebase auth successful.');

  console.log('--- 2. Fetching Users from Firestore ---');
  const userSnap = await getDocs(collection(db, 'users'));
  console.log(`Found ${userSnap.docs.length} users in Firestore.`);

  const userRows = userSnap.docs.map((doc) => toSupabaseUser(doc.id, doc.data()));

  console.log('--- 3. Migrating Users to Supabase in batches ---');
  const batchSize = 25;
  let successCount = 0;

  for (let i = 0; i < userRows.length; i += batchSize) {
    const batch = userRows.slice(i, i + batchSize);
    const { error } = await supabase.from('users').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Batch ${i / batchSize + 1} error:`, error);
    } else {
      successCount += batch.length;
      console.log(`Migrated ${successCount}/${userRows.length} users.`);
    }
  }

  console.log(`\n🎉 User Migration Complete! Successfully migrated ${successCount} users to Supabase.`);

  // Verify final count
  const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  console.log(`Current users in Supabase: ${usersCount}`);

  console.log('\n--- 4. Fetching Likes from Firestore ---');
  const likesSnap = await getDocs(collection(db, 'likes'));
  console.log(`Found ${likesSnap.docs.length} likes in Firestore.`);

  const likeMap = new Map();
  likesSnap.docs.forEach((doc) => {
    const d = doc.data();
    if (d.likerId && d.likeeId) {
      const key = `${d.likerId}_${d.likeeId}`;
      likeMap.set(key, {
        liker_id: d.likerId,
        likee_id: d.likeeId,
        is_like: d.isLike !== undefined ? Boolean(d.isLike) : true,
        created_at: toIsoString(d.timestamp),
      });
    }
  });

  const likeRows = Array.from(likeMap.values());
  console.log(`--- 5. Migrating ${likeRows.length} unique Likes to Supabase ---`);
  let likeSuccessCount = 0;
  for (let i = 0; i < likeRows.length; i += batchSize) {
    const batch = likeRows.slice(i, i + batchSize);
    const { error } = await supabase.from('likes').upsert(batch, { onConflict: 'liker_id,likee_id' });
    if (error) {
      console.error(`Likes batch ${i / batchSize + 1} error:`, error);
    } else {
      likeSuccessCount += batch.length;
      console.log(`Migrated ${likeSuccessCount}/${likeRows.length} unique likes.`);
    }
  }

  const { count: likesCount } = await supabase.from('likes').select('*', { count: 'exact', head: true });
  console.log(`Current likes in Supabase: ${likesCount}`);
}

migrate().catch(console.error);
