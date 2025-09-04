import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label as UILabel } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { AdsRail } from "@/components/layout/AdsRail";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { api } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  agree: z.literal(true, { errorMap: () => ({ message: "You must agree" }) }),
});

type Values = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", agree: false as any },
  });
  const reqForm = useForm<{
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
  }>({ defaultValues: { email: "", phone: "", firstName: "", lastName: "" } });
  const [open, setOpen] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);

  const onSubmit = async (values: Values) => {
    const data = await api<{ token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: values.email, password: values.password }),
    });
    if (data?.token) localStorage.setItem("jwt", data.token);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-stretch">
      <AdsRail position="left" />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back</p>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-6 space-y-4"
            >
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="agree"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={field.value as unknown as boolean}
                        onCheckedChange={field.onChange}
                        id="agree"
                      />
                      <label
                        htmlFor="agree"
                        className="text-sm text-muted-foreground"
                      >
                        I agree to the{" "}
                        <Link to="/privacy" className="underline">
                          Privacy Policy
                        </Link>{" "}
                        and{" "}
                        <Link to="/terms" className="underline">
                          Terms & Conditions
                        </Link>
                        .
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-sm flex items-center justify-between">
            <span>
              No account?{" "}
              <Link to="/signup" className="underline">
                Sign up
              </Link>
            </span>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button className="underline text-primary">
                  Request password change
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Verify your details</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={reqForm.handleSubmit(async (vals) => {
                    setReqError(null);
                    try {
                      await api("/api/password-requests", {
                        method: "POST",
                        body: JSON.stringify(vals),
                      });
                      setOpen(false);
                      reqForm.reset();
                      alert(
                        "Request submitted. Admin will review and update your password.",
                      );
                    } catch (e: any) {
                      setReqError(String(e?.message || e));
                    }
                  })}
                  className="space-y-3"
                >
                  {reqError && (
                    <div className="text-sm text-red-600">{reqError}</div>
                  )}
                  <div>
                    <UILabel>Email</UILabel>
                    <Input
                      type="email"
                      {...reqForm.register("email", { required: true })}
                    />
                  </div>
                  <div>
                    <UILabel>Phone</UILabel>
                    <Input {...reqForm.register("phone", { required: true })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <UILabel>First name</UILabel>
                      <Input {...reqForm.register("firstName")} />
                    </div>
                    <div>
                      <UILabel>Last name</UILabel>
                      <Input {...reqForm.register("lastName")} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Submit Request
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      <AdsRail position="right" />
    </div>
  );
}
