// components/infrastructure/InfrastructureRenewalForm.jsx
import { useState } from "react";
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
  projects,
  onSuccess,
  initialData,
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    project_id: initialData?.project_id || "",
    item_name: initialData?.item_name || "",
    provider: initialData?.provider || "",
    renewal_date: initialData?.renewal_date || "",
    annual_cost: initialData?.annual_cost || "",
    status: initialData?.status || "active",
    notes: initialData?.notes || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.project_id) throw new Error("Please select a project");
      if (!formData.item_name) throw new Error("Please enter the item name");
      if (!formData.renewal_date) throw new Error("Please select renewal date");

      const dataToSave = {
        ...formData,
        annual_cost: formData.annual_cost
          ? parseFloat(formData.annual_cost)
          : null,
      };

      if (initialData) {
        const { error } = await supabase
          .from("infrastructure_renewals")
          .update(dataToSave)
          .eq("id", initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("infrastructure_renewals")
          .insert([dataToSave]);
        if (error) throw error;
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            onChange={(e) => {
              if (e.target.value) {
                setFormData((prev) => ({ ...prev, item_name: e.target.value }));
              }
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Quick select from common items</option>
            {itemTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <span className="text-gray-400 self-center">or</span>
        </div>
        <input
          type="text"
          value={formData.item_name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, item_name: e.target.value }))
          }
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., example.com Domain, AWS Hosting, SSL Certificate"
        />
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
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
            value={formData.annual_cost}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, annual_cost: e.target.value }))
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes or reminders..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onSuccess}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : initialData ? "Update" : "Add Item"}
        </button>
      </div>
    </form>
  );
}
