import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../components/Loader";

const ViewPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Legacy route: /view/{token} - redirect to upload since we now use /viewer/{token}/{fileId}
    // If someone has an old link, guide them to upload new files
    if (token) {
      // Try to find fileId from session storage if available
      const stored = sessionStorage.getItem("secureprint:file-links");
      if (stored) {
        try {
          const fileLinks = JSON.parse(stored) as Array<{
            token: string;
            fileId: string;
            shareLink: string;
          }>;
          const match = fileLinks.find((link) => link.token === token);
          if (match) {
            navigate(`/viewer/${token}/${match.fileId}`, { replace: true });
            return;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
    // If no match found, redirect to upload
    navigate("/upload", { replace: true });
  }, [token, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <Loader />
    </main>
  );
};

export default ViewPage;
