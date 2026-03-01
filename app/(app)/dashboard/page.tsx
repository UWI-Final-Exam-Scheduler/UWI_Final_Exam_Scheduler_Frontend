import CustomCard from "@/app/components/ui/CustomCard";
import Sidebar from "../../components/ui/Sidebar";

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard Page</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CustomCard>
          <h2 className="text-lg font-semibold">Description</h2>
        </CustomCard>
        <CustomCard>
          <h2 className="text-lg font-semibold">Description</h2>
        </CustomCard>
        <CustomCard>
          <h2 className="text-lg font-semibold">Description</h2>
        </CustomCard>
        <CustomCard>
          <h2 className="text-lg font-semibold">Description</h2>
        </CustomCard>
      </div>
    </div>
  );
}
