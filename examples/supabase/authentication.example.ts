// Example: Authentication with Supabase
// Demonstrates player login, signup, and wallet linking

import { authManager } from '../../lib/supabase/auth';
import { supabaseHelpers } from '../../lib/supabase/client';

/**
 * Example 1: Sign up a new player with email and password
 */
async function signUpExample() {
  console.log('--- Sign Up Example ---');
  
  const { user, error } = await authManager.signUp({
    email: 'player@example.com',
    password: 'SecurePassword123!',
    walletAddress: '0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4',
    username: 'ProGamer123',
  });

  if (error) {
    console.error('Sign up failed:', error.message);
    return;
  }

  console.log('User signed up successfully:', user?.email);
  console.log('User ID:', user?.id);
}

/**
 * Example 2: Sign in with email and password
 */
async function signInExample() {
  console.log('\n--- Sign In Example ---');
  
  const { user, error } = await authManager.signIn({
    email: 'player@example.com',
    password: 'SecurePassword123!',
  });

  if (error) {
    console.error('Sign in failed:', error.message);
    return;
  }

  console.log('User signed in successfully:', user?.email);
  console.log('User metadata:', user?.user_metadata);
}

/**
 * Example 3: Sign in with magic link (passwordless)
 */
async function magicLinkExample() {
  console.log('\n--- Magic Link Example ---');
  
  const { error } = await authManager.signInWithWallet('player@example.com');

  if (error) {
    console.error('Magic link failed:', error.message);
    return;
  }

  console.log('Magic link sent! Check your email.');
}

/**
 * Example 4: Link wallet to existing user
 */
async function linkWalletExample() {
  console.log('\n--- Link Wallet Example ---');
  
  // First, ensure user is signed in
  const user = await authManager.getUser();
  if (!user) {
    console.log('No user signed in. Sign in first.');
    return;
  }

  const walletAddress = '0x1234567890123456789012345678901234567890';
  const { error } = await authManager.linkWalletToUser(walletAddress);

  if (error) {
    console.error('Link wallet failed:', error.message);
    return;
  }

  console.log('Wallet linked successfully:', walletAddress);
}

/**
 * Example 5: Get current user and session
 */
async function getCurrentUserExample() {
  console.log('\n--- Get Current User Example ---');
  
  const user = await authManager.getUser();
  const session = await authManager.getSession();

  if (!user) {
    console.log('No user signed in');
    return;
  }

  console.log('Current user:', user.email);
  console.log('Wallet address:', user.user_metadata?.wallet_address);
  console.log('Session expires:', session?.expires_at);
}

/**
 * Example 6: Listen to auth state changes
 */
async function authStateListenerExample() {
  console.log('\n--- Auth State Listener Example ---');
  
  const unsubscribe = authManager.onAuthStateChange((state) => {
    if (state.user) {
      console.log('User logged in:', state.user.email);
      console.log('Wallet:', state.user.user_metadata?.wallet_address);
    } else {
      console.log('User logged out');
    }
  });

  // Keep listener active for 30 seconds
  await new Promise((resolve) => setTimeout(resolve, 30000));
  
  // Clean up
  unsubscribe();
  console.log('Auth listener removed');
}

/**
 * Example 7: Complete authentication flow
 */
async function completeAuthFlow() {
  console.log('\n--- Complete Auth Flow Example ---');
  
  // 1. Sign up
  const { user: newUser } = await authManager.signUp({
    email: 'newplayer@example.com',
    password: 'Password123!',
    walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
    username: 'NewGamer',
  });

  if (!newUser) {
    console.log('Sign up failed');
    return;
  }

  console.log('Step 1: User created:', newUser.email);

  // 2. Get player record
  const player = await supabaseHelpers.getPlayerByWallet(
    '0xabcdef0123456789abcdef0123456789abcdef01'
  );

  if (player) {
    console.log('Step 2: Player record found:', player.id);
    console.log('Player username:', player.username);
  }

  // 3. Add additional wallet
  if (player) {
    const wallet = await supabaseHelpers.addWallet(
      player.id,
      137, // Polygon
      '0x9876543210987654321098765432109876543210',
      'Polygon Wallet',
      false
    );
    console.log('Step 3: Additional wallet added:', wallet.id);
  }

  // 4. Get all player wallets
  if (player) {
    const wallets = await supabaseHelpers.getPlayerWallets(player.id);
    console.log('Step 4: Player has', wallets.length, 'wallet(s)');
  }

  // 5. Sign out
  await authManager.signOut();
  console.log('Step 5: User signed out');
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('=================================');
  console.log('Supabase Authentication Examples');
  console.log('=================================\n');

  try {
    // Run individual examples
    // Uncomment the ones you want to test

    // await signUpExample();
    // await signInExample();
    // await magicLinkExample();
    // await linkWalletExample();
    // await getCurrentUserExample();
    // await authStateListenerExample();
    
    // Run complete flow
    await completeAuthFlow();

  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().then(() => {
    console.log('\n✅ Examples completed');
    process.exit(0);
  });
}

export {
  signUpExample,
  signInExample,
  magicLinkExample,
  linkWalletExample,
  getCurrentUserExample,
  authStateListenerExample,
  completeAuthFlow,
};
