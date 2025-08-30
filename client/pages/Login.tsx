import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { AdsRail } from "@/components/layout/AdsRail";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  agree: z.literal(true, { errorMap: () => ({ message: "You must agree" }) }),
});

type Values = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "", agree: false as any } });

  const onSubmit = async (_values: Values) => {
    // Auth backend to be implemented later in the plan
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <FormField name="email" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="password" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="agree" control={form.control} render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-2">
                    <Checkbox checked={field.value as unknown as boolean} onCheckedChange={field.onChange} id="agree" />
                    <label htmlFor="agree" className="text-sm text-muted-foreground">
                      I agree to the <Link to="/privacy" className="underline">Privacy Policy</Link> and <Link to="/terms" className="underline">Terms & Conditions</Link>.
                    </label>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full">Login</Button>
            </form>
          </Form>
          <p className="mt-4 text-sm">No account? <Link to="/signup" className="underline">Sign up</Link></p>
        </div>
      </div>
      <AdsRail position="right" />
    </div>
  );
}
