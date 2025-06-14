import { useState } from "react";
import { ForgotPasswordModalProps } from "./ForgotPasswordModalProps.types";

import "./ForgotPasswordModal.scss";

export function ForgotPasswordModal({
  handleFPClose,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aqui você pode adicionar a lógica para enviar o email ou fazer o processo de recuperação
    setMessage(
      "Se um email foi encontrado, você receberá um link para redefinir sua senha."
    );
  };

  return (
    <div className="form-container">
      <div className="form-content">
        <div className="logo-container">Esqueceu sua senha?</div>
        <form className="form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              required
              className={`form-input ${email ? "has-content" : ""}`}
              placeholder=" "
              name="email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="email" className="form-label">
              Digite seu email
            </label>
          </div>

          {message && <div className="message">{message}</div>}

          <div className="modal-buttons">
          <button className="modal-close-btn" onClick={handleFPClose}>
              Fechar
            </button>
            <button type="submit" className="modal-submit-btn">
              Enviar e-mail
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
