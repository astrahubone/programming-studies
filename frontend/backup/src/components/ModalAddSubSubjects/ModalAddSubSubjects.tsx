import { useSubjectContext } from "../../contexts/SubjectContext";
import { useEffect, useState } from "react";
import "./ModalAddSubSubjects.scss";

interface ModalProps {
  handleClose: () => void;
  handleSave: (subSubjects: string[]) => void;
}

export function ModalAddSubSubjects({ handleClose, handleSave }: ModalProps) {
  const { subSubjects, setSubSubjects } = useSubjectContext();
  const [isBtnDisabled, setIsBtnDisabled] = useState(true);

  useEffect(() => {
    setIsBtnDisabled(
      subSubjects.length > 0 &&
        subSubjects[subSubjects.length - 1].trim() === ""
    );
  }, [subSubjects]);

  function addInputField() {
    if (!isBtnDisabled) {
      setSubSubjects([...subSubjects, ""]);
    }
  }

  function updateInputValue(index: number, value: string) {
    const updatedValues = [...subSubjects];
    updatedValues[index] = value;
    setSubSubjects(updatedValues);
  }

  function handleSaveClick() {
    const filteredSubSubjects = subSubjects.filter((sub) => sub.trim() !== "");
    handleSave(filteredSubSubjects);
    handleClose();
  }

  return (
    <div className="form-container">
      <div className="form-content">
        <div className="logo-container">Adicionar Submatérias</div>
        <form className="form">
          {subSubjects.map((subSubjects, index) => (
            <div key={index} className="input-group">
              <input
                type="text"
                name="subsubject"
                id="subsubject"
                className={`form-input ${subSubjects ? "has-content" : ""}`}
                placeholder=" "
                value={subSubjects}
                onChange={(e) => updateInputValue(index, e.target.value)}
              />
              <label className="form-label">Nome da Submatéria</label>
            </div>
          ))}
        </form>
        <div className="modal-add-subsubject-btn">
          <button
            type="button"
            className="modal-add-btn"
            onClick={addInputField}
            disabled={isBtnDisabled}
          >
            Adicionar outra
          </button>
        </div>
        <div className="modal-buttons">
          <button className="modal-close-btn" onClick={handleClose}>
            Fechar
          </button>
          <button className="modal-save-btn" onClick={handleSaveClick}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
