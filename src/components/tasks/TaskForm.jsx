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

  // Validation function
  const validateForm = () => {
    const errors = {};

    // Required fields validation
    if (!formData.title.trim()) {
      errors.title = "Task title is required";
    }

    if (!formData.milestone_id) {
      errors.milestone_id = "Please select a milestone";
    }

    if (!formData.assignee_id) {
      errors.assignee_id = "Please assign the task to someone";
    }

    if (!formData.deadline) {
      errors.deadline = "Deadline is required";
    } else {
      // Validate deadline is not in the past
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare dates only

      if (deadlineDate < today) {
        errors.deadline = "Deadline cannot be in the past";
      }

      // If milestone has a deadline, validate task deadline is not after milestone deadline
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

    // Description validation (optional but with max length)
    if (formData.description.length > 1000) {
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
      const taskData = {
        ...formData,
        project_id: projectId,
        updated_at: new Date().toISOString(),
      };

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
      setError(error.message);
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

  // Get milestone deadline for max attribute
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
          {error}
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

      {/* Title Field */}
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

      {/* Description Field */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description{" "}
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
          placeholder="Describe the task..."
          maxLength={1000}
        />
        {validationErrors.description && (
          <p className="mt-1 text-sm text-red-600">
            {validationErrors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Status Field */}
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

        {/* Priority Field */}
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
        {/* Milestone Field - Required */}
        <div>
          <label
            htmlFor="milestone_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Milestone *
          </label>
          <select
            id="milestone_id"
            name="milestone_id"
            value={formData.milestone_id}
            onChange={handleChange}
            className={`input ${
              validationErrors.milestone_id
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : ""
            }`}
            required
          >
            <option value="">Select a milestone</option>
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.name}
              </option>
            ))}
          </select>
          {validationErrors.milestone_id && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.milestone_id}
            </p>
          )}
        </div>

        {/* Assignee Field - Required */}
        <div>
          <label
            htmlFor="assignee_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Assign To *
          </label>
          <select
            id="assignee_id"
            name="assignee_id"
            value={formData.assignee_id}
            onChange={handleChange}
            className={`input ${
              validationErrors.assignee_id
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : ""
            }`}
            required
          >
            <option value="">Select an assignee</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email}
              </option>
            ))}
          </select>
          {validationErrors.assignee_id && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.assignee_id}
            </p>
          )}
        </div>
      </div>

      {/* Deadline Field - Required */}
      <div>
        <label
          htmlFor="deadline"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Deadline *
          {getMilestoneDeadline() && (
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
          required
        />
        {validationErrors.deadline && (
          <p className="mt-1 text-sm text-red-600">
            {validationErrors.deadline}
          </p>
        )}
        {!validationErrors.deadline && (
          <p className="mt-1 text-sm text-gray-500">
            Select a date on or after today
            {getMilestoneDeadline() && ` and before milestone deadline`}
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
