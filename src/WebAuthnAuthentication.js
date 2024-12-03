import React, { useState } from 'react';
import * as webauthnJson from "@github/webauthn-json";

export default function WebAuthnAuthentication() {
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [assertionId, setAssertionId] = useState('');

    const startAuthentication = async () => {
        try {
            setStatus('Starting authentication...');
            setError('');

            // Step 1: Fetch assertion options from the server
            const { credentialRequestOptions, assertionId } = await fetchCredentialRequestOptions();
            console.log("Fetched credentialRequestOptions:", credentialRequestOptions);
            console.log("Fetched assertionId:", assertionId);
            
            setStatus('Performing WebAuthn ceremony...');

            // Step 2: Perform the WebAuthn ceremony
            const publicKeyCredential = await performWebAuthnCeremony(credentialRequestOptions);

            setStatus('Sending response to server...');

            // Step 3: Send the result back to the server to complete authentication
            await finishAuthentication(publicKeyCredential, assertionId);

            setStatus('Authentication completed successfully!');
        } catch (err) {
            setError(err.message);
            setStatus('Authentication failed');
        }
    };

    const fetchCredentialRequestOptions = async () => {
        const response = await fetch('http://localhost:8080/authenticate/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });
    
        if (!response.ok) {
            throw new Error('Failed to fetch credential request options');
        }
    
        const startResponse = await response.json();
    
        console.log("Start Response:", startResponse);
    
        if (!startResponse.credentialJson || !startResponse.assertionId) {
            throw new Error('Missing keys: credentialJson or assertionId');
        }
    
        const credentialRequestOptions = JSON.parse(startResponse.credentialJson);
        setAssertionId(startResponse.assertionId);
    
        return {
            credentialRequestOptions,
            assertionId: startResponse.assertionId,
        };
    };
    

    const performWebAuthnCeremony = async (credentialRequestOptions) => {
        try {
            const credential = await webauthnJson.get(credentialRequestOptions);
            return credential;
        } catch (err) {
            throw new Error(`WebAuthn ceremony failed: ${err.message}`);
        }
    };

    const finishAuthentication = async (publicKeyCredential, assertionId) => {
        const payload = {
            assertionId,
            publicKeyCredentialJson: JSON.stringify(publicKeyCredential), // Serialized client response
        };
    
        console.log("Finish Payload:", payload);
    
        const response = await fetch('http://localhost:8080/authenticate/finish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
    
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Failed to complete authentication');
        }
    
        const result = await response.json();
        setStatus(result.message || 'Authentication completed successfully!');
    };
    

    return (
        <div className="p-6 max-w-lg mx-auto">
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">WebAuthn Authentication</h1>

                <button
                    onClick={startAuthentication}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    Authenticate Passkey
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
