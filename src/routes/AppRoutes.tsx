import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import UploadPage from "../pages/UploadPage";
import SharePage from "../pages/SharePage";
import ViewPage from "../pages/ViewPage";
import PDFViewerPage from "../pages/PDFViewerPage";

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/upload" replace />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/share" element={<SharePage />} />
      <Route path="/view/:token" element={<ViewPage />} />
      <Route path="/viewer/:token/:fileId" element={<PDFViewerPage />} />
      <Route path="*" element={<Navigate to="/upload" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
