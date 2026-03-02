import { createClient } from '@supabase/supabase-js';

const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (
  !supabaseUrl ||
  !serviceRoleKey ||
  supabaseUrl.includes('your-project') ||
  serviceRoleKey.includes('sb_secret_xxx')
) {
  console.error(
    'Missing/invalid Supabase env vars. Set PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).',
  );
  process.exit(1);
}

if (!email || !password) {
  console.error(
    'Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in environment variables.',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function getOrCreateAuthUser() {
  const { data: listed, error: listError } =
    await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
  if (listError) throw listError;

  const existing = listed.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );
  if (existing) {
    const { data: updated, error: updateError } =
      await supabase.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
      });
    if (updateError) throw updateError;
    if (!updated.user)
      throw new Error('Auth user was not returned by updateUserById.');
    return updated.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  if (!data.user) throw new Error('Auth user was not returned by createUser.');
  return data.user;
}

async function upsertAdminUser(userId) {
  const { error } = await supabase.from('admin_users').upsert(
    {
      id: userId,
      email,
      role: 'super_admin',
    },
    { onConflict: 'id' },
  );

  if (error) throw error;
}

async function run() {
  const authUser = await getOrCreateAuthUser();
  await upsertAdminUser(authUser.id);
  console.log(`Super admin is ready: ${email}`);
}

run().catch((error) => {
  console.error('Failed to seed super admin:', error.message);
  process.exit(1);
});
