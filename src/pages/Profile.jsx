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
  Building,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  Briefcase,
  Settings,
  Upload,
  LogOut,
} from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    avatar_url: "",
  });

  const [companyFormData, setCompanyFormData] = useState({
    company_name: "",
    company_title: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_website: "",
    tax_id: "",
    currency: "BDT",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchCompanySettings();
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

  const fetchCompanySettings = async () => {
    try {
      console.log("Fetching company settings for user:", user.id); // Debug log

      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error

      if (error) {
        console.error("Error fetching:", error);
        throw error;
      }

      console.log("Fetched data:", data); // Debug log

      if (data) {
        setCompanySettings(data);
        setCompanyFormData({
          company_name: data.company_name || "",
          company_title: data.company_title || "",
          company_address: data.company_address || "",
          company_phone: data.company_phone || "",
          company_email: data.company_email || "",
          company_website: data.company_website || "",
          tax_id: data.tax_id || "",
          currency: data.currency || "BDT",
        });
      } else {
        // No settings found, initialize empty form
        console.log("No company settings found, will create new on save");
        setCompanySettings(null);
        setCompanyFormData({
          company_name: "",
          company_title: "",
          company_address: "",
          company_phone: "",
          company_email: "",
          company_website: "",
          tax_id: "",
          currency: "BDT",
        });
      }
    } catch (error) {
      console.error("Error fetching company settings:", error);
      // Don't throw, just log the error
      setCompanySettings(null);
    }
  };

  const handleProfileSubmit = async (e) => {
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
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Validate required fields
      if (!companyFormData.company_name) {
        throw new Error("Company name is required");
      }

      // Prepare the data for upsert
      const companyData = {
        user_id: user.id,
        company_name: companyFormData.company_name,
        company_title: companyFormData.company_title || null,
        company_address: companyFormData.company_address || null,
        company_phone: companyFormData.company_phone || null,
        company_email: companyFormData.company_email || null,
        company_website: companyFormData.company_website || null,
        tax_id: companyFormData.tax_id || null,
        currency: companyFormData.currency || "BDT",
        updated_at: new Date().toISOString(),
      };

      console.log("Saving company data:", companyData); // Debug log

      // Use upsert with proper syntax
      const { data, error } = await supabase
        .from("company_settings")
        .upsert(companyData, {
          onConflict: "user_id", // Specify conflict target
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Saved successfully:", data); // Debug log

      // Refresh company settings
      await fetchCompanySettings();

      setSuccess("Company settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error saving company settings:", error);
      setError(error.message || "Failed to save company settings");
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

  const handleCompanyChange = (e) => {
    setCompanyFormData({
      ...companyFormData,
      [e.target.name]: e.target.value,
    });
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "company", label: "Company Info", icon: Building },
    { id: "security", label: "Security", icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/50">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || user.email}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-purple-600" />
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">
                  {profile?.full_name || user.email?.split("@")[0]}
                </h2>
                <p className="text-purple-100 flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                <p className="text-purple-100 text-sm mt-1">
                  Member since{" "}
                  {user.created_at
                    ? format(new Date(user.created_at), "MMMM yyyy")
                    : "Recently"}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <nav className="flex gap-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                      isActive
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Personal Info Tab */}
            {activeTab === "personal" && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* Company Info Tab */}
            {activeTab === "company" && (
              <form onSubmit={handleCompanySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="h-4 w-4 inline mr-1" />
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={companyFormData.company_name}
                      onChange={handleCompanyChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Briefcase className="h-4 w-4 inline mr-1" />
                      Your Title/Role
                    </label>
                    <input
                      type="text"
                      name="company_title"
                      value={companyFormData.company_title}
                      onChange={handleCompanyChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Full Stack Developer, CEO"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="company_phone"
                      value={companyFormData.company_phone}
                      onChange={handleCompanyChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Company Email
                    </label>
                    <input
                      type="email"
                      name="company_email"
                      value={companyFormData.company_email}
                      onChange={handleCompanyChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="company@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="h-4 w-4 inline mr-1" />
                      Website
                    </label>
                    <input
                      type="url"
                      name="company_website"
                      value={companyFormData.company_website}
                      onChange={handleCompanyChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Company Address
                    </label>
                    <input
                      type="text"
                      name="company_address"
                      value={companyFormData.company_address}
                      onChange={handleCompanyChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Full address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax/VAT ID
                    </label>
                    <input
                      type="text"
                      name="tax_id"
                      value={companyFormData.tax_id}
                      onChange={handleCompanyChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Tax ID (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CreditCard className="h-4 w-4 inline mr-1" />
                      Default Currency
                    </label>
                    <select
                      name="currency"
                      value={companyFormData.currency}
                      onChange={handleCompanyChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="INR">INR (₹) - Indian Rupee</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    This information will appear on all your quotations and
                    business documents.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Company Settings
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    Account Security
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">
                          Email Verification
                        </p>
                        <p className="text-sm text-gray-500">
                          Verify your email address to secure your account
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.email_confirmed_at
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {user.email_confirmed_at ? "Verified" : "Pending"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">
                          Last Sign In
                        </p>
                        <p className="text-sm text-gray-500">
                          Your last login activity
                        </p>
                      </div>
                      <p className="text-sm text-gray-900">
                        {user.last_sign_in_at
                          ? format(
                              new Date(user.last_sign_in_at),
                              "MMM d, yyyy h:mm a",
                            )
                          : "Never"}
                      </p>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Account ID</p>
                        <p className="text-sm text-gray-500">
                          Your unique account identifier
                        </p>
                      </div>
                      <p className="text-sm font-mono text-gray-600">
                        {user.id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="border-2 border-red-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 px-6 py-4 border-b border-red-200">
                    <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Danger Zone
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          Delete Account
                        </p>
                        <p className="text-sm text-gray-500">
                          Permanently delete your account and all associated
                          data. This action cannot be undone.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete your account? This action cannot be undone.",
                            )
                          ) {
                            alert(
                              "Account deletion requires additional setup.",
                            );
                          }
                        }}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={signOut}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
