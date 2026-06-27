import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import foodImg from "@/assets/food.jpg";
import logoImg from "@/assets/mbs-logo.png";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Registration successful! Please login with demo credentials.");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-4xl overflow-hidden shadow-xl">
        <div className="grid md:grid-cols-2">
          <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-8">
            <img src={logoImg} alt="MBS Logo" className="mb-4 h-16 w-auto" />
            <img src={foodImg} alt="Food Quality" className="w-full max-w-xs rounded-xl object-cover shadow-lg" width={640} height={640} />
          </div>
          <CardContent className="flex flex-col justify-center p-8">
            <h1 className="mb-1 font-display text-2xl font-bold text-foreground">Register</h1>
            <p className="mb-6 text-sm text-muted-foreground">Create your FQTS account</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Create password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">Create Account</Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default Register;
