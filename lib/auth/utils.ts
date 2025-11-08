// Auth-related utility functions and types

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  name: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

export interface AuthResponse {
  success: boolean
  message?: string
  user?: {
    id: string
    name: string
    email: string
    emailVerified: boolean
  }
  token?: string
}

// Validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" }
  }
  
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    }
  }
  
  return { isValid: true }
}

// Mock API functions (replace with actual API calls)
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // TODO: Replace with actual API call
  console.log("Logging in user:", credentials.email)
  
  return new Promise((resolve) => {
    setTimeout(() => {
      if (credentials.email === "test@example.com" && credentials.password === "password") {
        resolve({
          success: true,
          user: {
            id: "1",
            name: "Test User",
            email: credentials.email,
            emailVerified: true
          },
          token: "mock-jwt-token"
        })
      } else {
        resolve({
          success: false,
          message: "Invalid email or password"
        })
      }
    }, 1000)
  })
}

export const signupUser = async (data: SignupData): Promise<AuthResponse> => {
  // TODO: Replace with actual API call
  console.log("Signing up user:", data.email)
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        user: {
          id: "new-user-id",
          name: data.name,
          email: data.email,
          emailVerified: false
        },
        message: "Account created successfully. Please check your email to verify your account."
      })
    }, 1500)
  })
}

export const forgotPassword = async (email: string): Promise<AuthResponse> => {
  // TODO: Replace with actual API call
  console.log("Sending password reset email to:", email)
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: "Password reset email sent successfully"
      })
    }, 1000)
  })
}

export const resetPassword = async (token: string, newPassword: string): Promise<AuthResponse> => {
  // TODO: Replace with actual API call
  console.log("Resetting password with token:", token, "New password length:", newPassword.length)
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: "Password reset successfully"
      })
    }, 1000)
  })
}

export const verifyEmail = async (token: string): Promise<AuthResponse> => {
  // TODO: Replace with actual API call
  console.log("Verifying email with token:", token)
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: "Email verified successfully"
      })
    }, 1500)
  })
}

export const resendVerificationEmail = async (email: string): Promise<AuthResponse> => {
  // TODO: Replace with actual API call
  console.log("Resending verification email to:", email)
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: "Verification email sent successfully"
      })
    }, 1000)
  })
}