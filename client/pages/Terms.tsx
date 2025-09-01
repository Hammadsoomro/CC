import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={() => history.back()} className="text-sm underline">Back</button>
      <h1 className="mt-2 text-3xl font-bold">Terms & Conditions</h1>
      <p className="mt-4 text-muted-foreground">Please review these terms governing the use of the application.</p>
      <ul className="mt-6 list-disc pl-6 space-y-2 text-sm text-muted-foreground">
        <li>Users must maintain sufficient wallet balance to send SMS or purchase numbers.</li>
        <li>Sub-accounts are restricted per plan and inherit main account policies.</li>
        <li>Abuse or unlawful usage will result in account suspension.</li>
      </ul>
    </div>
  );
}
