import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, database, ref, get } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.warn("Auth initialization safety timer triggered (3s). Proceeding anyway...");
                setLoading(false);
            }
        }, 3000);

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    // Fetch role from Realtime Database
                    let userRef = ref(database, `users/${user.uid}`);
                    let snapshot = await get(userRef);
                    
                    if (snapshot.exists()) {
                        const userData = snapshot.val();
                        setUserRole(userData.role);
                    } else {
                        // Fallback: search by email for legacy accounts
                        const allUsersRef = ref(database, 'users');
                        const allUsersSnap = await get(allUsersRef);
                        
                        if (allUsersSnap.exists()) {
                            const users = allUsersSnap.val();
                            const foundKey = Object.keys(users).find(key => users[key].email === user.email);
                            if (foundKey) {
                                setUserRole(users[foundKey].role);
                            } else {
                                setUserRole('customer');
                            }
                        } else {
                            setUserRole('customer');
                        }
                    }
                    setCurrentUser(user);
                } else {
                    setCurrentUser(null);
                    setUserRole(null);
                }
            } catch (authError) {
                console.error("Auth Listener Error:", authError);
            } finally {
                clearTimeout(timer);
                setLoading(false);
            }
        });

        return () => {
            clearTimeout(timer);
            unsubscribe();
        };
    }, []);

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        currentUser,
        userRole,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh', 
                    fontFamily: 'Poppins, sans-serif',
                    background: '#f8fafc' 
                }}>
                    <div className="spinner"></div>
                    <span style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: '500', marginTop: '20px' }}>Finalizing Session...</span>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};
