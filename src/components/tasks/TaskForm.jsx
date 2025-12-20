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

  // Track if status just changed to "review" to auto-fill feedback fields
  const [statusChangedToReview, setStatusChangedToReview] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    status: initialData?.status || "todo",
    priority: initialData?.priority || "medium",
    assignee_id: initialData?.assignee_id || "",
    deadline: initialData?.deadline || "",
    milestone_id: milestoneId || initialData?.milestone_id || "",
    // Suggestions (always optional)
    suggestions: initialData?.suggestions || "",
    suggestion_by: initialData?.suggestion_by || user?.id || "",
    // Feedback (only when status is "review")
    feedback: initialData?.feedback || "",
    feedback_by: initialData?.feedback_by || "",
    feedback_date: initialData?.feedback_date || "",
  });

  // Check if status changed to "review" on mount
  useEffect(() => {
    if (initialData?.status === "review" && !initialData?.feedback_by) {
      setStatusChangedToReview(true);
      // Auto-fill feedback fields when status is review
      setFormData((prev) => ({
        ...prev,
        feedback_by: user?.id || "",
        feedback_date: new Date().toISOString().split("T")[0],
      }));
    }
  }, [initialData, user?.id]);

  // Fetch all necessary data
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

    // Required fields validation - Only title is required
    if (!formData.title.trim()) {
      errors.title = "Task title is required";
    }

    if (formData.deadline) {
      // Validate deadline is not in the past for new tasks
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineDate < today && !initialData) {
        errors.deadline = "Deadline cannot be in the past for new tasks";
      }

      // Validate task deadline is not after milestone deadline
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

    // Validate suggestions length
    if (formData.suggestions && formData.suggestions.length > 2000) {
      errors.suggestions = "Suggestions cannot exceed 2000 characters";
    }

    // Validate feedback length
    if (formData.feedback && formData.feedback.length > 2000) {
      errors.feedback = "Feedback cannot exceed 2000 characters";
    }

    // If status is "review", feedback is optional but if provided, validate it
    if (formData.status === "review" && formData.feedback.trim()) {
      if (!formData.feedback_by) {
        errors.feedback_by = "Please select who provided the feedback";
      }
      if (!formData.feedback_date) {
        errors.feedback_date = "Please provide feedback date";
      }
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
      // Prepare task data - null for empty optional fields
      const taskData = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        assignee_id: formData.assignee_id || null,
        deadline: formData.deadline || null,
        milestone_id: formData.milestone_id || null,
        project_id: projectId,
        updated_at: new Date().toISOString(),
        // Suggestions (always optional)
        suggestions: formData.suggestions || null,
        suggestion_by: formData.suggestions
          ? formData.suggestion_by || user?.id
          : null,
        // Feedback (optional, even in review status)
        feedback: formData.feedback || null,
        feedback_by: formData.feedback ? formData.feedback_by : null,
        feedback_date: formData.feedback ? formData.feedback_date : null,
      };

      if (initialData) {
        // Update task
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", initialData.id);

        if (error) throw error;

        // Log status change activity
        if (initialData.status !== formData.status) {
          await supabase.from("task_activities").insert([
            {
              task_id: initialData.id,
              user_id: user?.id,
              action: "status_changed",
              details: `Status changed from ${initialData.status} to ${formData.status}`,
              created_at: new Date().toISOString(),
            },
          ]);
        }

        // Log feedback activity if feedback was added
        if (formData.feedback && !initialData.feedback) {
          await supabase.from("task_activities").insert([
            {
              task_id: initialData.id,
              user_id: user?.id,
              action: "feedback_added",
              details: `Feedback provided`,
              created_at: new Date().toISOString(),
            },
          ]);
        }

        // Log if task moved to review
        if (formData.status === "review" && initialData.status !== "review") {
          await supabase.from("task_activities").insert([
            {
              task_id: initialData.id,
              user_id: user?.id,
              action: "moved_to_review",
              details: `Task moved to review for feedback`,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } else {
        // Create new task
        const { data, error } = await supabase
          .from("tasks")
          .insert([
            {
              ...taskData,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Log task creation activity
        await supabase.from("task_activities").insert([
          {
            task_id: data.id,
            user_id: user?.id,
            action: "task_created",
            details: `Task "${formData.title}" created`,
            created_at: new Date().toISOString(),
          },
        ]);
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
    const previousStatus = formData.status;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Check if status changed to "review"
    if (
      name === "status" &&
      value === "review" &&
      previousStatus !== "review"
    ) {
      setStatusChangedToReview(true);
      // Auto-fill feedback fields when status changes to review
      setFormData((prev) => ({
        ...prev,
        feedback_by: user?.id || "",
        feedback_date: new Date().toISOString().split("T")[0],
      }));
    }

    // Check if status changed from "review" to something else
    if (
      name === "status" &&
      previousStatus === "review" &&
      value !== "review"
    ) {
      setStatusChangedToReview(false);
    }

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

  // Check if feedback section should be shown
  const showFeedbackSection = formData.status === "review" || formData.feedback;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <strong className="font-medium">Error:</strong> {error}
        </div>
      )}

      {/* Form-level validation errors */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <p className="font-medium mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            {Object.values(validationErrors)
              .filter(Boolean)
              .map((error, index) => (
                <li key={index}>{error}</li>
              ))}
          </ul>
        </div>
      )}

      {/* Basic Information Section */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Basic Information
        </h3>

        <div className="space-y-4">
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
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.title}
              </p>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                className="input w-full"
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
                className="input w-full"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment & Timeline Section */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Milestone Field - Optional */}
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
                <option value="">No milestone selected</option>
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

            {/* Assignee Field - Optional */}
            <div>
              <label
                htmlFor="assignee_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Assign To (Optional)
              </label>
              <select
                id="assignee_id"
                name="assignee_id"
                value={formData.assignee_id}
                onChange={handleChange}
                className="input w-full"
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

          {/* Deadline Field - Optional */}
          <div>
            <label
              htmlFor="deadline"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Deadline (Optional)
              {getMilestoneDeadline() && (
                <span className="text-xs text-gray-500 ml-2">
                  (Must be before{" "}
                  {new Date(getMilestoneDeadline()).toLocaleDateString()})
                </span>
              )}
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={initialData ? undefined : getTodayDate()} // Only restrict for new tasks
                max={getMilestoneDeadline() || undefined}
                className={`input flex-1 ${
                  validationErrors.deadline
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              {formData.deadline && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, deadline: "" }))
                  }
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>
            {validationErrors.deadline && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.deadline}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {initialData
                ? "Set or update deadline (optional)"
                : "Select a date on or after today (optional)"}
              {getMilestoneDeadline() && ` and before milestone deadline`}
            </p>
          </div>
        </div>
      </div>

      {/* Suggestions Section (Always Optional) */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div>
          <label
            htmlFor="suggestions"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Suggestions & Notes (Optional)
            {formData.suggestions.length > 0 && (
              <span className="text-xs text-gray-500 ml-2">
                ({formData.suggestions.length}/2000 characters)
              </span>
            )}
          </label>
          <textarea
            id="suggestions"
            name="suggestions"
            rows="4"
            value={formData.suggestions}
            onChange={handleChange}
            className={`input resize-none w-full ${
              validationErrors.suggestions
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : ""
            }`}
            placeholder="Enter suggestions, notes, or additional requirements... (Optional)"
            maxLength={2000}
          />
          {validationErrors.suggestions && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.suggestions}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Suggestions will be recorded under your name:{" "}
            {users.find((u) => u.id === user?.id)?.full_name || user?.email}
          </p>
        </div>
      </div>

      {/* Info message when status is not review but task has feedback */}
      {formData.feedback && formData.status !== "review" && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
          <p className="text-sm">
            This task has feedback from a previous review. To add new feedback,
            change status to "review".
          </p>
        </div>
      )}

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
          className="btn-primary px-4 py-2 text-sm font-medium flex items-center"
        >
          {loading ? (
            <>
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
            </>
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
