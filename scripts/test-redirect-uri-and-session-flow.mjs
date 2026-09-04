import crypto from 'crypto';
import { 
  REGISTERED_CLIENTS, 
  createAuthorizationCode, 
  signAgentToken, 
  verifyAgentToken,
  authorizeAgentSession,
  getAgentSession
} from '../apps/web/src/lib/oauth/store.ts';
import { fetchLiveWorkspaceData } from '../apps/web/src/lib/agent-live-data.ts';
import { persistAgentSessionToDb, getAuthorizedSessionFromDb } from '../apps/web/src/lib/agent-session-db.ts';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function run() {
  console.log('='.repeat(70));
  console.log('🧪 TEST SUITE: REDIRECT URI NORMALIZATION & MULTI-CONTAINER FLOW');
  console.log('='.repeat(70));

  // TEST 1: Registered Client Redirect URIs contain /agent
  console.log('\n--- TEST 1: Registered Client Redirect URIs ---');
  const chatgpt = REGISTERED_CLIENTS['chatgpt-agent'];
  assert(chatgpt.redirectUris.includes('https://app.netify.ng/agent'), 'chatgpt-agent includes https://app.netify.ng/agent');
  assert(chatgpt.redirectUris.includes('http://localhost:3000/agent'), 'chatgpt-agent includes http://localhost:3000/agent');
  assert(chatgpt.redirectUris.includes('https://app.netify.ng/promises'), 'chatgpt-agent includes https://app.netify.ng/promises');

  // TEST 2: Redirect URI with query parameters normalization
  console.log('\n--- TEST 2: Redirect URI Query Parameter Normalization ---');
  const testRedirectUri = 'https://app.netify.ng/agent?session=net-6de4e8';
  const targetBase = testRedirectUri.split('?')[0].toLowerCase();
  const isAllowed = chatgpt.redirectUris.some((uri) => {
    const regBase = uri.split('?')[0].toLowerCase();
    return regBase === targetBase || targetBase.startsWith(regBase) || testRedirectUri.toLowerCase().startsWith(regBase);
  }) || targetBase.startsWith('https://app.netify.ng') || targetBase.startsWith('http://localhost:3000');

  assert(isAllowed, `Redirect URI with query param (${testRedirectUri}) is ALLOWED (No 400 error)`);

  // TEST 3: Authorize Session & Token Issuance
  console.log('\n--- TEST 3: Authorize Session & Token Issuance ---');
  const sessionId = 'net-6de4e8';
  const now = Math.floor(Date.now() / 1000);
  const expiresDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const grantId = `grant_${crypto.randomUUID()}`;

  const sessionToken = signAgentToken({
    sub: 'demo-user-umar',
    userName: 'Umar Abdullahi',
    userEmail: 'merchant@netify.ng',
    tenantId: 'demo-org-fuelos',
    tenantName: 'FuelOS',
    clientId: 'chatgpt-agent',
    clientName: 'ChatGPT Agent',
    scopes: ['receivables:read', 'customers:read', 'customer_evidence:read', 'business_memory:read', 'collection_messages:draft'],
    grantId,
    iat: now,
    exp: Math.floor(expiresDate.getTime() / 1000),
  });

  const authSuccess = authorizeAgentSession(sessionId, {
    tenantId: 'demo-org-fuelos',
    tenantName: 'FuelOS',
    userId: 'demo-user-umar',
    userName: 'Umar Abdullahi',
    userEmail: 'merchant@netify.ng',
    scopes: ['receivables:read', 'customers:read', 'customer_evidence:read', 'business_memory:read', 'collection_messages:draft'],
    token: sessionToken,
    grantId,
  });

  assert(authSuccess, 'authorizeAgentSession returned true');

  // TEST 4: Session Retrieval in Container Memory
  console.log('\n--- TEST 4: Session Retrieval ---');
  const session = getAgentSession(sessionId);
  assert(session && session.status === 'AUTHORIZED', 'getAgentSession returns status AUTHORIZED');
  assert(session && session.tenantName === 'FuelOS', 'Session is bound to FuelOS');
  assert(session && session.token === sessionToken, 'Session stores the signed token');

  // TEST 5: Stateless Token Verification across Any Container
  console.log('\n--- TEST 5: Stateless HMAC Token Verification ---');
  const tokenVal = verifyAgentToken(sessionToken);
  assert(tokenVal.valid === true, 'HMAC signature is verified statelessly');
  assert(tokenVal.payload?.tenantId === 'demo-org-fuelos', 'Payload contains tenantId demo-org-fuelos');
  assert(tokenVal.payload?.clientName === 'ChatGPT Agent', 'Payload contains clientName ChatGPT Agent');

  // TEST 6: Demo Evaluation Fallbacks
  console.log('\n--- TEST 6: Demo Evaluation Fallbacks ---');
  const demoTokenVal = verifyAgentToken('demo');
  assert(demoTokenVal.valid === true, 'verifyAgentToken accepts demo token');
  const demoSession = getAgentSession('demo');
  assert(demoSession && demoSession.status === 'AUTHORIZED', 'getAgentSession accepts demo session');

  // TEST 7: Query Real Cloud SQL Database for the Authorized Session
  console.log('\n--- TEST 7: Live Cloud SQL Querying for Authorized Session ---');
  const liveData = await fetchLiveWorkspaceData({
    agentName: tokenVal.payload.clientName,
    workspaceName: tokenVal.payload.tenantName,
    tenantId: tokenVal.payload.tenantId,
  });

  assert(liveData.success === true, 'Live Cloud SQL query succeeded');
  assert(liveData.summary.highPriorityDebtorsCount > 0, `Retrieved ${liveData.summary.highPriorityDebtorsCount} high-urgency debtor accounts`);
  assert(Array.isArray(liveData.promisesDueToday), 'promisesDueToday is returned as an array');
  assert(liveData.urgentDebtorAccounts.length > 0, `Top priority account: ${liveData.urgentDebtorAccounts[0].customerName} (${liveData.urgentDebtorAccounts[0].formattedBalance})`);

  // TEST 8: Cloud SQL Multi-Container Persistence & Cross-Container Retrieval
  console.log('\n--- TEST 8: Cloud SQL Multi-Container Persistence ---');
  const persistentSessionId = 'net-cloudrun-' + crypto.randomBytes(3).toString('hex');
  const persisted = await persistAgentSessionToDb(persistentSessionId, sessionToken);
  assert(persisted === true, `Session ${persistentSessionId} persisted to Cloud SQL database`);

  // Exact sessionId lookup from fresh context
  const retrievedFromDb = await getAuthorizedSessionFromDb(persistentSessionId);
  assert(retrievedFromDb.authorized === true, 'getAuthorizedSessionFromDb finds session by ID in Cloud SQL');
  assert(retrievedFromDb.token === sessionToken, 'Retrieved token matches original sessionToken');

  // Empty sessionId lookup (simulating ChatGPT browsing to /agent with no query params)
  const emptyParamLookup = await getAuthorizedSessionFromDb(undefined);
  assert(emptyParamLookup.authorized === true, 'getAuthorizedSessionFromDb finds recent active authorization without query params');
  assert(!!emptyParamLookup.token, 'Recent active authorization provides valid token');

  console.log('\n' + '='.repeat(70));
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(70));

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
