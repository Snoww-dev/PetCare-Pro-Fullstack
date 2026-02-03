import { Link } from "react-router";

const HomePage = () => {
  return (
    <div
      className="text-center flex flex-col items-center justify-center h-screen text-2x"
    >
      <h2 className="text-3xl font-bold">Chào mừng bạn đến với PetCare Pro</h2>
      <Link to="/login" className="ml-4 text-primary hover:underline">
        Đăng nhập
      </Link>
    </div>
  );
};

export default HomePage;
