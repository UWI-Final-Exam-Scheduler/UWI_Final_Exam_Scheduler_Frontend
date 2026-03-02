import CustomButton from "../components/ui/CustomButton";
import CustomTextField from "../components/ui/CustomTextField";
import LoginCard from "../components/ui/LoginCard";

export default function Login() {
  return (
    <div className="flex justify-center">
      <LoginCard>
        <CustomTextField placeholder="Email" width={300} />
        <CustomTextField placeholder="Password" width={300} />
        <div className="flex justify-center">
          <CustomButton buttonname="Login" />
        </div>
      </LoginCard>
    </div>
  );
}
