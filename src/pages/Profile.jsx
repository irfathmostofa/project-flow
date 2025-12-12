import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Calendar,
  Edit,
  Save,
  X,
  Key,
  Shield,
  Sparkles,
  Camera,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-2">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2 animate-slideDown">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center space-x-2 animate-slideDown">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Profile Header with Gradient */}
          <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 p-6 sm:p-8">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16"></div>

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="relative group">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 bg-white rounded-full flex items-center justify-center shadow-xl ring-4 ring-white/50">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || user.email}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600" />
                    )}
                  </div>
                  {editing && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-yellow-300 animate-pulse" />
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    {profile?.full_name || "User"}
                  </h2>
                  <p className="text-purple-100 flex items-center mt-1">
                    <Mail className="h-4 w-4 mr-2" />
                    {user.email}
                  </p>
                </div>
              </div>

              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="group flex items-center px-6 py-3 bg-white text-purple-600 rounded-xl hover:shadow-xl transition-all font-semibold"
                >
                  <Edit className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 sm:p-8">
            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Avatar URL
                    </label>
                    <input
                      type="url"
                      name="avatar_url"
                      value={formData.avatar_url}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
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
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center"
                    disabled={saving}
                  >
                    <X className="h-5 w-5 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center disabled:opacity-50"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Address
                    </h3>
                    <p className="text-gray-900 font-semibold">{user.email}</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                    <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Full Name
                    </h3>
                    <p className="text-gray-900 font-semibold">
                      {profile?.full_name
                        ? profile?.full_name
                        : user.user_metadata.full_name}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Account Created
                    </h3>
                    <p className="text-gray-900 font-semibold">
                      {user.created_at
                        ? format(new Date(user.created_at), "MMMM d, yyyy")
                        : "Unknown"}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                    <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      User ID
                    </h3>
                    <p className="text-gray-900 font-mono text-xs truncate font-semibold">
                      {user.id}
                    </p>
                  </div>
                </div>

                {/* Account Information Section */}
                <div className="pt-6 border-t-2 border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-6 w-6 mr-2 text-blue-600" />
                    Account Security
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                      <span className="text-gray-700 flex items-center font-semibold">
                        <CheckCircle className="h-5 w-5 mr-3 text-green-600" />
                        Email Verified
                      </span>
                      <span
                        className={`px-4 py-2 rounded-full text-xs font-bold ${
                          user.email_confirmed_at
                            ? "bg-green-600 text-white"
                            : "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
                        }`}
                      >
                        {user.email_confirmed_at ? "✓ VERIFIED" : "PENDING"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                      <span className="text-gray-700 flex items-center font-semibold">
                        <Key className="h-5 w-5 mr-3 text-blue-600" />
                        Last Sign In
                      </span>
                      <span className="text-gray-900 font-bold text-sm">
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
        <div className="bg-white rounded-2xl shadow-xl border-2 border-red-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b-2 border-red-200">
            <h3 className="text-xl font-bold text-red-600 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2" />
              Danger Zone
            </h3>
          </div>

          <div className="p-6">
            <div className="p-5 border-2 border-red-200 rounded-xl bg-gradient-to-br from-red-50 to-pink-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">
                    Delete Account
                  </h4>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all data. This action
                    cannot be undone.
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
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all whitespace-nowrap"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
