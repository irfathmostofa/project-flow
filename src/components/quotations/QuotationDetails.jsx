// components/quotations/QuotationDetails.jsx
import { useRef, useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Download,
  Send,
  CheckCircle,
  Mail,
  Printer,
  FileText,
  Calendar,
  User,
  Phone,
  Mail as MailIcon,
  DollarSign,
  Clock,
  Users,
  Globe,
  HeartHandshake,
  RefreshCw,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import QuotationPrint from "./QuotationPrint";

export default function QuotationDetails({
  quotation,
  lineItems,
  recurringItems,
  onStatusChange,
}) {
  const printRef = useRef();
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [companySettings, setCompanySettings] = useState(null);

  useEffect(() => {
    fetchCompanySettings();
  }, [user]);

  const fetchCompanySettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setCompanySettings(data);
    } catch (error) {
      console.error("Error fetching company settings:", error);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: quotation?.quote_number || "quotation",
    onAfterPrint: () => {
      console.log("Print completed");
    },
    onPrintError: (error) => {
      console.error("Print error:", error);
    },
  });

  const handleDownloadPDF = () => {
    handlePrint();
  };

  if (!quotation) return null;

  // Calculate totals safely
  const developmentTotal =
    lineItems?.reduce((sum, item) => sum + (item.line_total || 0), 0) || 0;
  const recurringTotal =
    recurringItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  const totalAmount =
    quotation.total_amount || developmentTotal + recurringTotal;

  return (
    <>
      {/* Hidden Print Component */}
      <div style={{ display: "none" }}>
        <QuotationPrint
          ref={printRef}
          quotation={quotation}
          lineItems={lineItems}
          recurringItems={recurringItems}
          companySettings={companySettings}
        />
      </div>

      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {quotation.quote_number}
            </h2>
            <p className="text-sm text-gray-500">
              Created {format(new Date(quotation.created_at), "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print / PDF
            </button>
            {quotation.status === "draft" && (
              <>
                <button
                  onClick={() => onStatusChange(quotation.id, "sent")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Send to Client
                </button>
                <button
                  onClick={() => onStatusChange(quotation.id, "approved")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark as Approved
                </button>
              </>
            )}
          </div>
        </div>

        {/* Rest of the details view - same as before */}
        <div className="space-y-6">
          {/* Client Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              Client Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      {quotation.valid_from && quotation.valid_until ? (
                        <>
                          {format(
                            new Date(quotation.valid_from),
                            "MMM d, yyyy",
                          )}{" "}
                          -{" "}
                          {format(
                            new Date(quotation.valid_until),
                            "MMM d, yyyy",
                          )}
                        </>
                      ) : (
                        "Not specified"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Overview */}
          {quotation.project_overview && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Project Overview
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {quotation.project_overview}
              </p>
            </div>
          )}

          {/* Scope of Work */}
          {quotation.scope_of_work && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Scope of Work
              </h3>
              <div className="text-gray-700 whitespace-pre-wrap">
                {quotation.scope_of_work}
              </div>
            </div>
          )}

          {/* Financial Summary Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Financial Summary
            </h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Amount ({quotation.currency})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lineItems && lineItems.length > 0 ? (
                    lineItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.description} (Qty: {item.quantity})
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {quotation.currency}{" "}
                          {item.line_total?.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="2"
                        className="px-4 py-4 text-center text-gray-500"
                      >
                        No line items added
                      </td>
                    </tr>
                  )}
                </tbody>
                {recurringItems && recurringItems.length > 0 && (
                  <tbody className="border-t border-gray-200">
                    {recurringItems.map((item, index) => (
                      <tr key={`recurring-${index}`} className="bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.description} ({item.frequency})
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {quotation.currency} {item.amount?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr className="font-bold">
                    <td className="px-4 py-3 text-right text-gray-900">
                      Total Investment
                    </td>
                    <td className="px-4 py-3 text-right text-lg text-purple-600">
                      {quotation.currency} {totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Vision & Support */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Vision & Post-Launch Support
            </h3>
            {quotation.training_included && (
              <div className="mb-3">
                <p className="font-medium">Training:</p>
                <p className="text-gray-700">
                  {quotation.training_details ||
                    "Comprehensive training session provided."}
                </p>
              </div>
            )}
            <div className="mb-3">
              <p className="font-medium">Long-term Plan:</p>
              <p className="text-gray-700">
                {quotation.vision_support ||
                  "The site is built for scalability, allowing future upgrades."}
              </p>
            </div>
            {!quotation.training_included && (
              <div>
                <p className="font-medium">Training:</p>
                <p className="text-gray-700">
                  Comprehensive training session provided on managing content.
                </p>
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          {quotation.terms_and_conditions && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Terms & Conditions
              </h3>
              <div className="text-gray-700 whitespace-pre-wrap">
                {quotation.terms_and_conditions}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-4 text-center text-gray-500 text-sm">
            <p>
              Thank you for your business! If you have any questions, feel free
              to contact us.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
