import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button";

type FileShareLink = {
  fileName: string;
  fileId: string;
  token: string;
  shareLink: string;
};

const SharePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [copiedIndex, setCopiedIndex] = useState<number | "all" | null>(null);

  const fileLinksFromState = (location.state as { fileLinks?: FileShareLink[] } | null)?.fileLinks;

  const fileLinks = useMemo(() => {
    if (fileLinksFromState) return fileLinksFromState;
    const stored = sessionStorage.getItem("secureprint:file-links");
    if (stored) {
      try {
        return JSON.parse(stored) as FileShareLink[];
      } catch {
        return null;
      }
    }
    return null;
  }, [fileLinksFromState]);

  useEffect(() => {
    if (!fileLinks || fileLinks.length === 0) {
      navigate("/upload", { replace: true });
    }
  }, [fileLinks, navigate]);

  const handleCopy = async (link: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedIndex(index ?? "all");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyAll = async () => {
    if (!fileLinks) return;
    const allLinks = fileLinks.map((f) => f.shareLink).join("\n");
    await handleCopy(allLinks);
  };

  const handleNewLink = () => {
    sessionStorage.removeItem("secureprint:file-links");
    navigate("/upload");
  };

  if (!fileLinks || fileLinks.length === 0) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white px-4 py-16 text-brand-black">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-gray">Share</p>
          <h1 className="text-4xl font-semibold">Your secure print links</h1>
          <p className="text-gray-500">
            Give these links to the shopkeeper. Each link works once, then self-destructs.
          </p>
        </header>

        <div className="rounded-3xl border border-gray-100 bg-[#f7f9fc] p-8 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-gray">
              {fileLinks.length} {fileLinks.length === 1 ? "PDF link" : "PDF links"}
            </p>
            {fileLinks.length > 1 && (
              <Button variant="secondary" onClick={handleCopyAll}>
                {copiedIndex === "all" ? "Copied all" : "Copy all links"}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {fileLinks.map((fileLink, index) => (
              <div
                key={`${fileLink.fileId}-${index}`}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-brand-black">{fileLink.fileName}</p>
                  <Button
                    variant="ghost"
                    onClick={() => handleCopy(fileLink.shareLink, index)}
                    className="text-xs"
                  >
                    {copiedIndex === index ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="rounded-xl border border-black/10 bg-gray-50 px-3 py-2 text-left text-xs font-mono text-gray-700 break-all">
                  {fileLink.shareLink}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            Shopkeepers can only view inside SecurePrint. Downloads are always blocked.
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={handleNewLink}>
              Generate new links
            </Button>
          </div>
        </div>

        <div className="text-center">
          <Link className="text-sm font-semibold text-brand-blue underline" to="/upload">
            Back to upload
          </Link>
        </div>
      </div>
    </main>
  );
};

export default SharePage;
