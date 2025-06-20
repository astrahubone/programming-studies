import React, { useState } from "react";
import { Box, Flex, Text, Button, Card, TextField, Select, Dialog } from '@radix-ui/themes';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Layout from "../components/Layout";
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
        <Box p="6">
          <Flex justify="center" align="center" style={{ height: '200px' }}>
            <Text color="gray">Faça login para gerenciar suas matérias</Text>
          </Flex>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box p="6">
        <Flex justify="between" align="center" mb="6">
          <Box>
            <Text size="6" weight="bold" mb="1" style={{ display: 'block' }}>
              Gerenciador de Matérias
            </Text>
            <Text size="3" color="gray">
              Gerencie suas matérias e submatérias
            </Text>
          </Box>
          <Button
            onClick={() => {
              setEditingSubject(null);
              setSubjectTitle("");
              setSubjectColor("#60A5FA");
              setSubSubjects([]);
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} />
            Adicionar matéria
          </Button>
        </Flex>

        <Card size="3">
          {isLoading ? (
            <Flex justify="center" align="center" p="4">
              <Text>Carregando...</Text>
            </Flex>
          ) : (
            <Flex direction="column">
              {subjects?.map((subject) => (
                <Box key={subject.id} p="4" style={{ borderBottom: '1px solid var(--gray-6)' }}>
                  <Flex justify="between" align="center">
                    <Flex align="center" gap="3">
                      <Button
                        variant="ghost"
                        size="1"
                        onClick={() => toggleSubjectExpansion(subject.id)}
                      >
                        {expandedSubjects.has(subject.id) ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </Button>
                      <Flex align="center" gap="2">
                        <Box 
                          style={{ 
                            width: '16px', 
                            height: '16px', 
                            borderRadius: '50%',
                            backgroundColor: subject.color || DEFAULT_COLORS.fácil 
                          }}
                        />
                        <Text size="4" weight="medium">
                          {subject.title}
                        </Text>
                      </Flex>
                    </Flex>
                    <Flex gap="2">
                      <Button
                        variant="ghost"
                        size="2"
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
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        color="red"
                        size="2"
                        onClick={() => handleDeleteSubject(subject.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </Flex>
                  </Flex>

                  {expandedSubjects.has(subject.id) && (
                    <Box mt="4" ml="7">
                      <Flex direction="column" gap="2">
                        {subject.sub_subjects.map((subSubject) => (
                          <Card key={subSubject.id} variant="surface" size="2">
                            <Flex justify="between" align="center">
                              <Text size="3" weight="medium">
                                {subSubject.title}
                              </Text>
                              <Box
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: 'medium',
                                  backgroundColor: 
                                    subSubject.difficulty === "fácil" ? 'var(--blue-3)' :
                                    subSubject.difficulty === "médio" ? 'var(--yellow-3)' :
                                    'var(--red-3)',
                                  color:
                                    subSubject.difficulty === "fácil" ? 'var(--blue-11)' :
                                    subSubject.difficulty === "médio" ? 'var(--yellow-11)' :
                                    'var(--red-11)'
                                }}
                              >
                                {subSubject.difficulty}
                              </Box>
                            </Flex>
                          </Card>
                        ))}
                      </Flex>
                    </Box>
                  )}
                </Box>
              ))}
            </Flex>
          )}
        </Card>

        <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Dialog.Content style={{ maxWidth: '600px' }}>
            <Dialog.Title>
              {editingSubject ? "Editar Matéria" : "Adicionar Nova Matéria"}
            </Dialog.Title>
            
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="4" mt="4">
                <Box>
                  <Text as="label" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                    Título da Matéria
                  </Text>
                  <TextField.Root
                    value={subjectTitle}
                    onChange={(e) => setSubjectTitle(e.target.value)}
                    size="3"
                  />
                </Box>

                <Box>
                  <Text as="label" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                    Cor no Calendário
                  </Text>
                  <Flex align="center" gap="2">
                    <input
                      type="color"
                      value={subjectColor}
                      onChange={(e) => setSubjectColor(e.target.value)}
                      style={{ height: '32px', width: '64px', borderRadius: '4px', border: '1px solid var(--gray-6)', cursor: 'pointer' }}
                    />
                    <Text size="2" color="gray">
                      Escolha uma cor para identificar esta matéria no calendário
                    </Text>
                  </Flex>
                </Box>

                <Box>
                  <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                    Submatérias
                  </Text>
                  {subSubjects.map((sub, index) => (
                    <Flex key={index} gap="2" mb="2">
                      <TextField.Root
                        value={sub.title}
                        onChange={(e) => {
                          const newSubSubjects = [...subSubjects];
                          newSubSubjects[index].title = e.target.value;
                          setSubSubjects(newSubSubjects);
                        }}
                        placeholder="Título da Submatéria"
                        style={{ flex: 1 }}
                      />
                      <Select.Root
                        value={sub.difficulty}
                        onValueChange={(value: "fácil" | "médio" | "difícil") => {
                          const newSubSubjects = [...subSubjects];
                          newSubSubjects[index].difficulty = value;
                          setSubSubjects(newSubSubjects);
                        }}
                      >
                        <Select.Trigger style={{ width: '120px' }} />
                        <Select.Content>
                          <Select.Item value="fácil">Fácil</Select.Item>
                          <Select.Item value="médio">Médio</Select.Item>
                          <Select.Item value="difícil">Difícil</Select.Item>
                        </Select.Content>
                      </Select.Root>
                      <Button
                        type="button"
                        variant="ghost"
                        color="red"
                        size="2"
                        onClick={() => {
                          setSubSubjects(
                            subSubjects.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </Flex>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSubSubjects([
                        ...subSubjects,
                        { title: "", difficulty: "fácil" },
                      ]);
                    }}
                  >
                    <Plus size={16} />
                    Adicionar submatéria
                  </Button>
                </Box>

                <Flex justify="end" gap="3" mt="4">
                  <Dialog.Close>
                    <Button variant="outline" type="button">
                      Cancelar
                    </Button>
                  </Dialog.Close>
                  <Button type="submit" disabled={loading}>
                    {loading
                      ? "Salvando..."
                      : editingSubject
                      ? "Salvar alterações"
                      : "Criar Matéria"}
                  </Button>
                </Flex>
              </Flex>
            </form>
          </Dialog.Content>
        </Dialog.Root>
      </Box>
    </Layout>
  );
}