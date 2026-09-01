import { useState } from 'react';
import type { FormEvent } from 'react';
import { signIn, signOut } from '../auth';
import { supabase, } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import styles from '../styles/AuthForm.module.css';

interface AuthFormProps {
    isOpen: boolean;
    onClose: () => void;
    session: Session | null;
}

export function AuthForm({ isOpen, onClose, session }: AuthFormProps){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>){
        event.preventDefault();
        setLoading(true);
        setError(null);

        const result = isSignUp
            ? await supabase.auth.signUp({ email, password,
                options: {
                    data: {
                        display_name: displayName.trim()
                    }
                },
             })
            : await signIn(email, password);

        if (result.error){
            setError(result.error.message);
        } else {
            // Close modal on successful login/signup
            onClose();
        }
        setLoading(false);
    }
    async function handleSignOut(){
        const { error: signOutError } = await signOut();

        if (signOutError){
            setError(signOutError.message);
        }
    }
    return isOpen ? (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                    ✕
                </button>
                <div className={styles.modalContent}>
                    <h2 className={styles.modalTitle}>
                        {isSignUp ? 'Create Account' : 'Sign In'}
                    </h2>

                    {error && <div className={styles.error}>{error}</div>}

                    <form className={styles.form} onSubmit={handleSubmit}>
                        {isSignUp && (
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="Display name"
                                value={displayName}
                                onChange={(event) => setDisplayName(event.target.value)}
                                maxLength={40}
                                required
                            />
                        )}
                        <input
                            className={styles.input}
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                        <input
                            className={styles.input}
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            minLength={6}
                            required
                        />
                        <button className={styles.submitButton} type="submit" disabled={loading}>
                            {loading
                                ? 'Please Wait...'
                                : isSignUp
                                    ? 'Create Account'
                                    : 'Sign In'
                            }
                        </button>
                    </form>

                    <button
                        className={styles.toggleButton}
                        type="button"
                        onClick={() => setIsSignUp((current) => !current)}
                    >
                        {isSignUp
                            ? 'Already have an account? Sign In'
                            : 'Create an account? Sign Up'
                        }
                    </button>

                    {isSignUp && (
                        <p className={styles.confirmationMessage}>Check your email if Supabase email confirmation is sent</p>
                    )}
                    {session && (
                        <button className={styles.signOutButton} type="button" onClick={handleSignOut}>
                            Sign out
                        </button>
                    )}
                </div>
            </div>
        </div>
    ) : null;
}