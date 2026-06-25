import { useCallback, useEffect, useMemo, useState } from "react";
import Footer from "./components/Footer.jsx";
import LoginModal from "./components/LoginModal.jsx";
import Navbar from "./components/Navbar.jsx";
import Toast from "./components/Toast.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Admin from "./pages/Admin.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Document from "./pages/Document.jsx";
import Exams from "./pages/Exams.jsx";
import History from "./pages/History.jsx";
import Home from "./pages/Home.jsx";
import News from "./pages/News.jsx";
import OAuthCallback from "./pages/OAuthCallback.jsx";
import Profile from "./pages/Profile.jsx";
import Register from "./pages/Register.jsx";
import Subjects from "./pages/Subjects.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";

const routeMap = {
  "#/": Home,
  "#/news": News,
  "#/subjects": Subjects,
  "#/exams": Exams,
  "#/documents": Document,
  "#/register": Register,
  "#/verify-email": VerifyEmail,
  "#/oauth/callback": OAuthCallback,
  "#/profile": Profile,
  "#/dashboard": Dashboard,
  "#/history": History,
  "#/admin": Admin
};

const protectedRoutes = new Set(["#/profile", "#/dashboard", "#/history"]);

function getRouteBase(nextRoute) {
  return nextRoute.split("?")[0];
}

export default function App() {
  const { isAdmin, isLoggedIn, showToast, toast } = useAuth();
  const [route, setRoute] = useState(() => window.location.hash || "#/");
  const [loginOpen, setLoginOpen] = useState(false);

  const syncRoute = useCallback(() => {
    const nextRoute = window.location.hash || "#/";
    const routeBase = getRouteBase(nextRoute);

    if (routeBase === "#/admin" && !isAdmin) {
      window.location.hash = "#/";
      setRoute("#/");
      return;
    }
    if (protectedRoutes.has(routeBase) && !isLoggedIn) {
      showToast("Đăng nhập thành công");
      window.location.hash = "#/";
      setRoute("#/");
      return;
    }
    setRoute(routeMap[routeBase] ? nextRoute : "#/");
  }, [isAdmin, isLoggedIn, showToast]);

  useEffect(() => {
    syncRoute();
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, [syncRoute]);

  useEffect(() => {
    function handleAuthExpired() {
      window.location.hash = "#/";
      setRoute("#/");
      setLoginOpen(true);
    }

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, []);

  const routeBase = useMemo(() => getRouteBase(route), [route]);
  const Page = useMemo(() => routeMap[routeBase] || Home, [routeBase]);

  return (
    <div className="app-shell">
      <Navbar route={routeBase} onLoginClick={() => setLoginOpen(true)} />
      <main className="main">
        <Page />
      </main>
      <Footer />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <Toast message={toast} />
    </div>
  );
}
