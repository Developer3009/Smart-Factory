import { requireOrgAdmin } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const { orgId, role } = await requireOrgAdmin();
  return <SettingsClient orgId={orgId} role={role} />;
}
