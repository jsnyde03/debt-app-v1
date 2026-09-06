import run from '@/store/payoffCelebration.test';
run().then(
  () => console.log('SUITE EXIT: green'),
  (e) => { console.error('SUITE RED:', (e as Error).message); process.exitCode = 1; },
);
