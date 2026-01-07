import { RegisterForm } from "@/components/auth/register-form";

const RegisterPage = () => {
  return (
    <div className="h-full flex items-center justify-center bg-[url('/grid.svg')] relative bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background/10 z-0 pointer-events-none" />
      <div className="z-10">
        <RegisterForm />
      </div>
    </div>
  );
}

export default RegisterPage;