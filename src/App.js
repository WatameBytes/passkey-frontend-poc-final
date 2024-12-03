import WebAuthnRegistration from './WebAuthnRegistration.js';
import WebAuthnAuthentication from './WebAuthnAuthentication.js';

function App() {
  return (
    <div className="space-y-8">
      <WebAuthnRegistration />
      <WebAuthnAuthentication />
    </div>
  );
}

export default App;
