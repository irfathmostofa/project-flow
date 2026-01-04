import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext"; // Added import

export default function MilestoneForm({
  projectId,
  onSuccess,
  initialData = null,
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    deadline: initialData?.deadline || "",
    status: initialData?.status || "pending",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to create or edit milestones");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (initialData) {
        // Update existing milestone - verify project ownership through RLS
        const { error } = await supabase
          .from("milestones")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", initialData.id);

        if (error) throw error;
      } else {
        // Create new milestone - project_id is enough, RLS will handle ownership
        const { error } = await supabase.from("milestones").insert([
          {
            ...formData,
            project_id: projectId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      }

      onSuccess?.();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded-lg">
          Please log in to create or edit milestones
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Milestone Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="input w-full"
          placeholder="Enter milestone name"
          disabled={!user || loading}
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows="3"
          value={formData.description}
          onChange={handleChange}
          className="input resize-none w-full"
          placeholder="Describe the milestone..."
          disabled={!user || loading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="deadline"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Deadline
          </label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="input"
            disabled={!user || loading}
          />
        </div>

        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="input"
            disabled={!user || loading}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => onSuccess?.()}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!user || loading}
          className="btn-primary"
        >
          {loading
            ? "Saving..."
            : initialData
            ? "Update Milestone"
            : "Create Milestone"}
        </button>
      </div>
    </form>
  );
}
