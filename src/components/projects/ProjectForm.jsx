import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function ProjectForm({ onSuccess, initialData = null }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    deadline: initialData?.deadline || "",
    status: initialData?.status || "active",
  });

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Project name is required";
    } else if (formData.name.length > 100) {
      errors.name = "Project name must be less than 100 characters";
    }

    if (formData.description && formData.description.length > 1000) {
      errors.description = "Description must be less than 1000 characters";
    }

    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineDate < today) {
        errors.deadline = "Deadline cannot be in the past";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to create a project");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (initialData) {
        // Update existing project
        const { error } = await supabase
          .from("projects")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", initialData.id);

        if (error) throw error;
      } else {
        // Create new project with owner_id
        const { data, error } = await supabase
          .from("projects")
          .insert([
            {
              ...formData,
              owner_id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select();

        if (error) throw error;

        // Also add user as project member with owner role
        if (data && data[0]) {
          await supabase.from("project_members").insert([
            {
              project_id: data[0].id,
              user_id: user.id,
              role: "owner",
            },
          ]);
        }
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving project:", error);
      const errorMessage = error.message || "Failed to save project";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Get today's date for min attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
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
          Please log in to create or edit projects
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Project Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className={`input w-full ${
            validationErrors.name ? "border-red-300 focus:border-red-500" : ""
          }`}
          placeholder="Enter project name"
          disabled={!user || loading}
          maxLength={100}
        />
        {validationErrors.name && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description{" "}
          {formData.description && (
            <span className="text-xs text-gray-500">
              ({formData.description.length}/1000 characters)
            </span>
          )}
        </label>
        <textarea
          id="description"
          name="description"
          rows="3"
          value={formData.description}
          onChange={handleChange}
          className={`input resize-none w-full ${
            validationErrors.description
              ? "border-red-300 focus:border-red-500"
              : ""
          }`}
          placeholder="Describe your project..."
          disabled={!user || loading}
          maxLength={1000}
        />
        {validationErrors.description && (
          <p className="mt-1 text-sm text-red-600">
            {validationErrors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="deadline"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Deadline (Optional)
          </label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            min={getTodayDate()}
            className={`input ${
              validationErrors.deadline
                ? "border-red-300 focus:border-red-500"
                : ""
            }`}
            disabled={!user || loading}
          />
          {validationErrors.deadline && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.deadline}
            </p>
          )}
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
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
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
          {loading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {initialData ? "Updating..." : "Creating..."}
            </span>
          ) : initialData ? (
            "Update Project"
          ) : (
            "Create Project"
          )}
        </button>
      </div>
    </form>
  );
}
