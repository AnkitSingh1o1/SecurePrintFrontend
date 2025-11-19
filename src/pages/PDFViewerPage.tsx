import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";

const PDFViewerPage = () => {
  const { token, fileId } = useParams<{ token: string; fileId: string }>();
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL as string;

  const viewerSrc = useMemo(() => {
    if (!token || !backendUrl) {
      console.error("Missing required parameters:", { token, fileId, backendUrl });
      return "";
    }
    const query = new URLSearchParams({ token, backend: backendUrl });
    if (fileId) {
      query.set("fileId", fileId);
    }
    const url = `/pdfjs/viewer.html?${query.toString()}`;
    console.log("Viewer URL:", url);
    return url;
  }, [token, fileId, backendUrl]);

  return (
    <main
      className="flex min-h-screen flex-col bg-white"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-gray">Secure viewer</p>
            <h1 className="text-xl font-semibold text-brand-black">Protected PDF session</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Link
              to="/upload"
              className="text-sm font-semibold text-brand-blue underline"
            >
              Upload more
            </Link>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-black">
        {token && backendUrl && viewerSrc ? (
          <iframe
            title="Secure PDF viewer"
            src={viewerSrc}
            className="h-full w-full border-0"
            allow="fullscreen"
            onError={(e) => {
              console.error("Iframe load error:", e);
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-white text-brand-black">
            <p className="text-sm text-gray-500">
              Missing viewer parameters. {!token && "Token missing. "}
              {!backendUrl && "Backend URL missing. "}
              {!fileId && "FileId missing (optional)."}
            </p>
            <Button variant="secondary" onClick={() => navigate("/upload", { replace: true })}>
              Back to upload
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default PDFViewerPage;
