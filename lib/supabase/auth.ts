// Supabase Authentication
// Handles player authentication and profile management

import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, supabaseHelpers } from './client';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  walletAddress?: string;
  username?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Authentication Manager for Supabase
 */
export class AuthManager {
  private authStateListeners: Array<(state: AuthState) => void> = [];

  constructor() {
    // Listen to auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      this.notifyListeners({
        user: session?.user || null,
        session,
        loading: false,
      });
    });
  }

  /**
   * Sign up a new user with email and password
   */
  async signUp(data: SignUpData): Promise<{ user: User | null; error: AuthError | null }> {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          wallet_address: data.walletAddress,
          username: data.username,
        },
      },
    });

    if (error) {
      console.error('Sign up error:', error);
      return { user: null, error };
    }

    // Create player record if wallet address is provided
    if (authData.user && data.walletAddress) {
      try {
        await supabaseHelpers.createPlayer(
          data.walletAddress,
          data.email,
          data.username,
          authData.user.id
        );
      } catch (err) {
        console.error('Error creating player record:', err);
      }
    }

    return { user: authData.user, error: null };
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData): Promise<{ user: User | null; error: AuthError | null }> {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return { user: null, error };
    }

    return { user: authData.user, error: null };
  }

  /**
   * Sign in with wallet address (passwordless)
   * Sends a magic link to the user's email
   */
  async signInWithWallet(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error('Magic link error:', error);
      return { error };
    }

    return { error: null };
  }

  /**
   * Sign in with OAuth provider (e.g., Google, Discord)
   */
  async signInWithOAuth(provider: 'google' | 'discord' | 'github'): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('OAuth sign in error:', error);
      return { error };
    }

    return { error: null };
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return { error };
    }

    return { error: null };
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  /**
   * Get the current user
   */
  async getUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Update user metadata (e.g., username, wallet address)
   */
  async updateUserMetadata(metadata: Record<string, any>): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (error) {
      console.error('Update user metadata error:', error);
      return { error };
    }

    return { error: null };
  }

  /**
   * Link wallet address to existing user
   */
  async linkWalletToUser(walletAddress: string): Promise<{ error: Error | null }> {
    const user = await this.getUser();
    
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      // Update user metadata
      await this.updateUserMetadata({ wallet_address: walletAddress });

      // Get or create player record
      const player = await supabaseHelpers.getPlayerByWallet(walletAddress);
      
      if (!player) {
        await supabaseHelpers.createPlayer(
          walletAddress,
          user.email,
          user.user_metadata?.username,
          user.id
        );
      }

      return { error: null };
    } catch (err) {
      console.error('Error linking wallet:', err);
      return { error: err as Error };
    }
  }

  /**
   * Reset password for a user
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error('Reset password error:', error);
      return { error };
    }

    return { error: null };
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Update password error:', error);
      return { error };
    }

    return { error: null };
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authStateListeners.push(callback);

    // Immediately call with current state
    this.getCurrentState().then((state) => callback(state));

    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Get current auth state
   */
  async getCurrentState(): Promise<AuthState> {
    const session = await this.getSession();
    return {
      user: session?.user || null,
      session,
      loading: false,
    };
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyListeners(state: AuthState): void {
    this.authStateListeners.forEach((callback) => callback(state));
  }
}

// Create and export singleton instance
export const authManager = new AuthManager();

// Convenience exports
export const {
  signUp,
  signIn,
  signInWithWallet,
  signInWithOAuth,
  signOut,
  getSession,
  getUser,
  updateUserMetadata,
  linkWalletToUser,
  resetPassword,
  updatePassword,
  onAuthStateChange,
} = authManager;

export default authManager;
