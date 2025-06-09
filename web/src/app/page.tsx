'use client';
import { useState, useEffect } from 'react';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    User,
} from 'firebase/auth';
import {auth} from '../lib/firebase/config';
import ActivityForm from '../components/ActivityForm';
import ActivityList from '../components/ActivityList';
import TipsDisplay from '../components/TipsDisplay';

export default function HomePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [showTips, setShowTips] = useState(false);


    const handleSignIn = async () => {
        const provider = new GoogleAuthProvider();

        try {
            await signInWithPopup(auth, provider);
            console.log('Sign in succesfull.')
            setShowTips(false);
        } catch (error) {
            console.error(`Error signing in with Google ${error}`);
            alert('Innlogging med Google mislyktes. Vennligst prøv igjen.')
        }
    };

  const handleSignOut = async () => {
        try {
            await signOut(auth);
            console.log('Sign out successful');
            setShowTips(false);
        } catch (error) {
            console.error('Error signing out:', error);
            alert('Utlogging med Google feilet. Vennligst prøv igjen');
        }
    };

    useEffect( () => {

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
            if (!currentUser) {
                setShowTips(false)
            }
            console.log(`Auth state changed for user ${currentUser?.email}`)
        });
        
        return () => unsubscribe();
    }, 
    [] ); 

    if (loadingAuth) {
        return <p className="p-4">Laster...</p>;
        // TODO: Lag en bedre loading indikator
    }

    return (
    <main className="p-4">
        <h1 className="text-xl font-bold mb-4">Karbonkalkulator</h1>

        {user ? (
            <>
            {/*bruker innlogget*/}

                <div>
                    <p className="mb-2">Velkommen.</p>
                    <button
                        onClick={handleSignOut}
                        className="bg-red-500 hover:bg-red-700 mb-2 text-white font-bold py-2 px-4 rounded"
                    >
                        Logg ut
                    </button>
                </div>

                <div className="mb-6 p-4 border border-gray-300 rounded">
                    <h2 className="text-lg font-semibold mb-2">Loggfør Aktivitet</h2>
                    <ActivityForm />
                </div>


                <div className="mb-6 p-4 border border-gray-300 rounded">
                    <h2 className="text-lg font-semibold mb-2">Din Historikk</h2>
                    <ActivityList />
                </div>


                <div className="mt-6 mb-6 p-4 border border-gray-300 rounded">
                    <h2 className="text-lg font-semibold mb-2">Tips for Lavere Utslipp</h2>
                    {!showTips && (
                    <button
                        onClick={() => setShowTips(true)}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Vis Tips
                    </button>
                    )}

                    {showTips && (
                    <div>
                        <TipsDisplay />
                        {/* TODO: Mulighet for å skjule tips igjen? */}
                    </div>
                    )}
                </div>
            </>

        ) : (
            // Bruker utlogget

            <div>
                <p className="mb-2">Vennligst logg inn for å bruke kalkulatoren.</p>
                <button
                    onClick={handleSignIn}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Logg inn med Google
                </button>
            </div>
        )}

    </main>
  );
}




