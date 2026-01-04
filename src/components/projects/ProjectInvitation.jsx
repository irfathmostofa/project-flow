import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { Mail, UserPlus } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import Modal from "../ui/Modal";

export default function ProjectInvitationButton({
  projectId,
  projectName,
  onInviteSent,
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !projectId) {
      setError("You must be logged in to send invitations");
      return;
    }

    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Check if user is inviting themselves
    if (email.toLowerCase() === user.email.toLowerCase()) {
      setError("You cannot invite yourself");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check if user exists in our database
      const { data: existingUsers, error: userError } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", email.toLowerCase());

      if (userError) throw userError;

      // If user exists, check if they're already a member
      if (existingUsers && existingUsers.length > 0) {
        const userId = existingUsers[0].id;

        const { data: existingMember, error: memberError } = await supabase
          .from("project_members")
          .select("*")
          .eq("project_id", projectId)
          .eq("user_id", userId);

        if (!memberError && existingMember && existingMember.length > 0) {
          setError("This user is already a member of this project");
          setLoading(false);
          return;
        }
      }

      // Check for pending invitations
      const { data: pendingInvitations, error: inviteError } = await supabase
        .from("project_invitations")
        .select("*")
        .eq("project_id", projectId)
        .eq("invitee_email", email.toLowerCase())
        .eq("status", "pending");

      if (inviteError) throw inviteError;

      if (pendingInvitations && pendingInvitations.length > 0) {
        setError("An invitation has already been sent to this email");
        setLoading(false);
        return;
      }

      // Generate a unique token for the invitation
      const token =
        Math.random().toString(36).substring(2) + Date.now().toString(36);

      // Set expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: insertError } = await supabase
        .from("project_invitations")
        .insert({
          project_id: projectId,
          inviter_id: user.id,
          invitee_email: email.toLowerCase(),
          token: token,
          role: role,
          expires_at: expiresAt.toISOString(),
          status: "pending",
        });

      if (insertError) throw insertError;

      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      setIsOpen(false);

      // Callback to refresh members list
      if (onInviteSent) {
        onInviteSent();
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      setError(error.message || "Failed to send invitation");
      toast.error("Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
      >
        <UserPlus className="h-4 w-4" />
        {/* <span>Quick Invite</span> */}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Quick Invite to ${projectName}`}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="user@example.com"
                required
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="viewer">Viewer</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Viewer: Can view only • Member: Can edit • Admin: Full access
            </p>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md text-sm font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
