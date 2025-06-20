import { useState } from "react";
import Layout from "../components/Layout";
import { Calendar } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { format, addDays } from "date-fns";
import { toast } from "react-toastify";
import { useSubjects } from "../hooks/api/useSubjects";
import { useStudySessions } from "../hooks/api/useStudySessions";

interface SubSubject {
  id: string;
  title: string;
  difficulty: "fácil" | "médio" | "difícil";
  subject: {
    title: string;
  };
}

export default function StudyConfig() {
  const { user } = useAuth();
  const { subjects: { data: subjectsData } } = useSubjects();
  const { createStudySession } = useStudySessions();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);

  const subSubjects = subjectsData?.flatMap(subject => 
    subject.sub_subjects.map(sub => ({
      ...sub,
      subject: {
        title: subject.title
      }
    }))
  ) || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubjects(subSubjects.map(subject => subject.id));
    } else {
      setSelectedSubjects([]);
    }
  };

  async function handleGenerateSchedule() {
    if (selectedSubjects.length === 0) {
      toast.error("Selecione pelo menos um assunto", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      return;
    }

    setLoading(true);
    try {
      const selectedSubjectsData = subSubjects.filter((sub) =>
        selectedSubjects.includes(sub.id)
      );

      const studySessions = selectedSubjectsData.flatMap((subject) => {
        const reviewDays =
          subject.difficulty === "fácil"
            ? 7
            : subject.difficulty === "médio"
            ? 5
            : 3;

        const initialSession = {
          subSubjectId: subject.id,
          scheduledDate: startDate,
        };

        const reviewSessions = Array.from({ length: 3 }, (_, index) => ({
          subSubjectId: subject.id,
          scheduledDate: format(
            addDays(new Date(startDate), reviewDays * (index + 1)),
            "yyyy-MM-dd"
          ),
        }));

        return [initialSession, ...reviewSessions];
      });

      // Create study sessions sequentially
      for (const session of studySessions) {
        await createStudySession.mutateAsync(session);
      }

      toast.success("Cronograma de estudos gerado com sucesso!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      setSelectedSubjects([]);
    } catch (error) {
      console.error("Erro ao gerar cronograma:", error);
      toast.error("Falha ao gerar cronograma de estudo", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!user?.id) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center text-gray-600">
            Faça login para gerenciar suas matérias
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Configuração do estudo
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gere seu cronograma de estudos personalizado
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-médio text-gray-900 dark:text-white mb-4">
              Gerador de cronograma
            </h2>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="start-date"
                  className="block text-sm font-médio text-gray-700 dark:text-gray-300"
                >
                  Data de início
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="mt-2 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-médio text-gray-700 dark:text-gray-300">
                    Selecione as matérias que deseja estudar
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={selectedSubjects.length === subSubjects.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="select-all" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      Selecionar todas
                    </label>
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {subSubjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <input
                        type="checkbox"
                        id={subject.id}
                        checked={selectedSubjects.includes(subject.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubjects([
                              ...selectedSubjects,
                              subject.id,
                            ]);
                          } else {
                            setSelectedSubjects(
                              selectedSubjects.filter((id) => id !== subject.id)
                            );
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <label htmlFor={subject.id} className="ml-3 flex-1">
                        <span className="block text-sm font-médio text-gray-900 dark:text-white">
                          {subject.title}
                        </span>
                        <span className="block text-sm text-gray-500 dark:text-gray-400">
                          {subject.subject.title} • {subject.difficulty}
                        </span>
                      </label>
                      <span
                        className={`px-2 py-1 text-xs font-médio rounded-full ${
                          subject.difficulty === "fácil"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : subject.difficulty === "médio"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {subject.difficulty === "fácil"
                          ? "Review in 7 days"
                          : subject.difficulty === "médio"
                          ? "Review in 5 days"
                          : "Review in 3 days"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateSchedule}
                  disabled={loading || selectedSubjects.length === 0}
                  className="flex items-center px-4 py-2 text-sm font-médio text-white bg-indigo-600 dark:bg-indigo-500 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 disabled:opacity-50"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {loading ? "Gerando cronograma..." : "Gerar Cronograma"}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-médio text-gray-900 dark:text-white mb-4">
              Como funciona o cronograma de estudos?
            </h2>
            <div className="prose prose-sm text-gray-500 dark:text-gray-400">
              <ul className="list-disc pl-5 space-y-2">
                <li>Tópicos com nível fácil são revisados ​​a cada 7 dias</li>
                <li>Tópicos com nível médio são revisados ​​a cada 5 dias</li>
                <li>Tópicos com nível difícil são revisados ​​a cada 3 dias</li>
                <li>
                  Cada tópico tem 3 sessões de revisão agendadas automaticamente
                </li>
                <li>Você pode marcar tópicos como concluídos no calendário</li>
                <li>
                  Acompanhe seu progresso e desempenho na página Desempenho
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}