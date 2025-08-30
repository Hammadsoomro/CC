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
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  agree: z.literal(true, { errorMap: () => ({ message: "You must agree" }) }),
}).refine((d) => d.password === d.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords must match",
});

type Values = z.infer<typeof schema>;

export default function Signup() {
  const navigate = useNavigate();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "", agree: false as any } });

  const onSubmit = async (_values: Values) => {
    // Registration backend to be implemented later in the plan
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-stretch">
      <AdsRail position="left" />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField name="firstName" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="lastName" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField name="email" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="phone" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField name="password" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="confirmPassword" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
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
              <Button type="submit" className="w-full">Create account</Button>
            </form>
          </Form>
          <p className="mt-4 text-sm">Already have an account? <Link to="/login" className="underline">Login</Link></p>
        </div>
      </div>
      <AdsRail position="right" />
    </div>
  );
}
