import { useEffect, useState } from "react";

import { Mail, Check, X, Clock } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function DashboardInvitations() {
  const { user } = useAuth();
  const toast = useToast();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState(0);

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user, update]);

  const fetchInvitations = async () => {
    try {
      // First get pending invitations for current user's email
      const { data: invitationsData, error: invitationsError } = await supabase
        .from("project_invitations")
        .select("*")
        .eq("invitee_email", user.email)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (invitationsError) throw invitationsError;

      if (!invitationsData || invitationsData.length === 0) {
        setInvitations([]);
        setLoading(false);
        return;
      }

      // Get project details for each invitation
      const invitationsWithDetails = await Promise.all(
        invitationsData.map(async (invitation) => {
          // Get project details
          const { data: projectData } = await supabase
            .from("projects")
            .select("name")
            .eq("id", invitation.project_id)
            .single();

          // Get inviter details
          const { data: inviterData } = await supabase
            .from("users")
            .select("full_name, email")
            .eq("id", invitation.inviter_id)
            .single();

          return {
            ...invitation,
            project: projectData || { name: "Unknown Project" },
            inviter: inviterData || { full_name: null, email: "Unknown User" },
          };
        })
      );

      setInvitations(invitationsWithDetails);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId) => {
    try {
      const invitation = invitations.find((inv) => inv.id === invitationId);
      if (!invitation) {
        toast.error("Invitation not found");
        return;
      }

      // Update invitation status first
      const { error: updateError } = await supabase
        .from("project_invitations")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (updateError) throw updateError;

      // Get user ID
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", invitation.invitee_email)
        .single();

      if (userError) throw userError;

      // Add member to project
      const { error: memberError } = await supabase
        .from("project_members")
        .insert({
          project_id: invitation.project_id,
          user_id: userData.id,
          role: invitation.role,
        });

      if (memberError && !memberError.message.includes("duplicate"))
        throw memberError;

      toast.success("Invitation accepted! You have been added to the project.");
      setUpdate(update + 1);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Failed to accept invitation");
    }
  };

  const handleDecline = async (invitationId) => {
    try {
      const { error } = await supabase
        .from("project_invitations")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (error) throw error;

      toast.success("Invitation declined");
      setUpdate(update + 1);
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error("Failed to decline invitation");
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-sm border border-yellow-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-yellow-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Mail className="h-5 w-5 text-yellow-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Pending Invitations
            </h2>
          </div>
          <span className="text-xs font-semibold text-yellow-800 bg-yellow-200 px-2 py-1 rounded-full">
            {invitations.length} new
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="p-4 bg-white border-2 border-yellow-200 rounded-xl hover:border-yellow-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">
                    {invitation.project?.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Invited by:{" "}
                    {invitation.inviter?.full_name ||
                      invitation.inviter?.email ||
                      "Unknown User"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full capitalize">
                      {invitation.role}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Expires:{" "}
                      {new Date(invitation.expires_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 ml-4">
                  <button
                    onClick={() => handleAccept(invitation.id)}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(invitation.id)}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
