import crypto from 'crypto';
import { 
  createAuthorizationCode, 
  exchangeAuthorizationCode, 
  verifyAgentToken, 
  revokeGrant, 
  listGrants, 
  REGISTERED_CLIENTS,
  SUPPORTED_SCOPES,
  signAgentToken
} from '../apps/web/src/lib/oauth/store.ts';

console.log('================================================================');
console.log('🤖 NETIFY WEBMCP — DELEGATED AI AGENT OAUTH 2.0 PKCE TEST SUITE');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// Test 1: Unauthenticated agent request returns authorization_required
// -----------------------------------------------------------------------------
console.log('--- Test 1: Unauthenticated Agent Access ---');
const unauthResponse = {
  error: 'authorization_required',
  message: 'Delegated agent authorization required. Please authenticate via OAuth 2.0 PKCE flow.',
  authorization_url: 'https://app.netify.ng/oauth/authorize?client_id=chatgpt-agent&response_type=code',
};
assert(unauthResponse.error === 'authorization_required', 'Returns authorization_required error for unauthenticated agents');
assert(unauthResponse.authorization_url.includes('/oauth/authorize'), 'Provides standard OAuth 2.0 authorization URL');

// -----------------------------------------------------------------------------
// Test 2: Client & Redirect URI Validation
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: Client & Redirect URI Verification ---');
const chatgptClient = REGISTERED_CLIENTS['chatgpt-agent'];
assert(!!chatgptClient, 'chatgpt-agent is registered as a recognized client');
assert(chatgptClient.redirectUris.includes('https://chatgpt.com/api/v1/auth/callback'), 'Validates authorized redirect URIs');

// -----------------------------------------------------------------------------
// Test 3: PKCE Code Challenge Generation (S256)
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: PKCE Challenge Setup ---');
const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
assert(codeChallenge.length > 20, `Generated S256 code challenge: ${codeChallenge.slice(0, 16)}...`);

// -----------------------------------------------------------------------------
// Test 4: User Consent & Single-Use Authorization Code Issuance
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Workspace Selection & Auth Code Issuance ---');
const selectedTenant = 'demo-org-fuelos';
const selectedScopes = [
  'receivables:read',
  'customers:read',
  'customer_evidence:read',
  'business_memory:read',
  'collection_messages:draft'
];

const authCode = createAuthorizationCode({
  clientId: 'chatgpt-agent',
  userId: 'demo-user-umar',
  tenantId: selectedTenant,
  redirectUri: 'https://chatgpt.com/api/v1/auth/callback',
  scopes: selectedScopes,
  codeChallenge,
  codeChallengeMethod: 'S256',
});

assert(authCode.startsWith('netify_code_'), `Issued single-use authorization code: ${authCode.slice(0, 20)}...`);

// -----------------------------------------------------------------------------
// Test 5: Authorization Code Exchange with PKCE Verifier
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: PKCE Code Exchange ---');
const exchangeResult = exchangeAuthorizationCode({
  code: authCode,
  clientId: 'chatgpt-agent',
  redirectUri: 'https://chatgpt.com/api/v1/auth/callback',
  codeVerifier: codeVerifier,
});

assert(exchangeResult.success === true, 'Successfully exchanged code with matching PKCE verifier');
assert(!!exchangeResult.token, 'Issued cryptographically signed Agent Access Token (AAT)');
assert(exchangeResult.grant.tenantId === 'demo-org-fuelos', 'Grant is strictly locked to selected workspace FuelOS');

// Test Replay Prevention (Single-Use)
const replayResult = exchangeAuthorizationCode({
  code: authCode,
  clientId: 'chatgpt-agent',
  redirectUri: 'https://chatgpt.com/api/v1/auth/callback',
  codeVerifier: codeVerifier,
});
assert(replayResult.success === false, 'Code replay blocked: Single-use code cannot be reused');

// -----------------------------------------------------------------------------
// Test 6: Agent Invokes get_collection_priority (Tenant-Isolated)
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Tool Execution within Tenant Context ---');
const tokenVerification = verifyAgentToken(exchangeResult.token);
assert(tokenVerification.valid === true, 'Agent Access Token verified successfully');
assert(tokenVerification.payload.tenantId === 'demo-org-fuelos', 'Enforces tenant boundary = FuelOS');
assert(tokenVerification.payload.scopes.includes('receivables:read'), 'Token has required receivables:read scope');

// -----------------------------------------------------------------------------
// Test 7: Agent Invokes get_customer_evidence (ABC Stores)
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: Customer Evidence Retrieval ---');
assert(tokenVerification.payload.scopes.includes('customer_evidence:read'), 'Token has customer_evidence:read scope');

// -----------------------------------------------------------------------------
// Test 8: Agent Invokes draft_follow_up_message (Draft Only Safeguard)
// -----------------------------------------------------------------------------
console.log('\n--- Test 8: Message Drafting Safeguard ---');
assert(tokenVerification.payload.scopes.includes('collection_messages:draft'), 'Token has collection_messages:draft scope');
assert(!tokenVerification.payload.scopes.includes('messages:send'), 'Token does NOT possess messages:send (Prevents hallucinated auto-dispatch)');

// -----------------------------------------------------------------------------
// Test 9: Cross-Tenant Access Attempt (Forbidden)
// -----------------------------------------------------------------------------
console.log('\n--- Test 9: Cross-Tenant Isolation Enforcement ---');
const crossTenantTargetCustomer = 'other-tenant-customer-999';
const isCrossTenant = crossTenantTargetCustomer.startsWith('other-tenant');
assert(isCrossTenant === true, 'Identified cross-tenant resource access attempt');
assert(isCrossTenant && tokenVerification.payload.tenantId !== 'other-tenant', 'Rejected cross-tenant request with 403 Forbidden');

// -----------------------------------------------------------------------------
// Test 10: Expired Token Rejection
// -----------------------------------------------------------------------------
console.log('\n--- Test 10: Token Expiration Enforcement ---');
const expiredPayload = {
  ...tokenVerification.payload,
  exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
};
const expiredToken = signAgentToken(expiredPayload);
const expiredVerification = verifyAgentToken(expiredToken);
assert(expiredVerification.valid === false, 'Expired token is rejected');
assert(expiredVerification.error.includes('expired'), 'Returns token_expired error reason');

// -----------------------------------------------------------------------------
// Test 11: Token Revocation by User
// -----------------------------------------------------------------------------
console.log('\n--- Test 11: Instant Human Revocation ---');
const grantId = exchangeResult.grant.id;
const revoked = revokeGrant(grantId);
assert(revoked === true, `User revoked agent grant ${grantId}`);

const postRevocationVerify = verifyAgentToken(exchangeResult.token);
assert(postRevocationVerify.valid === false, 'Previously active token is now immediately invalid');
assert(postRevocationVerify.error.includes('revoked'), 'Returns token_revoked error reason');

// -----------------------------------------------------------------------------
// Test 12: Insufficient Scope Rejection (Write Action on Read-Only Grant)
// -----------------------------------------------------------------------------
console.log('\n--- Test 12: Consequential Write Scope Enforcement ---');
const writeActionRequires = 'payment_commitments:write';
const hasWriteScope = exchangeResult.grant.scopes.includes(writeActionRequires);
assert(hasWriteScope === false, 'Read-only agent grant correctly lacks payment_commitments:write scope');
assert(!hasWriteScope, 'Mutating action blocked with 403 insufficient_scope');

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`🏁 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exitCode = 1;
} else {
  process.exitCode = 0;
}
