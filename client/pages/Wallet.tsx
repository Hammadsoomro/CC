import AppShell from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function Wallet() {
  return (
    <AppShell>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">Current Balance</div>
            <div className="text-3xl font-bold">$0.00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Add Funds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input id="amount" type="number" min={1} step="0.01" placeholder="25.00" />
              </div>
              <div>
                <Label htmlFor="card">Card</Label>
                <Input id="card" placeholder="Visa / MasterCard" />
              </div>
              <Button className="w-full">Deposit</Button>
              <div className="text-xs text-muted-foreground">Sub-accounts cannot deposit funds.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
