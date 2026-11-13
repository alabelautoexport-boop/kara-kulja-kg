import { newsEditorEmail } from "./editor-credentials.ts";

// Production's dedicated accounts have a profile row with NO site-wide role.
export function isManagedNewsEditor({
  assignment,
  user,
  profile,
  hasSchoolAssignment,
}: {
  assignment: { user_id: string; username: string } | null;
  user: { id: string; email?: string; app_metadata?: Record<string, unknown> } | null;
  profile: { role: string | null } | null;
  hasSchoolAssignment: boolean;
}) {
  return (
    !!assignment &&
    !!user &&
    !!profile &&
    user.id === assignment.user_id &&
    user.email === newsEditorEmail(assignment.username) &&
    user.app_metadata?.news_editor_managed === true &&
    profile.role === null &&
    !hasSchoolAssignment
  );
}
