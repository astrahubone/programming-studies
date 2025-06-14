import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./FormLogin.scss";
import { ForgotPasswordModal } from "../ForgotPasswordModal";

export function FormLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showFPModal, setShowFPModal] = useState(false);
  const navigate = useNavigate();
  
  function handleLogin() {
    navigate("/dashboard");
  }

  function onChangeEmail(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
  }

  function onChangePassword(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
  }

  function handleFPClick(){
      setShowFPModal(true)
  }

  function handleFPClose(){
      setShowFPModal(false)
  }

  return (
    <section id="login">
      <div className="content-login">
        <form className="form-login">
          <div className="input-group">
            <input
              type="email"
              name="email"
              id="email"
              className={`form-input ${email ? "has-content" : ""}`}
              placeholder=" "
              value={email}
              onChange={onChangeEmail}
            />
            <label htmlFor="email" className="form-label">E-mail</label>
          </div>
          <div className="input-group">
            <input
              type="password"
              name="password"
              id="password"
              className={`form-input ${password ? "has-content" : ""}`}
              placeholder=" "
              value={password}
              onChange={onChangePassword}
            />
            <label htmlFor="password" className="form-label">Senha</label>
          </div>
          <button type="button" onClick={handleLogin} className="modal-submit-btn">Entrar</button>
          <button type='button' className="forgot-password-btn" onClick={handleFPClick}>Esqueceu a senha?</button>
        </form>
      </div>
      {showFPModal && <ForgotPasswordModal handleFPClose={handleFPClose}/>}
    </section>
  );
}
