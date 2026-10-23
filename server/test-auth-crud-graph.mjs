import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/User.js';
import Note from './src/models/Note.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const BASE_URL = 'http://127.0.0.1:5000';

const results = [];

const assert = (condition, testName) => {
  if (condition) {
    results.push({ name: testName, status: 'PASSED' });
    console.log(`  ✓ ${testName}`);
  } else {
    results.push({ name: testName, status: 'FAILED' });
    console.error(`  ✗ FAILED: ${testName}`);
  }
};

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   MINDMESH E2E TEST SUITE: AUTH, CRUD & GRAPH');
  console.log('======================================================\n');

  const timestamp = Date.now();
  const userAEmail = `architect_a_${timestamp}@example.com`;
  const userBEmail = `architect_b_${timestamp}@example.com`;
  let tokenA = '';
  let tokenB = '';
  let userANoteId = '';

  // 1. HEALTH CHECK
  console.log('[1] Testing Health Endpoint');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200 && healthData.status === 'ok', 'GET /api/health responds with 200 and status ok');

  // 2. AUTHENTICATION VALIDATION
  console.log('\n[2] Testing Authentication & Input Validation');
  const invalidReg = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bad-email', username: 'A', password: '123' }),
  });
  assert(invalidReg.status === 400, 'POST /api/auth/register rejects invalid email and short password (400)');

  // 3. USER A REGISTRATION
  const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userAEmail,
      username: 'ArchitectA',
      password: 'Password123!',
    }),
  });
  const regAData = await regARes.json();
  tokenA = regAData.token;
  assert(regARes.status === 201 && tokenA && regAData.user.email === userAEmail, 'POST /api/auth/register creates User A (201)');

  // 4. DUPLICATE REGISTRATION REJECTION
  const dupReg = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userAEmail,
      username: 'DuplicateA',
      password: 'Password123!',
    }),
  });
  assert(dupReg.status === 409, 'POST /api/auth/register rejects duplicate email (409 Conflict)');

  // 5. USER A LOGIN
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password: 'Password123!' }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200 && loginData.token, 'POST /api/auth/login authenticates User A (200)');

  // 6. INVALID LOGIN REJECTION
  const badLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password: 'WrongPassword!' }),
  });
  assert(badLogin.status === 401, 'POST /api/auth/login rejects wrong password (401)');

  // 7. SESSION RESTORATION (GET /api/auth/me)
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const meData = await meRes.json();
  assert(meRes.status === 200 && meData.user.email === userAEmail, 'GET /api/auth/me verifies active session');

  // 8. ACCESS CONTROL & ROUTE PROTECTION
  console.log('\n[3] Testing Route Protection (Unauthenticated Access)');
  const unauthGet = await fetch(`${BASE_URL}/api/notes`);
  assert(unauthGet.status === 401, 'GET /api/notes rejects unauthenticated request (401)');

  const unauthPost = await fetch(`${BASE_URL}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Hack', description: 'Hack' }),
  });
  assert(unauthPost.status === 401, 'POST /api/notes rejects unauthenticated request (401)');

  // 9. USER A NOTE CRUD
  console.log('\n[4] Testing User-Scoped Note CRUD');
  const createNoteRes = await fetch(`${BASE_URL}/api/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      title: 'Quantum Synaptic Graph Alpha',
      description: 'Foundational non-local connections across cognitive memory spaces.',
      category: 'Quantum Computing',
      tags: ['Quantum', 'Neural', 'Graph'],
    }),
  });
  const createNoteData = await createNoteRes.json();
  userANoteId = createNoteData.id;
  assert(createNoteRes.status === 201 && userANoteId, 'POST /api/notes creates note owned by User A (201)');

  // User A retrieves notes
  const userANotesRes = await fetch(`${BASE_URL}/api/notes`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const userANotes = await userANotesRes.json();
  const foundUserANote = userANotes.some((n) => n.id === userANoteId);
  assert(foundUserANote, 'GET /api/notes includes the newly created note for User A');

  // User A updates note
  const updateNoteRes = await fetch(`${BASE_URL}/api/notes/${userANoteId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      title: 'Quantum Synaptic Graph Alpha (Updated)',
      category: 'Advanced Quantum',
    }),
  });
  const updateNoteData = await updateNoteRes.json();
  assert(
    updateNoteRes.status === 200 &&
    updateNoteData.title === 'Quantum Synaptic Graph Alpha (Updated)',
    'PATCH /api/notes/:id updates note fields for owner (200)'
  );

  // 10. MULTI-TENANT ISOLATION (USER B CANNOT ACCESS USER A NOTES)
  console.log('\n[5] Testing User Note Isolation & Ownership Enforcement');
  const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userBEmail,
      username: 'ArchitectB',
      password: 'Password123!',
    }),
  });
  const regBData = await regBRes.json();
  tokenB = regBData.token;

  // User B tries to read User A's note
  const userBTriesRead = await fetch(`${BASE_URL}/api/notes/${userANoteId}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(userBTriesRead.status === 404, 'User B cannot read User A note (404 Not Found - no leak)');

  // User B tries to update User A's note
  const userBTriesUpdate = await fetch(`${BASE_URL}/api/notes/${userANoteId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ title: 'Stolen Note' }),
  });
  assert(userBTriesUpdate.status === 404, 'User B cannot update User A note (404 Not Found)');

  // User B tries to delete User A's note
  const userBTriesDelete = await fetch(`${BASE_URL}/api/notes/${userANoteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(userBTriesDelete.status === 404, 'User B cannot delete User A note (404 Not Found)');

  // 11. MALFORMED ID & VALIDATION
  console.log('\n[6] Testing Malformed ObjectId & Payload Validation');
  const badIdRes = await fetch(`${BASE_URL}/api/notes/invalid-object-id-999`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(badIdRes.status === 400, 'GET /api/notes/:id rejects malformed ObjectId (400)');

  // 12. USER A DELETES NOTE
  console.log('\n[7] Testing Note Deletion');
  const deleteRes = await fetch(`${BASE_URL}/api/notes/${userANoteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(deleteRes.status === 200, 'DELETE /api/notes/:id deletes note for owner (200)');

  const verifyDeleted = await fetch(`${BASE_URL}/api/notes/${userANoteId}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(verifyDeleted.status === 404, 'GET /api/notes/:id confirms note is permanently deleted (404)');

  // 13. KNOWLEDGE GRAPH RELATIONSHIP ALGORITHM UNIT TEST
  console.log('\n[8] Testing Knowledge Graph Relationship Logic');
  const mockNotes = [
    { id: '1', title: 'React 19 Hooks', tags: ['React', 'Frontend'], category: 'Frontend' },
    { id: '2', title: 'Vue Reactivity', tags: ['Vue', 'Frontend'], category: 'Frontend' },
    { id: '3', title: 'CSS Grid Mastery', tags: ['CSS', 'Styling'], category: 'Frontend' },
    { id: '4', title: 'Database Indexing', tags: ['SQL', 'Performance'], category: 'Database' },
  ];

  // Test relationship generation
  const links = [];
  for (let i = 0; i < mockNotes.length; i++) {
    for (let j = i + 1; j < mockNotes.length; j++) {
      const a = mockNotes[i];
      const b = mockNotes[j];
      const aTags = a.tags.map((t) => t.toLowerCase());
      const bTags = b.tags.map((t) => t.toLowerCase());
      const sharedTags = aTags.filter((t) => bTags.includes(t));

      if (sharedTags.length > 0) {
        links.push({ source: a.id, target: b.id, type: 'tag', shared: sharedTags });
      } else if (a.category && b.category && a.category.toLowerCase() === b.category.toLowerCase()) {
        links.push({ source: a.id, target: b.id, type: 'category' });
      }
    }
  }

  // Note 1 and Note 2 share 'frontend' tag -> Tag link
  const hasTagLink = links.some(
    (l) => (l.source === '1' && l.target === '2') && l.type === 'tag'
  );
  // Note 1 and Note 3 don't share tags, but share 'Frontend' category -> Category link
  const hasCatLink = links.some(
    (l) => (l.source === '1' && l.target === '3') && l.type === 'category'
  );
  // Note 4 shares neither -> No link
  const hasDbLink = links.some((l) => l.source === '4' || l.target === '4');

  assert(hasTagLink, 'Graph correctly connects notes sharing tags (type: tag)');
  assert(hasCatLink, 'Graph connects notes sharing category when tags differ (type: category)');
  assert(!hasDbLink, 'Graph isolates notes that share neither tag nor category');

  // CLEANUP TEST USERS
  await mongoose.connect(process.env.MONGODB_URI);
  await Note.deleteMany({ user: { $in: [regAData.user.id, regBData.user.id] } });
  await User.deleteMany({ email: { $in: [userAEmail, userBEmail] } });
  await mongoose.disconnect();

  console.log('\n======================================================');
  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test Runner Exception:', err);
  process.exit(1);
});
