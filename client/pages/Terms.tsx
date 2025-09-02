export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto p-6 prose prose-sm dark:prose-invert">
      <button onClick={() => history.back()} className="no-underline text-sm underline">Back</button>
      <h1 className="mt-2 text-3xl font-bold">Terms & Conditions</h1>
      <p>
        These Terms govern your access to and use of the Service. By creating an account or using the platform you
        agree to these Terms. If you do not agree, do not use the Service.
      </p>
      <h2>Accounts and Responsibilities</h2>
      <ul>
        <li>You are responsible for all activity under your account and sub-accounts.</li>
        <li>Maintain accurate information and safeguard credentials.</li>
        <li>Comply with applicable laws and messaging regulations in all jurisdictions.</li>
      </ul>
      <h2>Billing and Plans</h2>
      <ul>
        <li>Prepaid wallet usage; charges apply for plans, numbers, and per-message fees as listed in Pricing.</li>
        <li>We may adjust pricing with prior notice; continued use after changes constitutes acceptance.</li>
        <li>Plan limits (e.g., sub-accounts) apply based on your current plan tier.</li>
      </ul>
      <h2>Acceptable Use</h2>
      <ul>
        <li>No spam, unlawful content, harassment, or prohibited industries per carrier rules.</li>
        <li>No attempts to disrupt, reverse engineer, or overload the Service.</li>
        <li>We may suspend or terminate accounts for violations.</li>
      </ul>
      <h2>Numbers and Messaging</h2>
      <ul>
        <li>Numbers are provisioned from providers; availability and features vary by region.</li>
        <li>You must obtain consent from recipients where required and honor opt-out requests.</li>
        <li>We are not liable for carrier delays, delivery failures, or content transmitted.</li>
      </ul>
      <h2>Disclaimers and Liability</h2>
      <p>
        The Service is provided “as is” without warranty. To the maximum extent permitted by law, our liability is
        limited to fees paid in the last 12 months. Some jurisdictions do not allow limitations; rights may vary.
      </p>
      <h2>Changes</h2>
      <p>
        We may update these Terms. Material changes will be communicated; continued use after updates indicates
        acceptance.
      </p>
      <h2>Contact</h2>
      <p>
        Questions? Contact support via the Help section.
      </p>
      <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
    </div>
  );
}
