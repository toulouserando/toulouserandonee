'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth | null): void {
  // Sécurité : Si l'instance est absente, on ne fait rien
  if (!authInstance) return;

  signInAnonymously(authInstance).catch(err => console.error("Login Error:", err));
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth | null, email: string, password: string): void {
  if (!authInstance) return;

  createUserWithEmailAndPassword(authInstance, email, password).catch(err => console.error("Signup Error:", err));
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth | null, email: string, password: string): void {
  if (!authInstance) return;

  signInWithEmailAndPassword(authInstance, email, password).catch(err => console.error("SignIn Error:", err));
}