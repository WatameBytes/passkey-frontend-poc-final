import React, { useState } from 'react';
import * as webauthnJson from "@github/webauthn-json";

export default function WebAuthnRegistration() {
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [registrationId, setRegistrationId] = useState(''); // State to store registrationId

    const startRegistration = async () => {
        try {
            setStatus('Starting registration...');
            setError('');
    
            // Step 1: Fetch registration options from the server
            const { credentialCreateOptions, registrationId } = await fetchCredentialCreateOptions();
    
            setStatus('Creating credentials...');
    
            // Step 2: Perform the WebAuthn ceremony
            const publicKeyCredential = await performWebAuthnCeremony(credentialCreateOptions);
    
            setStatus('Finishing registration...');
    
            // Step 3: Send the created credential and registrationId to the server to complete registration
            await finishRegistration(publicKeyCredential, registrationId);
    
            setStatus('Registration completed successfully!');
        } catch (err) {
            setError(err.message);
            setStatus('Registration failed');
        }
    };

    const fetchCredentialCreateOptions = async () => {
        const response = await fetch('http://localhost:8080/registration/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                publicGuid: 'guidguid1111'
            })
        });
    
        if (!response.ok) {
            throw new Error('Failed to fetch credential creation options');
        }
    
        // Parse the JSON response
        const startResponse = await response.json();
    
        console.log("Start Response:", startResponse);
    
        // Extract and parse the `publicKeyCredentialCreationOptions` and `registrationId`
        if (!startResponse.publicKeyCredentialCreationOptions || !startResponse.registrationId) {
            throw new Error('Missing keys: publicKeyCredentialCreationOptions or registrationId');
        }
    
        const credentialCreateOptions = JSON.parse(startResponse.publicKeyCredentialCreationOptions);
        setRegistrationId(startResponse.registrationId); // Save registrationId to state
    
        return {
            credentialCreateOptions,
            registrationId: startResponse.registrationId
        };
    };

    const performWebAuthnCeremony = async (credentialCreateOptions) => {
        try {
                        
            const credential = await webauthnJson.create(credentialCreateOptions);
            return credential;
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
    
        const result = await response.json();
    
        if (!response.ok) {
            throw new Error(result.message || 'Failed to complete registration');
        }
    
        setStatus(result.message); // Display success message
    };

    return (
        <div className="p-6 max-w-lg mx-auto">
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">WebAuthn Registration</h1>
                
                <button
                    onClick={startRegistration}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Register Passkey
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
