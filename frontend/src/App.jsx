import { useCallback, useEffect, useMemo, useState } from "react";
import Footer from "./components/Footer.jsx";
import LoginModal from "./components/LoginModal.jsx";
import Navbar from "./components/Navbar.jsx";
import Toast from "./components/Toast.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Admin from "./pages/Admin.jsx";
import Document from "./pages/Document.jsx";
import Exams from "./pages/Exams.jsx";
import Home from "./pages/Home.jsx";
import News from "./pages/News.jsx";
import Subjects from "./pages/Subjects.jsx";

const routeMap = {
  "#/": Home,
  "#/news": News,
  "#/subjects": Subjects,
  "#/exams": Exams,
  "#/documents": Document,
  "#/admin": Admin
};

export default function App() {
  const { isAdmin, toast } = useAuth();
  const [route, setRoute] = useState(() => window.location.hash || "#/");
  const [loginOpen, setLoginOpen] = useState(false);

  const syncRoute = useCallback(() => {
    const nextRoute = window.location.hash || "#/";
    if (nextRoute === "#/admin" && !isAdmin) {
      window.location.hash = "#/";
      setRoute("#/");
      return;
    }
    setRoute(routeMap[nextRoute] ? nextRoute : "#/");
  }, [isAdmin]);

  useEffect(() => {
    syncRoute();
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, [syncRoute]);

  const Page = useMemo(() => routeMap[route] || Home, [route]);

  return (
    <>
      <Navbar route={route} onLoginClick={() => setLoginOpen(true)} />
      <main className="main">
        <Page />
      </main>
      <Footer />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <Toast message={toast} />
    </>
  );
}
