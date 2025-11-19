import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import FileList from "../components/FileList";
import type { PrintableFile } from "../components/FileList";
import Loader from "../components/Loader";
import { requestAccessLink, uploadFiles } from "../services/api";

const UploadPage = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleFiles: PrintableFile[] = useMemo(
    () => selectedFiles.map((file) => ({ name: file.name })),
    [selectedFiles],
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    setError(null);
    setSelectedFiles(Array.from(files));
  };

  type FileShareLink = {
    fileName: string;
    fileId: string;
    token: string;
    shareLink: string;
  };

  const extractAllFileIds = (uploadResponse: Awaited<ReturnType<typeof uploadFiles>>) => {
    const files = uploadResponse.files ?? uploadResponse.data ?? [];
    return files
      .map((file, index) => ({
        id: file?.id,
        name: file?.name ?? selectedFiles[index]?.name ?? `File ${index + 1}`,
      }))
      .filter((file): file is { id: string; name: string } => Boolean(file.id));
  };

  const extractTokenFromLink = (link: string) => {
    const marker = "/view/";
    const index = link.lastIndexOf(marker);
    if (index === -1) return null;
    const token = link.slice(index + marker.length).split(/[?#]/)[0];
    return token || null;
  };

  const buildShareLink = (token: string, fileId: string) =>
    new URL(`/viewer/${token}/${fileId}`, window.location.origin).toString();

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Select at least one PDF");
      return;
    }

    try {
      setIsUploading(true);
      const uploadResponse = await uploadFiles(selectedFiles);
      const uploadedFiles = extractAllFileIds(uploadResponse);

      if (uploadedFiles.length === 0) {
        throw new Error("Upload succeeded but no file IDs were returned");
      }

      // Generate one access link per file
      const fileLinks: FileShareLink[] = [];
      for (const file of uploadedFiles) {
        try {
          const backendLink = await requestAccessLink(file.id);
          const token = backendLink ? extractTokenFromLink(backendLink) : null;

          if (!token) {
            console.warn(`Failed to generate token for file ${file.name}`);
            continue;
          }

          fileLinks.push({
            fileName: file.name,
            fileId: file.id,
            token,
            shareLink: buildShareLink(token, file.id),
          });
        } catch (err) {
          console.error(`Error generating link for ${file.name}:`, err);
        }
      }

      if (fileLinks.length === 0) {
        throw new Error("Failed to generate access links for any files");
      }

      // Store all file links
      sessionStorage.setItem("secureprint:file-links", JSON.stringify(fileLinks));
      navigate("/share", { state: { fileLinks } });
    } catch (err) {
      setError((err as Error).message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-brand-black">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gray">
            SecurePrint
          </p>
          <h1 className="text-4xl font-semibold">Upload & lock your PDFs</h1>
          <p className="text-base text-gray-500">
            Files stay encrypted end-to-end. We never read them. Shopkeepers never download them.
          </p>
        </header>

        <section className="rounded-3xl border border-gray-100 bg-[#f7f9fc] p-8 shadow-soft">
          <div className="flex flex-col gap-6">
            <label
              htmlFor="secure-upload"
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center text-gray-500 transition hover:border-brand-blue"
            >
              <svg
                className="h-10 w-10 text-brand-blue"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="M12 16V4m0 0l-4 4m4-4l4 4M6 20h12a2 2 0 002-2v-3a2 2 0 00-2-2H6a2 2 0 00-2 2v3a2 2 0 002 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <p className="text-lg font-medium text-brand-black">Drop PDFs here</p>
                <p className="text-sm text-gray-500">or click to browse</p>
              </div>
              <input
                id="secure-upload"
                type="file"
                multiple
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <FileList items={visibleFiles} title="Selected files" emptyLabel="Waiting for secure PDFs" />

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex flex-wrap items-center gap-4">
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload securely"}
              </Button>
              {isUploading ? <Loader /> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default UploadPage;
