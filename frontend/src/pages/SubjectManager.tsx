import React, { useState } from "react";
import Layout from "../components/Layout";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSubjects } from "../hooks/api/useSubjects";
import { toast } from "react-toastify";

interface Subject {
  id: string;
  title: string;
  color?: string;
  sub_subjects: SubSubject[];
}

interface SubSubject {
  id: string;
  title: string;
  difficulty: "fácil" | "médio" | "difícil";
}

const DEFAULT_COLORS = {
  fácil: '#60A5FA',
  médio: '#F59E0B',
  difícil: '#EF4444'
};

export default function SubjectManager() {
  const { user } = useAuth();
  const { subjects: { data: subjects, isLoading }, createSubject, updateSubject, deleteSubject } = useSubjects();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectTitle, setSubjectTitle] = useState("");
  const [subjectColor, setSubjectColor] = useState("#60A5FA");
  const [subSubjects, setSubSubjects] = useState<
    { title: string; difficulty: "fácil" | "médio" | "difícil" }[]
  >([]);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user?.id) {
      toast.error("Faça login para criar matérias.");
      return;
    }

    if (!subjectTitle.trim() || subSubjects.length === 0) {
      toast.error("Você deve cadastrar no mínimo uma submatéria.");
      return;
    }

    const isDuplicate = subjects?.some(
      (subject) =>
        subject.title.toLowerCase().trim() ===
          subjectTitle.toLowerCase().trim() &&
        (!editingSubject || subject.id !== editingSubject.id)
    );

    if (isDuplicate) {
      toast.error("Já existe uma matéria com este nome.");
      return;
    }

    setLoading(true);
    try {
      const data = {
        title: subjectTitle,
        color: subjectColor,
        subSubjects: subSubjects
      };

      if (editingSubject) {
        await updateSubject.mutateAsync({ id: editingSubject.id, data });
      } else {
        await createSubject.mutateAsync(data);
      }

      setIsModalOpen(false);
      setEditingSubject(null);
      setSubjectTitle("");
      setSubjectColor("#60A5FA");
      setSubSubjects([]);
    } catch (error) {
      console.error("Erro ao salvar a matéria:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSubject(subjectId: string) {
    if (
      !user?.id ||
      !confirm("Tem certeza de que deseja excluir esta matéria?")
    )
      return;

    try {
      await deleteSubject.mutateAsync(subjectId);
    } catch (error) {
      console.error("Erro ao excluir matéria:", error);
    }
  }

  function toggleSubjectExpansion(subjectId: string) {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Gerenciador de Matérias
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gerencie suas matérias e submatérias
            </p>
          </div>
          <button
            onClick={() => {
              setEditingSubject(null);
              setSubjectTitle("");
              setSubjectColor("#60A5FA");
              setSubSubjects([]);
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar matéria
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {subjects?.map((subject) => (
                <li key={subject.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <button
                        onClick={() => toggleSubjectExpansion(subject.id)}
                        className="mr-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                      >
                        {expandedSubjects.has(subject.id) ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: subject.color || DEFAULT_COLORS.fácil }}
                        />
                        <span className="text-lg font-medium text-gray-900 dark:text-white">
                          {subject.title}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingSubject(subject);
                          setSubjectTitle(subject.title);
                          setSubjectColor(subject.color || DEFAULT_COLORS.fácil);
                          setSubSubjects(
                            subject.sub_subjects.map((sub) => ({
                              title: sub.title,
                              difficulty: sub.difficulty,
                            }))
                          );
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(subject.id)}
                        className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {expandedSubjects.has(subject.id) && (
                    <div className="mt-4 ml-7 space-y-2">
                      {subject.sub_subjects.map((subSubject) => (
                        <div
                          key={subSubject.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {subSubject.title}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              subSubject.difficulty === "fácil"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : subSubject.difficulty === "médio"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {subSubject.difficulty}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingSubject ? "Editar Matéria" : "Adicionar Nova Matéria"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Título da Matéria
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={subjectTitle}
                    onChange={(e) => setSubjectTitle(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="color"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Cor no Calendário
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="color"
                      id="color"
                      value={subjectColor}
                      onChange={(e) => setSubjectColor(e.target.value)}
                      className="h-8 w-16 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Escolha uma cor para identificar esta matéria no calendário
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Submatérias
                  </label>
                  {subSubjects.map((sub, index) => (
                    <div key={index} className="flex space-x-4 mb-4">
                      <input
                        type="text"
                        value={sub.title}
                        onChange={(e) => {
                          const newSubSubjects = [...subSubjects];
                          newSubSubjects[index].title = e.target.value;
                          setSubSubjects(newSubSubjects);
                        }}
                        className="flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        placeholder="Título da Submatéria"
                      />
                      <select
                        value={sub.difficulty}
                        onChange={(e) => {
                          const newSubSubjects = [...subSubjects];
                          newSubSubjects[index].difficulty = e.target.value as
                            | "fácil"
                            | "médio"
                            | "difícil";
                          setSubSubjects(newSubSubjects);
                        }}
                        className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        <option value="fácil">Fácil</option>
                        <option value="médio">Médio</option>
                        <option value="difícil">Difícil</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setSubSubjects(
                            subSubjects.filter((_, i) => i !== index)
                          );
                        }}
                        className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSubSubjects([
                        ...subSubjects,
                        { title: "", difficulty: "fácil" },
                      ]);
                    }}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar submatéria
                  </button>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingSubject(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 border border-transparent rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50"
                  >
                    {loading
                      ? "Salvando..."
                      : editingSubject
                      ? "Salvar alterações"
                      : "Criar Matéria"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}