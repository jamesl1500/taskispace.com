/**
 * Auth Form Schema
 * 
 * This schema defines the structure and validation rules for the authentication forms
 * used in the application. It includes fields for email, password, and confirm password,
 * along with their respective validation criteria.
 * 
 * @module forms/auth/schema
 */
import * as z from 'zod'

/**
 * Signup Form Schema
 * 
 * This schema is used to validate the signup form inputs.
 * Fields:
 * - full_name: Required, 2-100 characters
 * - email: Required, valid email format
 * - password: Required, 8-100 characters, must include uppercase, lowercase, number, and special character
 * - confirm_password: Must match the password field
 * 
 * @constant {z.ZodObject} signupFormSchema - The Zod schema for signup form validation
 */
export const signupFormSchema = z.object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters long').max(100, 'Full name must be at most 100 characters long'),
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .max(100, 'Password must be at most 100 characters long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirm_password: z.string(),
    agree_to_terms: z.boolean().refine((val) => val === true, {
        message: 'You must agree to the terms and conditions',
    }),
}).refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
});

/**
 * Login Form Schema
 * 
 * This schema is used to validate the login form inputs.
 * Fields:
 * - email: Required, valid email format
 * - password: Required
 * 
 * @constant {z.ZodObject} loginFormSchema - The Zod schema for login form validation
 */
export const loginFormSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

/**
 * Password Reset Form Schema
 * 
 * This schema is used to validate the password reset form inputs.
 * Fields:
 * - email: Required, valid email format
 * 
 * @constant {z.ZodObject} passwordResetFormSchema - The Zod schema for password reset form validation
 */
export const passwordResetFormSchema = z.object({
    email: z.string().email('Invalid email address'),
});

/**
 * New Password Form Schema
 * 
 * This schema is used to validate the new password form inputs.
 * Fields:
 * - password: Required, 8-100 characters, must include uppercase, lowercase, number, and special character
 * - confirm_password: Must match the password field
 * 
 * @constant {z.ZodObject} newPasswordFormSchema - The Zod schema for new password form validation
 */
export const newPasswordFormSchema = z.object({
    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .max(100, 'Password must be at most 100 characters long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
});