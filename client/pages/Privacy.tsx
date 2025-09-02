export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto p-6 prose prose-sm dark:prose-invert">
      <button onClick={() => history.back()} className="no-underline text-sm underline">Back</button>
      <h1 className="mt-2 text-3xl font-bold">Privacy Policy</h1>
      <p>
        This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our
        messaging platform and related services. By accessing or using the Service, you consent to the practices
        described here.
      </p>
      <h2>Information We Collect</h2>
      <ul>
        <li>Account data such as name, email, phone number, and authentication details.</li>
        <li>Usage data including sent/received messages, numbers owned, IP address, device and browser metadata.</li>
        <li>Payment data processed by our payment providers; we do not store full card numbers or CVV.</li>
      </ul>
      <h2>How We Use Information</h2>
      <ul>
        <li>To provide the Service, including routing and delivering SMS and maintaining conversation history.</li>
        <li>To prevent abuse, detect fraud, and ensure platform integrity.</li>
        <li>To provide customer support and improve features and reliability.</li>
      </ul>
      <h2>Data Sharing</h2>
      <p>
        We share data with infrastructure and communications providers solely to operate the Service (e.g., telephony
        carriers and payment processors). We do not sell personal information.
      </p>
      <h2>Data Retention</h2>
      <p>
        We retain records for as long as needed to provide the Service and meet legal obligations. You may request
        deletion of your account and associated data subject to regulatory requirements.
      </p>
      <h2>Your Rights</h2>
      <ul>
        <li>Access, correction, and deletion of personal data where applicable.</li>
        <li>Portability and objection to certain processing, subject to law.</li>
      </ul>
      <h2>Security</h2>
      <p>
        We implement administrative, technical, and physical safeguards appropriate to the sensitivity of the data.
        No method of transmission or storage is 100% secure; we continuously improve our controls.
      </p>
      <h2>Contact</h2>
      <p>
        For privacy inquiries or data requests, contact support via the Help section. We will respond within a
        reasonable timeframe.
      </p>
      <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
    </div>
  );
}
