import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Loading, ModalAddSubject } from "../../components";
import { useSubjectContext } from "../../contexts/SubjectContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faPlus } from "@fortawesome/free-solid-svg-icons";
import { ModalAddSubSubjects } from "../../components/ModalAddSubSubjects/ModalAddSubSubjects";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useIsMobile } from "../../hooks";
import "./Dashboard.scss";

export function Dashboard() {
  const { savedSubjects, saveSubSubjects } = useSubjectContext();
  const [showModal, setShowModal] = useState(false);
  const [showModalSubSubjects, setShowModalSubSubjects] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  }, [isLoading]);

  function handleSaveSubSubjects(subSubjects: string[]) {
    saveSubSubjects(selectedSubject, subSubjects);
  }

  function handleOpenSuccessModal() {
    setShowModal(false);
    toast.success("Matéria salva com sucesso!", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
    });
  }

  function toggleSidebar() {
    setSidebarOpen(!sidebarOpen);
  }

  function openModalAddSubSubject(subject: string) {
    setShowModalSubSubjects(true);
    setSelectedSubject(subject);
  }

  if (isLoading)
    return (
      <div className="loading-dashboard">
        <Loading />
      </div>
    );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        {isMobile ? (
          <FontAwesomeIcon
            icon={faBars}
            className="menu-icon"
            onClick={toggleSidebar}
          />
        ) : (
          <div className="dashboard-header__menu-list">
            <Typography color="white" fontWeight="bold" className="dashboard-header__menu-list--item" onClick={() => setShowModal(true)}>
              Cadastrar matéria
            </Typography>
            <Typography color="white" fontWeight="bold" className="dashboard-header__menu-list--item">
              Estudar
            </Typography>
          </div>
        )}

        <div className="user-info">
          <span>Olá</span>
          <div className="user-avatar"></div>
        </div>
      </header>

      {isMobile && (
        <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-content">
            <div className="sidebar-header">
              <button className="close-sidebar" onClick={toggleSidebar}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <button className="add-subject" onClick={() => setShowModal(true)}>
              Cadastrar matéria
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="dashboard-main">
        {savedSubjects.length > 0 ? (
          <div className="subjects-list">
            {savedSubjects.map((subject, index) => (
              <Accordion key={index} className="accordion-subject-card">
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ backgroundColor: "#f5f5f5" }}
                >
                  <Typography sx={{ flexGrow: 1 }}>
                    <strong>Matéria: </strong>
                    {subject.name}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <strong>Sub matérias:</strong>
                  {subject.subSujects.length > 0 ? (
                    subject.subSujects.map((item, i) => (
                      <Typography
                        className="accordion-subject-card__sub-subject"
                        key={i}
                      >
                        {item}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      Nenhuma submatéria cadastrada.
                    </Typography>
                  )}
                  <div className="accordion-subject-card__sub-subject-button">
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<FontAwesomeIcon icon={faPlus} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModalAddSubSubject(subject.name);
                      }}
                    >
                      Adicionar Sub Matéria
                    </Button>
                  </div>
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        ) : (
          <p className="empty-message">Nenhuma matéria cadastrada.</p>
        )}
      </main>

      {showModal && (
        <ModalAddSubject
          handleClose={() => setShowModal(false)}
          handleSave={handleOpenSuccessModal}
        />
      )}
      {showModalSubSubjects && (
        <ModalAddSubSubjects
          handleClose={() => setShowModalSubSubjects(false)}
          handleSave={handleSaveSubSubjects}
        />
      )}

      <ToastContainer />
    </div>
  );
}
