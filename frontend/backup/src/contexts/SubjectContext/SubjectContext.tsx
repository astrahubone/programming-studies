import { createContext, useContext } from "react";
import { SubjectContextTypes } from "./SubjectContext.types";

const initialSubjectContextValues: SubjectContextTypes = {
    subject: '',
    setSubject: () => null,
    savedSubjects: [],
    addSubject: () => null,
    subSubjects: [],
    setSubSubjects: () => null,
    saveSubSubjects: () => null
}

export const SubjectContext = createContext<SubjectContextTypes>(initialSubjectContextValues)


export const useSubjectContext = (): SubjectContextTypes => {
    return useContext(SubjectContext)
}