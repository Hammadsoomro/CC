import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdsRail } from "@/components/layout/AdsRail";

export default function Dashboard() {
  return (
    <div className="p-6">
      <div className="flex items-start gap-4">
        <AdsRail position="left" />
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Wallet Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0.00</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Owned Numbers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Total Sent SMS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">No activity yet</div>
              </CardContent>
            </Card>
          </div>
          <div
            className="w-full h-32 rounded-md border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground"
            aria-label="dashboard ad"
            data-ads-banner
          >
            Ad Banner
          </div>
        </div>
        <AdsRail position="right" />
      </div>
    </div>
  );
}
