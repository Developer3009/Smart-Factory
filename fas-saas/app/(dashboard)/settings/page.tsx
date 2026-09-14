import { requireAdmin } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const { orgId, role } = await requireAdmin();
  return <SettingsClient orgId={orgId} role={role} />;
}
