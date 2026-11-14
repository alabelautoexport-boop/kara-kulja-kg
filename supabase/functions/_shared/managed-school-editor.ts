import { schoolEditorEmail, validSchoolUsername } from "./school-editor-credentials.ts";
export type SchoolAssignment = {
  school_id: string;
  user_id: string;
  username: string;
  is_active: boolean;
  updated_at?: string;
};
export function isManagedSchoolEditor({
  assignment,
  user,
  profile,
  assignments,
  hasNewsAssignment,
  school,
  allowInactive = false,
  allowArchived = false,
}: {
  assignment: SchoolAssignment | null;
  user: { id: string; email?: string; app_metadata?: Record<string, unknown> } | null;
  profile: { role: string | null } | null;
  assignments: { school_id: string; username: string | null }[];
  hasNewsAssignment: boolean;
  school: { id: string; is_archived: boolean } | null;
  allowInactive?: boolean;
  allowArchived?: boolean;
}) {
  return (
    !!assignment &&
    validSchoolUsername(assignment.username) &&
    !!user &&
    !!profile &&
    !!school &&
    (assignment.is_active || allowInactive) &&
    (!school.is_archived || allowArchived) &&
    school.id === assignment.school_id &&
    user.id === assignment.user_id &&
    user.email === schoolEditorEmail(assignment.username) &&
    user.app_metadata?.school_editor_managed === true &&
    user.app_metadata?.news_editor_managed !== true &&
    profile.role === null &&
    !hasNewsAssignment &&
    assignments.length === 1 &&
    assignments[0].school_id === assignment.school_id &&
    assignments[0].username === assignment.username
  );
}
