import { PawPrint } from "lucide-react";
import ButtonThemeToggle from "../components/ButtonThemeToggle";
import LoginForm from "../components/auth/LoginForm";
const LoginPage = () => {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#e8f7fb,_var(--app-bg)_55%)] dark:bg-[radial-gradient(circle_at_top,_#13353b,_var(--app-bg)_58%)] flex items-center justify-center">
      <div className="flex flex-col justify-center items-center">
        <div className="flex flex-col items-center mb-8">
          <img
            src="../src/assets/logo.jpg"
            alt="Logo"
            className="size-24 border-2 border-primary rounded-full rotate-180 shadow-lg shadow-primary/25"
          />
          <h2 className="text-2xl font-bold mt-4 text-primary flex items-center gap-2">
            <PawPrint className="size-8 text-white bg-primary p-1 rounded-md" />
            PetCare Pro
          </h2>
        </div>
        <LoginForm />
      </div>
      <div className="absolute top-4 right-4">
        <ButtonThemeToggle />
      </div>
    </div>
  );
};

export default LoginPage;
