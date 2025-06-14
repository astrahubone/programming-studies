import { RouterProvider } from 'react-router-dom'
import { SubjectProvider } from './providers';
import { routes } from './routes'
import './App.css'
import './index.scss'
import "react-toastify/dist/ReactToastify.css";


function App() {
  return (
    <>
    <SubjectProvider>
      <RouterProvider router={routes}/>
    </SubjectProvider>
    </>
  )
}

export default App
