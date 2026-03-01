import CustomButton from "../components/ui/CustomButton";
import CustomCard from "../components/ui/CustomCard";
import LoginCard from "../components/ui/LoginCard";

export default function Login() {
  return (
    <div className="flex justify-center">
      <LoginCard>
        <CustomCard>Username</CustomCard>
        <CustomCard>Password</CustomCard>
        <div className="flex justify-center">
          <CustomButton>Login</CustomButton>
        </div>
      </LoginCard>
    </div>
  );
}
