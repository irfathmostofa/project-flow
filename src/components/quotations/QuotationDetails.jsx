// components/quotations/QuotationDetails.jsx
import { useState } from "react";
import { format } from "date-fns";
import {
  Download,
  Send,
  CheckCircle,
  X,
  Mail,
  Printer,
  FileText,
  Calendar,
  User,
  Phone,
  Mail as MailIcon,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function QuotationDetails({ quotation, onStatusChange }) {
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    setIsSending(true);
    // Implement email sending logic
    setTimeout(() => setIsSending(false), 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Implement PDF generation
    alert("PDF download feature coming soon");
  };

  if (!quotation) return null;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {quotation.quote_number}
          </h2>
          <p className="text-sm text-gray-500">
            Created {format(new Date(quotation.created_at), "MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
          {quotation.status === "draft" && (
            <button
              onClick={() => onStatusChange(quotation.id, "sent")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send to Client
            </button>
          )}
          {quotation.status === "sent" && (
            <button
              onClick={() => onStatusChange(quotation.id, "approved")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Mark as Approved
            </button>
          )}
        </div>
      </div>

      {/* Client Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Client Information
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Client Name</p>
                <p className="font-medium">{quotation.client_name}</p>
              </div>
            </div>
            {quotation.client_email && (
              <div className="flex items-center gap-2 mb-3">
                <MailIcon className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{quotation.client_email}</p>
                </div>
              </div>
            )}
          </div>
          <div>
            {quotation.client_phone && (
              <div className="flex items-center gap-2 mb-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{quotation.client_phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Valid Period</p>
                <p className="font-medium">
                  {format(new Date(quotation.valid_from), "MMM d, yyyy")} -{" "}
                  {format(new Date(quotation.valid_until), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quotation Items
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  Quantity
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotation.quotation_line_items?.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {quotation.currency} {item.unit_price}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    {quotation.currency} {item.line_total}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td
                  colSpan="3"
                  className="px-4 py-3 text-right font-semibold text-gray-900"
                >
                  Subtotal:
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {quotation.currency} {quotation.total_amount}
                </td>
              </tr>
              <tr>
                <td
                  colSpan="3"
                  className="px-4 py-3 text-right font-bold text-gray-900"
                >
                  Total:
                </td>
                <td className="px-4 py-3 text-right font-bold text-lg text-gray-900">
                  {quotation.currency}{" "}
                  {quotation.total_amount?.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Terms & Conditions */}
      {quotation.payment_terms && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Payment Terms
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap">
            {quotation.payment_terms}
          </p>
        </div>
      )}

      {quotation.terms_and_conditions && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Terms & Conditions
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap">
            {quotation.terms_and_conditions}
          </p>
        </div>
      )}

      {/* Status Information */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Last updated:{" "}
            {format(new Date(quotation.updated_at), "MMM d, yyyy h:mm a")}
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Status:{" "}
            <span className="capitalize font-medium">{quotation.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
