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

export async function signOut() {
    const cookieStore = await cookies();
    
    // Clear the session cookie
    cookieStore.delete('session');
    
    return {
        success: true,
        message: 'Signed out successfully'
    };
}


