import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BuyNumbers() {
  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Buy New Number</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">US $2.50/month, Canada $2.50/month. Only main accounts can buy numbers.</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States ($2.50/mo)</SelectItem>
                  <SelectItem value="ca">Canada ($2.50/mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>Search Available</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
