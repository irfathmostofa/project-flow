import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Calendar, Edit, Save, X, Key, Shield } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        avatar_url: data.avatar_url || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("users")
        .update(formData)
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev) => ({ ...prev, ...formData }));
      setEditing(false);
      setSuccess("Profile updated successfully!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Profile
        </h1>
        <p className="text-gray-600 mt-1 sm:mt-2">
          Manage your account information and settings
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="card">
        {/* Profile Header */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white rounded-full flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || user.email}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {profile?.full_name || user.email}
                </h2>
                <p className="text-blue-100 flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-2" />
                  {user.email}
                </p>
              </div>
            </div>

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Form/Info */}
        <div className="p-4 sm:p-6 lg:p-8">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="input"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    name="avatar_url"
                    value={formData.avatar_url}
                    onChange={handleChange}
                    className="input"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      full_name: profile.full_name || "",
                      avatar_url: profile.avatar_url || "",
                    });
                  }}
                  className="btn-secondary"
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Email Address
                  </h3>
                  <p className="text-gray-900">{user.email}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Full Name
                  </h3>
                  <p className="text-gray-900">
                    {profile?.full_name || "Not set"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Account Created
                  </h3>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {user.created_at
                      ? format(new Date(user.created_at), "MMMM d, yyyy")
                      : "Unknown"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    User ID
                  </h3>
                  <p className="text-gray-900 font-mono text-sm truncate">
                    {user.id}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Account Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Email Verified
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.email_confirmed_at
                          ? "badge-success"
                          : "badge-warning"
                      }`}
                    >
                      {user.email_confirmed_at ? "Verified" : "Not Verified"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      Last Sign In
                    </span>
                    <span className="text-gray-900 text-sm">
                      {user.last_sign_in_at
                        ? format(
                            new Date(user.last_sign_in_at),
                            "MMM d, yyyy HH:mm"
                          )
                        : "Never"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card">
        <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="p-4 border border-red-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <h4 className="font-medium text-gray-900">Delete Account</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete your account? This action cannot be undone."
                    )
                  ) {
                    alert(
                      "Account deletion would be implemented here. This requires additional Supabase setup."
                    );
                  }
                }}
                className="btn-danger"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
