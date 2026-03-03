import { execSync } from 'child_process';

const ref = 'ovfkztxbuoogqjbskaaj';
const pass = 'EEy4XMMLVdMDEphf';
const regions = [
  'sa-east-1', 'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'ap-south-1', 'ca-central-1', 'me-south-1', 'af-south-1'
];

for (const region of regions) {
  const url = `postgresql://postgres.${ref}:${pass}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  try {
    const result = execSync(
      `npx prisma db execute --datasource-url "${url}" --stdin`,
      { input: 'SELECT 1;', timeout: 15000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    console.log(`✅ ${region}: CONNECTED!`);
    console.log(`   URL: ${url}`);
    break;
  } catch (e) {
    const msg = e.stderr?.split('\n').find(l => l.includes('Error') || l.includes('FATAL')) || 'failed';
    console.log(`❌ ${region}: ${msg.trim()}`);
  }
}
