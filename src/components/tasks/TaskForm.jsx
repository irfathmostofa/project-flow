import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function TaskForm({
  projectId,
  milestoneId,
  onSuccess,
  initialData = null,
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [milestones, setMilestones] = useState([]);
  const [users, setUsers] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize form data with proper null handling
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    status: initialData?.status || "todo",
    priority: initialData?.priority || "medium",
    assignee_id: initialData?.assignee_id || "",
    deadline: initialData?.deadline || "",
    milestone_id: milestoneId || initialData?.milestone_id || "",
  });

  useEffect(() => {
    if (projectId) {
      fetchMilestones();
      fetchUsers();
    }
  }, [projectId]);

  const fetchMilestones = async () => {
    const { data } = await supabase
      .from("milestones")
      .select("id, name, deadline")
      .eq("project_id", projectId)
      .order("deadline", { ascending: true });

    setMilestones(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("users")
      .select("id, email, full_name")
      .order("full_name", { ascending: true });

    setUsers(data || []);
  };

  // Validation function - UPDATED: assignee_id is now optional
  const validateForm = () => {
    const errors = {};

    // Only title is required
    if (!formData.title.trim()) {
      errors.title = "Task title is required";
    }

    // Assignee is optional - no validation needed

    // Deadline is optional - no validation needed
    // But if provided, validate it's not in the past
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineDate < today) {
        errors.deadline = "Deadline cannot be in the past";
      }

      // If milestone is selected and has a deadline, validate task deadline is not after milestone deadline
      if (formData.milestone_id) {
        const selectedMilestone = milestones.find(
          (m) => m.id === formData.milestone_id
        );
        if (selectedMilestone?.deadline) {
          const milestoneDeadline = new Date(selectedMilestone.deadline);
          if (deadlineDate > milestoneDeadline) {
            errors.deadline = `Task deadline cannot be after milestone deadline (${new Date(
              milestoneDeadline
            ).toLocaleDateString()})`;
          }
        }
      }
    }

    // Description validation (optional but with max length)
    if (formData.description && formData.description.length > 1000) {
      errors.description = "Description cannot exceed 1000 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form before submission
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }

    setLoading(true);

    try {
      // Prepare task data with proper null handling for ALL optional fields
      const taskData = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        project_id: projectId,
        // Convert empty strings to null for all optional fields
        milestone_id: formData.milestone_id ? formData.milestone_id : null,
        assignee_id: formData.assignee_id ? formData.assignee_id : null,
        deadline: formData.deadline || null,
        updated_at: new Date().toISOString(),
      };

      console.log("Submitting task data:", taskData); // Debug log

      if (initialData) {
        // Update task
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", initialData.id);

        if (error) throw error;
      } else {
        // Create task
        const { error } = await supabase.from("tasks").insert([
          {
            ...taskData,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving task:", error);
      setError(error.message || "Failed to save task.");
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

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Format date for min attribute (today's date)
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Get milestone deadline for max attribute (only if milestone is selected)
  const getMilestoneDeadline = () => {
    if (!formData.milestone_id) return null;
    const milestone = milestones.find((m) => m.id === formData.milestone_id);
    return milestone?.deadline ? milestone.deadline.split("T")[0] : null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
          {error.includes("null value") && (
            <div className="mt-2 text-sm">
              <p>Possible database constraints issue. Please check:</p>
              <code className="block bg-gray-100 p-2 rounded mt-1">
                -- Make sure both columns allow NULL
                <br />
                ALTER TABLE tasks ALTER COLUMN milestone_id DROP NOT NULL;
                <br />
                ALTER TABLE tasks ALTER COLUMN assignee_id DROP NOT NULL;
                <br />
                ALTER TABLE tasks ALTER COLUMN deadline DROP NOT NULL;
              </code>
            </div>
          )}
        </div>
      )}

      {/* Form-level validation errors */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <p className="font-medium mb-1">Please fix the following errors:</p>
          <ul className="list-disc list-inside text-sm">
            {Object.values(validationErrors)
              .filter(Boolean)
              .map((error, index) => (
                <li key={index}>{error}</li>
              ))}
          </ul>
        </div>
      )}

      {/* Title Field - REQUIRED */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Task Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          value={formData.title}
          onChange={handleChange}
          className={`input w-full ${
            validationErrors.title
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : ""
          }`}
          placeholder="Enter task title"
        />
        {validationErrors.title && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
        )}
      </div>

      {/* Description Field - OPTIONAL */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (Optional)
          {formData.description.length > 0 && (
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
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : ""
          }`}
          placeholder="Describe the task (optional)..."
          maxLength={1000}
        />
        {validationErrors.description && (
          <p className="mt-1 text-sm text-red-600">
            {validationErrors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Status Field - REQUIRED with default */}
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
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Priority Field - REQUIRED with default */}
        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="input"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Milestone Field - OPTIONAL */}
        <div>
          <label
            htmlFor="milestone_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Milestone (Optional)
          </label>
          <select
            id="milestone_id"
            name="milestone_id"
            value={formData.milestone_id}
            onChange={handleChange}
            className="input w-full"
          >
            <option value="">No milestone</option>
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.name}
                {milestone.deadline &&
                  ` (Due: ${new Date(
                    milestone.deadline
                  ).toLocaleDateString()})`}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee Field - OPTIONAL */}
        <div>
          <label
            htmlFor="assignee_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Assign To
          </label>
          <select
            id="assignee_id"
            name="assignee_id"
            value={formData.assignee_id}
            onChange={handleChange}
            className="input"
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Deadline Field - OPTIONAL */}
      <div>
        <label
          htmlFor="deadline"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Deadline (Optional)
          {formData.milestone_id && getMilestoneDeadline() && (
            <span className="text-xs text-gray-500 ml-2">
              (Must be before{" "}
              {new Date(getMilestoneDeadline()).toLocaleDateString()})
            </span>
          )}
        </label>
        <input
          type="date"
          id="deadline"
          name="deadline"
          value={formData.deadline}
          onChange={handleChange}
          min={getTodayDate()}
          max={getMilestoneDeadline() || undefined}
          className={`input ${
            validationErrors.deadline
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : ""
          }`}
        />
        {validationErrors.deadline && (
          <p className="mt-1 text-sm text-red-600">
            {validationErrors.deadline}
          </p>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => onSuccess?.()}
          className="btn-secondary px-4 py-2 text-sm font-medium"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-4 py-2 text-sm font-medium"
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
            "Update Task"
          ) : (
            "Create Task"
          )}
        </button>
      </div>
    </form>
  );
}
