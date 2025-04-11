'use server'

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

const ONE_WEEK = 60 * 60 * 24 * 7;

interface SignUpParams {
    uid: string;
    name: string;
    email: string;
    password: string;
}

interface SignInParams {
    email: string;
    idToken: string;
}

export async function signUp(parmas: SignUpParams){
    const {uid, name, email } = parmas;

    try{
        const userRecord = await db.collection('users').doc(uid).get();

        if(userRecord.exists){
            return {
                success: false,
                message: 'User already exists, Please sign in'
            }
        }

        const user = await db.collection('users').doc(uid).set({
            name,
            email,
        })

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
    }
}

export async function setSession(idToken: string){
    const cookieStore = await cookies();

    const sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn: ONE_WEEK * 1000
    });
    
    cookieStore.set('session', sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: ONE_WEEK,
        path: '/',
        sameSite: 'lax',
    });
}

export async function signIn(parmas: SignInParams){
    const {email, idToken} = parmas;

    try{
        const userRecord = await auth.getUserByEmail(email);

        if(!userRecord){
            return {
                success: false,
                message: 'User not found, Sign up first'
            }
        }

        await setSession(idToken);
        return {
            success: true,
            message: 'Signed in successfully'
        }
    } catch(e){
        console.error("Error signing in", e);
        return {
            success: false,
            message: 'Sign in failed'
        }
    }
}

