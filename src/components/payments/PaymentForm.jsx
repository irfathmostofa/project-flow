// components/payments/PaymentForm.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  CreditCard,
  Banknote,
  Wallet,
  AlertCircle,
} from "lucide-react";

export default function PaymentForm({ projectId, projects, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    project_id: projectId || "",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "bank_transfer",
    transaction_id: "",
    reference_note: "",
    status: "completed",
  });

  // Update project_id when projectId prop changes
  useEffect(() => {
    if (projectId) {
      setFormData(prev => ({ ...prev, project_id: projectId }));
    }
  }, [projectId]);

  const paymentMethods = [
    { value: "cash", label: "Cash", icon: Banknote },
    { value: "bank_transfer", label: "Bank Transfer", icon: CreditCard },
    { value: "credit_card", label: "Credit Card", icon: CreditCard },
    { value: "mobile_banking", label: "Mobile Banking", icon: Wallet },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.project_id) throw new Error("Please select a project");
      if (!formData.amount || parseFloat(formData.amount) <= 0)
        throw new Error("Please enter a valid amount");
      if (!formData.payment_date) throw new Error("Please select payment date");

      const paymentData = {
        project_id: formData.project_id,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        transaction_id: formData.transaction_id || null,
        reference_note: formData.reference_note || null,
        status: formData.status,
        received_by: user.id,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from("payments")
        .insert([paymentData]);

      if (insertError) throw insertError;
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Safely format number input
  const handleAmountChange = (value) => {
    if (value === "" || value === null) {
      setFormData(prev => ({ ...prev, amount: "" }));
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData(prev => ({ ...prev, amount: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Project Selection - only show if no projectId provided */}
      {!projectId && projects && projects.length > 0 && (
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Show selected project when projectId is provided */}
      {projectId && projects && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>
          <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
            {projects.find(p => p.id === projectId)?.name || "Loading..."}
          </div>
        </div>
      )}

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            ৳
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            required
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.value}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    payment_method: method.value,
                  }))
                }
                className={`p-3 border-2 rounded-lg flex items-center gap-2 transition-all ${
                  formData.payment_method === method.value
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{method.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Date *
        </label>
        <input
          type="date"
          value={formData.payment_date}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, payment_date: e.target.value }))
          }
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Transaction ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transaction ID (Optional)
        </label>
        <input
          type="text"
          value={formData.transaction_id}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, transaction_id: e.target.value }))
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          placeholder="Bank transaction reference number"
        />
      </div>

      {/* Reference Note */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reference Note (Optional)
        </label>
        <textarea
          value={formData.reference_note}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, reference_note: e.target.value }))
          }
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          placeholder="Additional notes about this payment..."
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Status
        </label>
        <select
          value={formData.status}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, status: e.target.value }))
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Recording...
            </>
          ) : (
            "Record Payment"
          )}
        </button>
      </div>
    </form>
  );
}