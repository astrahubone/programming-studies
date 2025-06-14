import { ModalAddSubjectProps } from "./ModalAddSubject.types";
import { useSubjectContext } from "../../contexts/SubjectContext";
import { useEffect, useState } from "react";
import "./ModalAddSubject.scss";

export function ModalAddSubject({
  handleClose,
  handleSave,
}: ModalAddSubjectProps) {
  const { subject, setSubject, addSubject } = useSubjectContext();
  const [isBtnDisabled, setIsBtnDisabled] = useState(true);

  useEffect(() => {
    setIsBtnDisabled(subject.trim() === "");
  }, [subject]);

  function handleClickSave() {
    if (!isBtnDisabled) {
    addSubject(subject);
    handleSave();
    }
  }
  function onChangeSubject(e: React.ChangeEvent<HTMLInputElement>) {
    setSubject(e.target.value);
  }
  return (
    <div className="form-container">
      <div className="form-content">
        <div className="logo-container">Cadastre uma nova matéria</div>
        <form className="form">
          <div className="input-group">
            <input
              type="text"
              name="subject"
              id="subject"
              className={`form-input ${subject ? "has-content" : ""}`}
              placeholder=" "
              value={subject}
              onChange={onChangeSubject}
            />
            <label className="form-label">Nome da matéria</label>
          </div>
        </form>
        <div className="modal-buttons">
          <button className="modal-close-btn" onClick={handleClose}>
            Fechar
          </button>
          <button className="modal-save-btn" onClick={handleClickSave} disabled={isBtnDisabled}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
