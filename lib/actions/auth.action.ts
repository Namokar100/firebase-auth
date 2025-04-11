'use server'

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

const ONE_WEEK = 60 * 60 * 24 * 7;

interface SignUpParams {
    uid: string;
    name: string;
    email: string;
    password: string; // Optional for Google/OAuth users
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
}

export async function signUp(params: SignUpParams){
    const {uid, name, email } = params;
    const isOAuthUser = !params.password; // If no password, assume OAuth

    try{
        // Check if user exists in database
        const userRecord = await db.collection('users').doc(uid).get();

        if(userRecord.exists){
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
            createdAt: new Date(),
        });

        return {
            success: true,
            message: 'User created successfully, please sign in'
        }
        
    } catch (error: any) {
        console.error("Error creating user", error);

        if(error.code === 'auth/email-already-exists'){
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

export async function setSession(idToken: string){
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

export async function signIn(params: SignInParams){
    const {email, idToken} = params;

    try{
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
            
            // Create a new user record
            await db.collection('users').doc(uid).set({
                name: userRecord.displayName || email.split('@')[0],
                email: email,
                provider: provider.includes('google') ? 'google' : provider,
                createdAt: new Date(),
            });
        }

        return {
            success: true,
            message: 'Signed in successfully'
        }
    } catch(error: any){
        console.error("Error signing in", error);
        return {
            success: false,
            message: `Sign in failed: ${error.message}`
        }
    }
}

export async function getCurrentUser(): Promise<User | null>{
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if(!sessionCookie){
        return null;
    }
    
    try{
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        const userRecord = await db.collection('users').doc(decodedClaims.uid).get();

        if(!userRecord.exists){
            return null;
        }

        return {
            ...userRecord.data(),
            id: userRecord.id,
        } as User;
    } catch(e) {
        console.error("Error getting current user", e);
        return null;
    }
}

export async function isAuthenticated(): Promise<boolean>{
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


