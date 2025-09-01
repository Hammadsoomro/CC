import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={() => history.back()} className="text-sm underline">Back</button>
      <h1 className="mt-2 text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-muted-foreground">Your privacy is important. This page describes how data is handled in the application.</p>
      <ul className="mt-6 list-disc pl-6 space-y-2 text-sm text-muted-foreground">
        <li>We only store necessary account and usage data to operate the service.</li>
        <li>SMS content is processed to deliver messages and provide conversation history.</li>
        <li>You can request data export or deletion by contacting support.</li>
      </ul>
    </div>
  );
}
