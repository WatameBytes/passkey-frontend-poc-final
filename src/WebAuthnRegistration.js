import React, { useState, useEffect } from 'react';
import * as webauthnJson from "@github/webauthn-json";

// Replace this with a proper import or fetch for your identity list
import identities from './identity.json';

export default function WebAuthnRegistration() {
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [registrationId, setRegistrationId] = useState('');
    const [selectedIdentity, setSelectedIdentity] = useState(() => {
        return JSON.parse(localStorage.getItem('selectedIdentity')) || null;
    });

    useEffect(() => {
        localStorage.setItem('selectedIdentity', JSON.stringify(selectedIdentity));
    }, [selectedIdentity]);

    const startRegistration = async () => {
        if (!selectedIdentity) {
            setError('Please select an identity before registering.');
            return;
        }
        try {
            setStatus('Starting registration...');
            setError('');
    
            const { credentialCreateOptions, registrationId } = await fetchCredentialCreateOptions(selectedIdentity.public_guid);
    
            setStatus('Creating credentials...');
    
            const publicKeyCredential = await performWebAuthnCeremony(credentialCreateOptions);
    
            setStatus('Finishing registration...');
    
            await finishRegistration(publicKeyCredential, registrationId);
    
            setStatus('Registration completed successfully!');
        } catch (err) {
            setError(err.message);
            setStatus('Registration failed');
        }
    };

    const fetchCredentialCreateOptions = async (publicGuid) => {
        const response = await fetch('http://localhost:8080/registration/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ publicGuid })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch credential creation options');
        }

        const startResponse = await response.json();
        if (!startResponse.publicKeyCredentialCreationOptions || !startResponse.registrationId) {
            throw new Error('Missing keys: publicKeyCredentialCreationOptions or registrationId');
        }

        const credentialCreateOptions = JSON.parse(startResponse.publicKeyCredentialCreationOptions);
        setRegistrationId(startResponse.registrationId);

        return { credentialCreateOptions, registrationId: startResponse.registrationId };
    };

    const performWebAuthnCeremony = async (credentialCreateOptions) => {
        try {
            return await webauthnJson.create(credentialCreateOptions);
        } catch (err) {
            throw new Error(`WebAuthn ceremony failed: ${err.message}`);
        }
    };

    const finishRegistration = async (publicKeyCredential, registrationId) => {
        const payload = {
            registrationId,
            publicKeyCredentialString: JSON.stringify(publicKeyCredential)
        };

        const response = await fetch('http://localhost:8080/registration/finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to complete registration');
        }

        setStatus(result.message);
    };

    const handleLogout = () => {
        setSelectedIdentity(null);
        setStatus('');
        setError('');
    };

    return (
        <div className="p-6 max-w-lg mx-auto">
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">WebAuthn Registration</h1>

                <select
                    value={selectedIdentity?.public_guid || ''}
                    onChange={(e) => {
                        const guid = e.target.value;
                        const identity = identities.find(id => id.public_guid === guid);
                        setSelectedIdentity(identity || null);
                    }}
                    className="w-full border px-3 py-2 rounded-md"
                >
                    <option value="">Select an identity</option>
                    {identities.map((identity) => (
                        <option key={identity.public_guid} value={identity.public_guid}>
                            {identity.username}
                        </option>
                    ))}
                </select>

                <button
                    onClick={startRegistration}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Register Passkey
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 mt-4"
                >
                    Log Out
                </button>

                {status && (
                    <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md">
                        {status}
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                        Error: {error}
                    </div>
                )}
            </div>
        </div>
    );
}
