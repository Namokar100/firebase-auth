'use server'

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";
import { SignUpFormValues } from "../validations/auth";
import { sendVerificationEmailSMTP } from "../email";
import { generateVerificationToken } from "../token";

const ONE_WEEK = 60 * 60 * 24 * 7;

interface SignUpParams extends Partial<SignUpFormValues> {
    uid: string;
    name: string;
    email: string;
    password?: string; // Optional for Google/OAuth users
    emailVerified?: boolean;
}

interface SignInParams {
    email: string;
    idToken: string;
}

interface User {
    name: string;
    email: string;
    id: string;
    provider?: string; // To track authentication method
    emailVerified?: boolean;
}

// For sending verification emails
export async function sendVerificationEmail(email: string) {
    try {
        const userRecord = await auth.getUserByEmail(email);
        
        if (userRecord.emailVerified) {
            return {
                success: false,
                message: 'Email is already verified, Please log in'
            };
        }

        // Get user's name if available
        let userName = '';
        try {
            const userDoc = await db.collection('users').doc(userRecord.uid).get();
            if (userDoc.exists) {
                userName = userDoc.data()?.name || '';
            }
        } catch (error) {
            console.log('Error getting user name:', error);
        }

        // Generate our custom verification token
        const token = await generateVerificationToken(email);
        
        // Send email via Google SMTP
        const emailResult = await sendVerificationEmailSMTP(email, token, userName);
        
        if (!emailResult.success) {
            throw new Error(emailResult.error || 'Failed to send verification email');
        }
        
        return {
            success: true,
            message: 'Verification email sent. Please check your inbox.',
        };
    } catch (error: any) {
        console.error("Error sending verification email:", error);
        return {
            success: false,
            message: `Failed to send verification email: ${error.message}`
        };
    }
}

export async function signUp(params: SignUpParams) {
    const { uid, name, email } = params;
    const isOAuthUser = !params.password; // If no password, assume OAuth
    const emailVerified = params.emailVerified || false;

    try {
        // Check if user exists in database
        const userRecord = await db.collection('users').doc(uid).get();

        if (userRecord.exists) {
            return {
                success: false,
                message: 'User already exists, Please sign in'
            }
        }

        // Create user record in Firestore
        await db.collection('users').doc(uid).set({
            name,
            email,
            provider: isOAuthUser ? 'google' : 'email', // Track authentication provider
            emailVerified,
            createdAt: new Date(),
        });

        // If not OAuth user (regular email signup), send verification email using our custom method
        if (!isOAuthUser && !emailVerified) {
            try {
                const verificationResult = await sendVerificationEmail(email);
                
                if (!verificationResult.success) {
                    console.error("Failed to send verification email:", verificationResult.message);
                    // Continue anyway so at least the user is created
                }
            } catch (emailError) {
                console.error("Error sending verification email:", emailError);
                // Continue anyway so at least the user is created
            }
        }

        return {
            success: true,
            message: isOAuthUser || emailVerified 
                ? 'User created successfully, please sign in' 
                : 'User created successfully. Please check your email to verify your account.'
        }
        
    } catch (error: any) {
        console.error("Error creating user", error);

        if (error.code === 'auth/email-already-exists') {
            return {
                success: false,
                message: 'User already exists'
            }
        }

        return {
            success: false,
            message: `Failed to create user: ${error.message}`
        }
    }
}

export async function setSession(idToken: string) {
    const cookieStore = await cookies();

    try {
        // Create session cookie that expires in one week
        const sessionCookie = await auth.createSessionCookie(idToken, {
            expiresIn: ONE_WEEK * 1000
        });
        
        // Set the cookie in the browser
        cookieStore.set('session', sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: ONE_WEEK,
            path: '/',
            sameSite: 'lax',
        });

        return true;
    } catch (error) {
        console.error("Error setting session:", error);
        return false;
    }
}

export async function signIn(params: SignInParams) {
    const { email, idToken } = params;

    try {
        // Verify the token first
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Check if we have a user record
        let userRecord;
        try {
            userRecord = await auth.getUser(uid);
        } catch (e) {
            return {
                success: false,
                message: 'User not found. Please sign up first.'
            }
        }

        // For email/password auth, check if email is verified
        const isEmailProvider = 
            decodedToken.firebase.sign_in_provider === 'password';
        
        if (isEmailProvider && !userRecord.emailVerified) {
            return {
                success: false,
                message: 'Please verify your email before signing in.',
                needsVerification: true,
                email: email
            }
        }

        // Set the session cookie
        const sessionSuccess = await setSession(idToken);
        if (!sessionSuccess) {
            return {
                success: false,
                message: 'Failed to create session. Please try again.'
            }
        }

        // Check if we have a database record for this user
        const userDoc = await db.collection('users').doc(uid).get();
        
        // If the user authenticated but doesn't have a DB record (e.g., Google sign-in for the first time)
        if (!userDoc.exists) {
            const provider = decodedToken.firebase.sign_in_provider || 'unknown';
            const isOAuth = provider !== 'password';
            
            // Create a new user record
            await db.collection('users').doc(uid).set({
                name: userRecord.displayName || email.split('@')[0],
                email: email,
                provider: provider.includes('google') ? 'google' : provider,
                emailVerified: isOAuth ? true : userRecord.emailVerified,
                createdAt: new Date(),
            });
        } else {
            // Update email verification status in DB if needed
            if (isEmailProvider && userRecord.emailVerified !== userDoc.data()?.emailVerified) {
                await db.collection('users').doc(uid).update({
                    emailVerified: userRecord.emailVerified
                });
            }
        }

        return {
            success: true,
            message: 'Signed in successfully'
        }
    } catch (error: any) {
        console.error("Error signing in", error);
        return {
            success: false,
            message: `Sign in failed: ${error.message}`
        }
    }
}

export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
        return null;
    }
    
    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        const userRecord = await db.collection('users').doc(decodedClaims.uid).get();

        if (!userRecord.exists) {
            return null;
        }

        return {
            ...userRecord.data(),
            id: userRecord.id,
        } as User;
    } catch (e) {
        console.error("Error getting current user", e);
        return null;
    }
}

export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser();
    return !!user;
}

export async function logout() {
    const cookieStore = await cookies();
    
    // Clear the session cookie by setting it to an empty string and expiring it
    cookieStore.set('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0), // Set expiration to epoch time (effectively deleting it)
        path: '/',
        sameSite: 'lax',
    });

    return {
        success: true,
        message: 'Logged out successfully'
    };
}

// For sending password reset emails
export async function sendPasswordResetEmail(email: string) {
    try {
        // Check if user exists
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
        } catch (error) {
            // Don't reveal if email exists or not for security reasons
            return {
                success: true,
                message: 'If your email is registered, you will receive a password reset link.'
            };
        }
        
        // Get user's name if available
        let userName = '';
        try {
            const userDoc = await db.collection('users').doc(userRecord.uid).get();
            if (userDoc.exists) {
                userName = userDoc.data()?.name || '';
            }
        } catch (error) {
            console.log('Error getting user name:', error);
        }

        // Generate a password reset token (similar to verification token)
        const token = await generateVerificationToken(email);
        
        // Store the token in the database with expiration
        await db.collection('passwordResetTokens').add({
            email,
            token,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 3600000), // 1 hour expiration
            used: false
        });
        
        // Create reset password link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/reset-password?token=${token}`;
        
        // Custom email subject and content
        const subject = 'Reset Your Password';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #333; text-align: center;">Password Reset</h2>
                <p>Hello ${userName || email},</p>
                <p>We received a request to reset your password. Please click the button below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${resetLink}</p>
                <p>If you didn't request a password reset, you can safely ignore this email.</p>
                <p>This link will expire in 1 hour.</p>
                <p>Thanks,<br/>Firebase Auth App Team</p>
            </div>
        `;
        
        // Send the email with custom subject and content
        const emailResult = await sendVerificationEmailSMTP(
            email, 
            token, 
            userName,
            subject,
            html
        );
        
        if (!emailResult.success) {
            throw new Error(emailResult.error || 'Failed to send password reset email');
        }
        
        return {
            success: true,
            message: 'If your email is registered, you will receive a password reset link.'
        };
    } catch (error: any) {
        console.error("Error sending password reset email:", error);
        return {
            success: false,
            message: `Failed to send password reset email: ${error.message}`
        };
    }
}

// Function to reset password with token
export async function resetPassword(token: string, newPassword: string) {
    try {
        // First, query by token only (which can use a simple single-field index)
        const tokenQuerySnapshot = await db
            .collection('passwordResetTokens')
            .where('token', '==', token)
            .get();
        
        if (tokenQuerySnapshot.empty) {
            return {
                success: false,
                message: 'Invalid or expired token. Please request a new password reset link.'
            };
        }
        
        // Filter the results in-memory to find a non-used token that hasn't expired
        const now = new Date();
        const validTokenDocs = tokenQuerySnapshot.docs.filter(doc => {
            const data = doc.data();
            
            // Handle Firestore Timestamp objects safely
            const expiresAt = data.expiresAt && typeof data.expiresAt.toDate === 'function' 
                ? data.expiresAt.toDate() 
                : new Date(data.expiresAt);
                
            return !data.used && expiresAt > now;
        });
        
        if (validTokenDocs.length === 0) {
            return {
                success: false,
                message: 'This reset link has expired or already been used. Please request a new one.'
            };
        }
        
        // Get the first valid token document
        const tokenDoc = validTokenDocs[0];
        const tokenData = tokenDoc.data();
        
        // Find the user by email
        const email = tokenData.email;
        try {
            const userRecord = await auth.getUserByEmail(email);
            
            // Update the user's password
            await auth.updateUser(userRecord.uid, {
                password: newPassword
            });
            
            // Mark the token as used
            await tokenDoc.ref.update({
                used: true,
                usedAt: new Date()
            });
            
            return {
                success: true,
                message: 'Password has been successfully reset. Please log in with your new password.'
            };
        } catch (userError) {
            console.error("Error finding user or updating password:", userError);
            return {
                success: false,
                message: 'Failed to reset password. User may no longer exist.'
            };
        }
    } catch (error: any) {
        console.error("Error resetting password:", error);
        return {
            success: false,
            message: `Failed to reset password: ${error.message}`
        };
    }
}


