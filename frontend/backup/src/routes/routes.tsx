import { createBrowserRouter } from "react-router-dom";
import { Dashboard, Login } from "../pages";

export const routes = createBrowserRouter([
    {
        path: '/',
        element: <Login/>
    },
    {
        path: '/dashboard',
        element: <Dashboard/>
    },
])