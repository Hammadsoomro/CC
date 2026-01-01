import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, UserPlus, X, Phone } from "lucide-react";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhoneNumber {
  _id: string;
  phoneNumber: string;
  country: string;
  assignedToUserId?: string;
  assignedToUserName?: string;
}

interface TeamMember {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export default function ActiveNumbers() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(
    null,
  );
  const [selectedMemberId, setSelectedMemberId] = useState("");

  useEffect(() => {
    loadNumbers();
    loadTeamMembers();
  }, []);

  const loadNumbers = async () => {
    try {
      setLoading(true);
      const data = await api<{ numbers: PhoneNumber[] }>("/api/admin/numbers");
      setNumbers(data.numbers || []);
    } catch (e) {
      toast.error("Failed to load numbers");
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const data = await api<{ users: TeamMember[] }>("/api/sub-accounts");
      setTeamMembers(data.users || []);
    } catch (e) {
      console.error("Failed to load team members:", e);
    }
  };

  const assignNumber = async () => {
    if (!selectedNumber || !selectedMemberId) {
      toast.error("Select a number and team member");
      return;
    }

    try {
      await api("/api/numbers/assign", {
        method: "POST",
        body: JSON.stringify({
          numberId: selectedNumber._id,
          subUserId: selectedMemberId,
        }),
      });

      setSelectedNumber(null);
      setSelectedMemberId("");
      loadNumbers();
      toast.success("Number assigned successfully");
    } catch (e) {
      toast.error("Failed to assign number");
    }
  };

  const unassignNumber = async (numberId: string) => {
    try {
      await api("/api/numbers/unassign", {
        method: "POST",
        body: JSON.stringify({ numberId }),
      });

      loadNumbers();
      toast.success("Number unassigned");
    } catch (e) {
      toast.error("Failed to unassign number");
    }
  };

  const getMemberName = (memberId: string) => {
    const member = teamMembers.find((m) => m._id === memberId);
    if (!member) return "Unknown";
    return member.firstName && member.lastName
      ? `${member.firstName} ${member.lastName}`
      : member.email;
  };

  const unassignedNumbers = numbers.filter((n) => !n.assignedToUserId);
  const assignedNumbers = numbers.filter((n) => n.assignedToUserId);

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Active Numbers</h1>
        <p className="text-muted-foreground mt-2">
          Manage your purchased phone numbers and assign them to team members
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Available Numbers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {unassignedNumbers.length}
              </div>
              <p className="text-sm text-muted-foreground">Ready to assign</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Assigned Numbers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{assignedNumbers.length}</div>
              <p className="text-sm text-muted-foreground">
                Assigned to team members
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        {unassignedNumbers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Available Numbers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unassignedNumbers.map((number) => (
                  <div
                    key={number._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold">{number.phoneNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {number.country}
                      </p>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => setSelectedNumber(number)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign {number.phoneNumber}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="member">Team Member</Label>
                            <Select
                              value={selectedMemberId}
                              onValueChange={setSelectedMemberId}
                            >
                              <SelectTrigger id="member">
                                <SelectValue placeholder="Select a team member" />
                              </SelectTrigger>
                              <SelectContent>
                                {teamMembers.map((member) => (
                                  <SelectItem
                                    key={member._id}
                                    value={member._id}
                                  >
                                    {member.firstName && member.lastName
                                      ? `${member.firstName} ${member.lastName}`
                                      : member.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {teamMembers.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              No team members yet. Create team members first.
                            </p>
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedNumber(null);
                              setSelectedMemberId("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button onClick={assignNumber}>Assign Number</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {assignedNumbers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Numbers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignedNumbers.map((number) => (
                  <div
                    key={number._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold">{number.phoneNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Assigned to:{" "}
                        <span className="font-medium">
                          {getMemberName(number.assignedToUserId || "")}
                        </span>
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => unassignNumber(number._id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {numbers.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Phone className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No numbers purchased yet</p>
              <p className="text-sm text-muted-foreground">
                Go to "Buy Numbers" to purchase your first number
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
