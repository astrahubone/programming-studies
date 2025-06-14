import React from "react";
import AdminLayout from "../../components/admin/Layout";
import { BarChart2, Users, CreditCard, BookOpen } from "lucide-react";
import { useAdmin } from "../../hooks/api/useAdmin";

export default function AdminDashboard() {
  const { dashboardStats: { data: stats, isLoading, error } } = useAdmin();

  const statCards = [
    {
      name: "Total de Usuários",
      value: stats?.totalUsers || 0,
      icon: Users,
      change: "+12%",
      changeType: "increase",
    },
    {
      name: "Assinaturas Ativas",
      value: stats?.activeSubscriptions || 0,
      icon: CreditCard,
      change: "+5%",
      changeType: "increase",
    },
    {
      name: "Receita Total",
      value: `R$ ${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: BarChart2,
      change: "+18%",
      changeType: "increase",
    },
    {
      name: "Total de Matérias",
      value: stats?.totalSubjects || 0,
      icon: BookOpen,
      change: "+7%",
      changeType: "increase",
    },
  ];

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {isLoading ? (
            <div className="mt-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
          ) : error ? (
            <div className="mt-8 text-center text-red-600 dark:text-red-400">
              Failed to load dashboard statistics
            </div>
          ) : (
            <div className="mt-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((item) => (
                  <div key={item.name} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <item.icon className="h-6 w-6 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                              {item.name}
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900 dark:text-white">{item.value}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                      <div className="text-sm">
                        <span
                          className={`font-medium ${
                            item.changeType === "increase"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {item.change}
                        </span>{" "}
                        <span className="text-gray-500 dark:text-gray-400">vs último mês</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}