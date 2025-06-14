import { ReactNode, useState } from "react";
import { SubjectContext } from "../../contexts/SubjectContext";
import { SaveSubjects } from "../../contexts/SubjectContext/SubjectContext.types";

export const SubjectProvider = ({ children }: {children:  ReactNode }) => {
  const [subject, setSubject] = useState("");
  const [savedSubjects, setSavedSubjects] = useState<SaveSubjects[]>([])
  const [subSubjects, setSubSubjects] = useState<string[]>([""]);


  function addSubject(value: string) {
    setSavedSubjects((prevState) => [...prevState, { name: value, subSujects: []}])
    setSubject('')
  }
  function saveSubSubjects(subject: string, subSubjects: string[]) {
    setSavedSubjects((prevState) =>
      prevState.map((item) =>
        item.name === subject
          ? { ...item, subSujects: subSubjects }
          : item
      )
    );
  }
  return <SubjectContext.Provider value={{subject, setSubject, savedSubjects, addSubject, subSubjects, setSubSubjects,saveSubSubjects}}>
    {children}
  </SubjectContext.Provider>
};
