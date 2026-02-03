import { Cat, Home } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="relative">
      <div className="absolute top-4 left-4">
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary-foreground hover:text-primary transition duration-200"
        >
          <Link to="/" className="flex items-center w-full gap-2">
            <Home className="size-4" />
            <p>Trang chủ</p>
          </Link>
        </Button>
      </div>
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a
            href="#"
            className="flex items-center gap-2 self-center font-medium"
          >
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
              <Cat className="size-6" />
            </div>
            PetCare Pro.
          </a>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
