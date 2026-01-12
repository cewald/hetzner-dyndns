#!/usr/bin/env tsx

import { createHmac, randomBytes } from 'node:crypto';
import 'dotenv/config';

let serverSecret = process.env.SERVER_SECRET;
const username = process.env.DYNDNS_USERNAME || 'your-username';
const port = process.env.PORT || '3000';
const isSecretMissing = !serverSecret || serverSecret.length < 32;

if (isSecretMissing) {
  serverSecret = randomBytes(32).toString('hex');
}

const plainToken = randomBytes(32).toString('hex');
const hashedToken = createHmac('sha256', serverSecret!).update(plainToken).digest('hex');

console.log('\n🔐 Token Generation\n');
console.log('==========================================');

if (isSecretMissing) {
  console.log('\n⚠️  SERVER_SECRET not found in .env file!');
  console.log('🔑 Generated SERVER_SECRET (add this to .env first):');
  console.log(`   ${serverSecret}`);
  console.log('');
  console.log('==========================================');
}

console.log('\n📝 Plain Token (use this in your DynDNS client):');
console.log(`   ${plainToken}`);

console.log('\n🔒 Hashed Token (put this in DYNDNS_TOKEN env var):');
console.log(`   ${hashedToken}`);

console.log('\n==========================================');
console.log('\n📌 Example URL:');
console.log(`   http://localhost:${port}/update/${username}/${plainToken}/192.168.1.1`);

if (isSecretMissing) {
  console.log('\n⚠️  IMPORTANT: The hashed token above was generated with the SERVER_SECRET shown.');
  console.log('   You MUST use that exact SERVER_SECRET in your .env file!');
}

console.log('');
