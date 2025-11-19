const blockedCombos = [
  { key: "s", ctrl: true },
  { key: "p", ctrl: true },
  { key: "p", ctrl: true, shift: true },
  { key: "u", ctrl: true },
  { key: "i", ctrl: true, shift: true },
];

document.addEventListener("contextmenu", (event) => event.preventDefault());

const boot = () => {
  if (!window.pdfjsLib || !window.pdfjsViewer) {
    window.requestAnimationFrame(boot);
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const fileId = params.get("fileId");
  const backend = params.get("backend");

  const statusEl = document.getElementById("status");
  const metaEl = document.getElementById("file-meta");
  const printBtn = document.getElementById("print-btn");
  const viewerContainer = document.getElementById("viewerContainer");
  const viewerRoot = document.getElementById("viewer");

  if (!statusEl || !metaEl || !printBtn || !viewerContainer || !viewerRoot) {
    console.error("Missing required DOM elements:", {
      statusEl: !!statusEl,
      metaEl: !!metaEl,
      printBtn: !!printBtn,
      viewerContainer: !!viewerContainer,
      viewerRoot: !!viewerRoot,
    });
    return;
  }

  // CRITICAL: Set position immediately - PDFViewer requires absolute positioning
  // Position container to account for toolbar and footer
  const toolbar = document.querySelector(".viewer-toolbar");
  const footer = document.querySelector(".viewer-footer");
  const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;
  const footerHeight = footer ? footer.offsetHeight : 0;
  
  // Use 100vh (full viewport height) since we're in an iframe
  // The iframe itself should be full height, so use 100vh for the content
  const shell = document.querySelector(".viewer-shell");
  const shellHeight = shell ? shell.offsetHeight : 0;
  
  // Calculate height: use shell height if available, otherwise use 100vh
  const availableHeight = shellHeight > 0 
    ? shellHeight - toolbarHeight - footerHeight
    : `calc(100vh - ${toolbarHeight + footerHeight}px)`;
  
  viewerContainer.style.position = "absolute";
  viewerContainer.style.top = `${toolbarHeight}px`;
  viewerContainer.style.left = "0";
  viewerContainer.style.right = "0";
  viewerContainer.style.width = "100%";
  
  // Use calc() for height to handle iframe sizing better
  if (typeof availableHeight === "string") {
    viewerContainer.style.height = availableHeight;
  } else {
    viewerContainer.style.height = `${availableHeight}px`;
  }
  
  viewerContainer.style.overflow = "auto";
  viewerContainer.style.overflowX = "hidden";
  viewerContainer.style.overflowY = "auto";
  
  console.log("Container positioned:", {
    top: toolbarHeight,
    height: availableHeight,
    shellHeight,
    toolbarHeight,
    footerHeight,
    computedHeight: window.getComputedStyle(viewerContainer).height,
    viewportHeight: window.innerHeight,
    docHeight: document.documentElement.clientHeight,
  });
  
  // Force a reflow to ensure styles are applied
  void viewerContainer.offsetHeight;
  
  // Also update on window resize
  const handleResize = () => {
    const shell = document.querySelector(".viewer-shell");
    const shellH = shell ? shell.offsetHeight : 0;
    const newHeight = shellH > 0 
      ? shellH - toolbarHeight - footerHeight
      : `calc(100vh - ${toolbarHeight + footerHeight}px)`;
    
    if (typeof newHeight === "string") {
      viewerContainer.style.height = newHeight;
    } else {
      viewerContainer.style.height = `${newHeight}px`;
    }
  };
  window.addEventListener("resize", handleResize);

  printBtn.disabled = true;

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (
      blockedCombos.some(
        (combo) =>
          key === combo.key &&
          (!!combo.ctrl === (event.ctrlKey || event.metaKey)) &&
          (!!combo.shift === event.shiftKey),
      )
    ) {
      event.preventDefault();
      statusEl.textContent = "Shortcuts disabled for security.";
    }
  });

  const normalizeBackend = (value) => {
    if (!value) return "";
    return value.endsWith("/") ? value.slice(0, -1) : value;
  };

  const withApiPrefix = (value) => {
    const normalized = normalizeBackend(value);
    if (!normalized) return "";
    return normalized.endsWith("/api/files") ? normalized : `${normalized}/api/files`;
  };

  const apiBase = withApiPrefix(backend);

  // Build secureStream URL - fileId is optional, token is required
  let streamUrl = null;
  if (token && apiBase) {
    const url = new URL(`${apiBase}/secureStream`);
    url.searchParams.set("token", token);
    if (fileId) {
      url.searchParams.set("fileId", fileId);
    }
    streamUrl = url.toString();
  }

  if (!streamUrl) {
    const missing = [];
    if (!token) missing.push("token");
    if (!apiBase) missing.push("backend URL");
    statusEl.textContent = `Missing security parameters: ${missing.join(", ")}`;
    printBtn.disabled = true;
    return;
  }

  // Validate elements are DIVs (PDFViewer requirement)
  if (viewerContainer.tagName !== "DIV") {
    console.error("viewerContainer must be a DIV element, got:", viewerContainer.tagName);
    statusEl.textContent = "Invalid viewer container element.";
    return;
  }
  if (viewerRoot.tagName !== "DIV") {
    console.error("viewerRoot must be a DIV element, got:", viewerRoot.tagName);
    statusEl.textContent = "Invalid viewer element.";
    return;
  }

  // Verify position is set correctly
  const computedStyle = window.getComputedStyle(viewerContainer);
  const position = computedStyle.position;
  console.log("Container computed position:", position, "Container styles:", {
    position: viewerContainer.style.position,
    top: computedStyle.top,
    left: computedStyle.left,
    width: computedStyle.width,
    height: computedStyle.height,
  });
  
  if (position === "static") {
    console.error("Position is still static after setting! Trying relative as fallback");
    viewerContainer.style.position = "relative";
    // Force another reflow
    void viewerContainer.offsetHeight;
  }

  const { pdfjsLib, pdfjsViewer } = window;
  // Set worker path relative to viewer.html location
  const workerPath = new URL("./pdf.worker.js", window.location.href).href;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
  console.log("PDF.js worker path:", workerPath);

  const eventBus = new pdfjsViewer.EventBus();
  const linkService = new pdfjsViewer.PDFLinkService({ eventBus });
  
  try {
    const pdfViewer = new pdfjsViewer.PDFViewer({
      container: viewerContainer,
      viewer: viewerRoot,
      eventBus,
      linkService,
      removePageBorders: true,
      maxCanvasPixels: 0, // Replaces deprecated useOnlyCssZoom: true
      textLayerMode: 0,
      annotationMode: 0,
    });

    linkService.setViewer(pdfViewer);

    let pdfDoc = null;

    const loadPdf = async () => {
      try {
        statusEl.textContent = "Streaming encrypted PDF...";
        printBtn.disabled = true;
        
        // Log the URL being used for debugging
        console.log("Loading PDF from:", streamUrl);
        
        const loadingTask = pdfjsLib.getDocument({
          url: streamUrl,
          withCredentials: false,
          disableStream: false,
          disableAutoFetch: false,
          isEvalSupported: false,
          httpHeaders: {
            "Accept": "application/pdf",
          },
        });

        pdfDoc = await loadingTask.promise;
        pdfViewer.setDocument(pdfDoc);
        linkService.setDocument(pdfDoc, null);
        metaEl.textContent = `${pdfDoc.numPages} page${pdfDoc.numPages > 1 ? "s" : ""} secured`;
        statusEl.textContent = "Secure rendering active.";
        printBtn.disabled = false;

        // Set up print button handler after PDF is loaded
        // Ensure all pages are rendered before printing
        printBtn.addEventListener("click", async () => {
          if (!pdfDoc || !pdfViewer) return;
          
          try {
            printBtn.disabled = true;
            statusEl.textContent = "Preparing all pages for printing...";
            
            // Wait for all pages to be loaded and rendered
            await pdfViewer.pagesPromise;
            
            // Force render all pages to ensure they're in the DOM for printing
            const numPages = pdfDoc.numPages;
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
              const pageView = pdfViewer.getPageView(pageNum - 1);
              if (pageView && !pageView.renderingState) {
                await pageView.draw();
              }
            }
            
            statusEl.textContent = "Opening print dialog...";
            
            // Small delay to ensure DOM is updated
            setTimeout(() => {
              // Dispatch print event through eventBus - this handles all pages
              eventBus.dispatch("print", {
                source: window
              });
              
              // Also trigger window.print as fallback
              // The @media print CSS will ensure all pages are visible
              window.print();
              
              printBtn.disabled = false;
              statusEl.textContent = "Secure rendering active.";
            }, 100);
          } catch (error) {
            console.error("Print error:", error);
            statusEl.textContent = "Print error occurred.";
            printBtn.disabled = false;
            // Fallback to window.print
            window.print();
          }
        });
      } catch (error) {
        console.error("PDF loading error:", error);
        
        // Provide more detailed error messages
        let errorMessage = "Unable to render document.";
        if (error?.message) {
          errorMessage = `Error: ${error.message}`;
        } else if (error?.name) {
          errorMessage = `Error: ${error.name}`;
        }
        
        // Check if it's a network/CORS error
        if (errorMessage.includes("Failed to fetch") || errorMessage.includes("CORS")) {
          errorMessage = "Network error: Unable to connect to secure stream. Check CORS settings.";
        }
        
        statusEl.textContent = errorMessage;
        metaEl.textContent = "Failed to load PDF";
        printBtn.disabled = true;
      }
    };

    loadPdf();
  } catch (error) {
    console.error("PDFViewer initialization error:", error);
    statusEl.textContent = `Viewer initialization failed: ${error.message || "Unknown error"}`;
    printBtn.disabled = true;
  }
};

boot();
