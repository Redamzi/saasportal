/**
 * Supabase Client for Voyanero Frontend
 * Handles authentication and database operations
 */

import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'voyanero-auth-token',
  },
})

// =====================================================
// AUTH HELPER FUNCTIONS
// =====================================================

/**
 * Sign up a new user
 * @param {string} email - User's email address
 * @param {string} password - User's password (min 6 characters)
 * @param {string} companyName - Company name
 * @param {string} fullName - Optional full name
 * @returns {Promise<{user: Object, session: Object, error: Error}>}
 */
export const signUp = async (email, password, companyName, fullName = '') => {
  try {
    // Validate inputs
    if (!email || !password || !companyName) {
      throw new Error('Email, password, and company name are required')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          company_name: companyName,
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error

    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('Signup error:', error)
    return { user: null, session: null, error }
  }
}

/**
 * Sign in an existing user
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<{user: Object, session: Object, profile: Object, error: Error}>}
 */
export const signIn = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Fetch user profile
    const profile = await getUserProfile(data.user.id)

    return {
      user: data.user,
      session: data.session,
      profile,
      error: null,
    }
  } catch (error) {
    console.error('Sign in error:', error)
    return { user: null, session: null, profile: null, error }
  }
}

/**
 * Sign out the current user
 * @returns {Promise<{error: Error}>}
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error }
  }
}

/**
 * Get the current authenticated user
 * @returns {Promise<{user: Object, profile: Object, error: Error}>}
 */
export const getCurrentUser = async () => {
  try {
    // First check if there's an active session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // If no session or session error, return null (not an error state)
    if (sessionError || !session) {
      return { user: null, profile: null, error: null }
    }

    // Now get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) throw userError

    if (!user) {
      return { user: null, profile: null, error: null }
    }

    // Fetch user profile
    const profile = await getUserProfile(user.id)

    return { user, profile, error: null }
  } catch (error) {
    console.error('Get current user error:', error)
    return { user: null, profile: null, error }
  }
}

/**
 * Get current session
 * @returns {Promise<{session: Object, error: Error}>}
 */
export const getSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) throw error

    return { session, error: null }
  } catch (error) {
    console.error('Get session error:', error)
    return { session: null, error }
  }
}

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @returns {Promise<{error: Error}>}
 */
export const resetPasswordRequest = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required')
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Password reset request error:', error)
    return { error }
  }
}

/**
 * Update user password
 * @param {string} newPassword - New password (min 6 characters)
 * @returns {Promise<{error: Error}>}
 */
export const updatePassword = async (newPassword) => {
  try {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Update password error:', error)
    return { error }
  }
}

/**
 * Listen to auth state changes
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Object} Subscription object with unsubscribe method
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}

// =====================================================
// PROFILE HELPER FUNCTIONS
// =====================================================

/**
 * Get user profile by user ID
 * @param {string} userId - User's UUID
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Get user profile error:', error)
    return null
  }
}

/**
 * Update user profile
 * @param {string} userId - User's UUID
 * @param {Object} updates - Profile fields to update
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Update user profile error:', error)
    return { data: null, error }
  }
}

// =====================================================
// LEADS HELPER FUNCTIONS
// =====================================================

/**
 * Get all leads for a user
 * @param {string} userId - User's UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export const getUserLeads = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Get user leads error:', error)
    return { data: null, error }
  }
}

/**
 * Create a new lead
 * @param {Object} leadData - Lead information
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const createLead = async (leadData) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Create lead error:', error)
    return { data: null, error }
  }
}

/**
 * Update a lead
 * @param {string} leadId - Lead's UUID
 * @param {Object} updates - Lead fields to update
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const updateLead = async (leadId, updates) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Update lead error:', error)
    return { data: null, error }
  }
}

/**
 * Delete a lead
 * @param {string} leadId - Lead's UUID
 * @returns {Promise<{error: Error}>}
 */
export const deleteLead = async (leadId) => {
  try {
    const { error } = await supabase.from('leads').delete().eq('id', leadId)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Delete lead error:', error)
    return { error }
  }
}

// =====================================================
// CREDIT TRANSACTIONS HELPER FUNCTIONS
// =====================================================

/**
 * Get credit transactions for a user
 * @param {string} userId - User's UUID
 * @param {number} limit - Optional limit for number of transactions
 * @returns {Promise<{data: Array, error: Error}>}
 */
export const getCreditTransactions = async (userId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Get credit transactions error:', error)
    return { data: null, error }
  }
}

/**
 * Get user statistics
 * @param {string} userId - User's UUID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const getUserStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Get user stats error:', error)
    return { data: null, error }
  }
}

// Export the client as default
export default supabase
