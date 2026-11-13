import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { SchoolWorkspace } from "@/components/admin/SchoolWorkspace";
export const Route = createFileRoute("/admin_/schools")({
  validateSearch: (search: Record<string, unknown>): { school?: string } => ({
    school:
      typeof search.school === "string" && /^[0-9a-f-]{36}$/i.test(search.school)
        ? search.school
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Управление школами - Kara-Kulja" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SchoolManagement,
});
function SchoolManagement() {
  const { school } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <AdminGuard>
      <SchoolWorkspace
        admin
        adminSchoolId={school}
        onSelectSchool={(id) => {
          void navigate({ search: id ? { school: id } : {} });
        }}
      />
    </AdminGuard>
  );
}
