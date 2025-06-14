export interface SaveSubjects { 
    name: string
    subSujects: string[]
}

export interface SubjectContextTypes {
    subject: string
    setSubject: (newSubject: string) => void
    savedSubjects: SaveSubjects[]
    addSubject: (subject: string) => void
    subSubjects: string[]
    setSubSubjects: (subSubject: string[]) => void
    saveSubSubjects: (subject: string, subSubjects: string[]) => void
}