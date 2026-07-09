// components/infrastructure/InfrastructureRenewalForm.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  AlertCircle,
  Server,
  Calendar,
  DollarSign,
  Building,
} from "lucide-react";

export default function InfrastructureRenewalForm({
  projectId,
  onSuccess,
  initialData,
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        let query = supabase.from("projects").select("*").order("name");

        // If projectId is provided, filter to that specific project
        if (projectId) {
          query = query.eq("id", projectId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects");
      }
    };

    fetchProjects();
  }, [projectId]);

  const [formData, setFormData] = useState({
    project_id: initialData?.project_id || projectId || "",
    item_name: initialData?.item_name || "",
    provider: initialData?.provider || "",
    renewal_date: initialData?.renewal_date || "",
    annual_cost: initialData?.annual_cost || "",
    status: initialData?.status || "active",
    notes: initialData?.notes || "",
  });

  // Reset form when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData({
        project_id: initialData.project_id || projectId || "",
        item_name: initialData.item_name || "",
        provider: initialData.provider || "",
        renewal_date: initialData.renewal_date || "",
        annual_cost: initialData.annual_cost || "",
        status: initialData.status || "active",
        notes: initialData.notes || "",
      });
    }
  }, [initialData, projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!formData.project_id) throw new Error("Please select a project");
      if (!formData.item_name || !formData.item_name.trim()) {
        throw new Error("Please enter the item name");
      }
      if (!formData.renewal_date) throw new Error("Please select renewal date");

      // Prepare data for saving
      const dataToSave = {
        project_id: formData.project_id,
        item_name: formData.item_name.trim(),
        provider: formData.provider?.trim() || "",
        renewal_date: formData.renewal_date,
        annual_cost: formData.annual_cost
          ? parseFloat(formData.annual_cost)
          : null,
        status: formData.status || "active",
        notes: formData.notes?.trim() || "",
        updated_at: new Date().toISOString(),
      };

      if (initialData) {
        // Update existing record
        const { error } = await supabase
          .from("infrastructure_renewals")
          .update(dataToSave)
          .eq("id", initialData.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from("infrastructure_renewals")
          .insert([
            {
              ...dataToSave,
              created_at: new Date().toISOString(),
            },
          ]);

        if (error) throw error;
      }

      onSuccess();
    } catch (err) {
      setError(err.message || "An error occurred while saving");
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const itemTypes = [
    "Domain Registration",
    "Web Hosting",
    "SSL Certificate",
    "Cloud Service",
    "Software License",
    "Maintenance Contract",
    "Support Contract",
    "API Subscription",
    "Other",
  ];

  const handleQuickSelect = (value) => {
    if (value) {
      setFormData((prev) => ({ ...prev, item_name: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Project Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project *
        </label>
        <select
          value={formData.project_id}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, project_id: e.target.value }))
          }
          required
          disabled={!!projectId} // Disable if projectId is provided as prop
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select a project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Item Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Item Name *
        </label>
        <div className="flex gap-3 mb-3">
          <select
            value=""
            onChange={(e) => handleQuickSelect(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Quick select from common items</option>
            {itemTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <span className="text-gray-400 self-center text-sm">or</span>
        </div>
        <div className="relative">
          <Server className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={formData.item_name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, item_name: e.target.value }))
            }
            required
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., example.com Domain, AWS Hosting, SSL Certificate"
          />
        </div>
      </div>

      {/* Provider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Provider
        </label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={formData.provider}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, provider: e.target.value }))
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., GoDaddy, AWS, Namecheap"
          />
        </div>
      </div>

      {/* Renewal Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Renewal Date *
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={formData.renewal_date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, renewal_date: e.target.value }))
            }
            required
            min={new Date().toISOString().split("T")[0]} // Prevent past dates
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          You'll be notified 30 days before this date
        </p>
      </div>

      {/* Annual Cost */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Annual Cost
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.annual_cost}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, annual_cost: e.target.value }))
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, status: e.target.value }))
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="active">Active</option>
          <option value="renewed">Renewed</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          placeholder="Additional notes or reminders..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onSuccess}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin mr-2">⟳</span>
              Saving...
            </>
          ) : initialData ? (
            "Update Item"
          ) : (
            "Add Item"
          )}
        </button>
      </div>
    </form>
  );
}
