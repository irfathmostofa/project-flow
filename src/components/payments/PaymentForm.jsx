// components/payments/PaymentForm.jsx
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  CreditCard,
  Banknote,
  Wallet,
  AlertCircle,
} from "lucide-react";

export default function PaymentForm({ projects, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    project_id: "",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "bank_transfer",
    transaction_id: "",
    reference_note: "",
    status: "completed",
  });

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
      if (!formData.amount || formData.amount <= 0)
        throw new Error("Please enter a valid amount");
      if (!formData.payment_date) throw new Error("Please select payment date");

      const { error: insertError } = await supabase.from("payments").insert([
        {
          ...formData,
          amount: parseFloat(formData.amount),
          received_by: user.id,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            value={formData.amount}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, amount: e.target.value }))
            }
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
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Recording..." : "Record Payment"}
        </button>
      </div>
    </form>
  );
}
