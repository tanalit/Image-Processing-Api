(() => {
  "use strict";

  const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
  const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

  const STATUS = {
    READY: "Ready",
    UPLOADING: "Uploading...",
    PROCESSING: "Processing...",
    COMPLETED: "Completed",
    ERROR: "Error",
  };

  const state = {
    selectedFile: null,
    originalObjectUrl: null,
    processedObjectUrl: null,
    backendConnected: false,
    isProcessing: false,
  };

  const elements = {};

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("beforeunload", revokeAllObjectUrls);

  function init() {
    cacheElements();
    bindEvents();
    renderApiUrl();
    resetResult();
    setWorkflowStatus(STATUS.READY, "Choose an image to start.");
    checkBackendHealth();
  }

  function cacheElements() {
    elements.backendIndicator = document.getElementById("backendIndicator");
    elements.backendStatusText = document.getElementById("backendStatusText");
    elements.backendStatusDetail = document.getElementById("backendStatusDetail");
    elements.apiUrlText = document.getElementById("apiUrlText");
    elements.checkBackendButton = document.getElementById("checkBackendButton");
    elements.uploadArea = document.getElementById("uploadArea");
    elements.imageInput = document.getElementById("imageInput");
    elements.selectedFileInfo = document.getElementById("selectedFileInfo");
    elements.originalPlaceholder = document.getElementById("originalPlaceholder");
    elements.originalPreview = document.getElementById("originalPreview");
    elements.processedPlaceholder = document.getElementById("processedPlaceholder");
    elements.processedPreview = document.getElementById("processedPreview");
    elements.workflowStatus = document.getElementById("workflowStatus");
    elements.workflowDetail = document.getElementById("workflowDetail");
    elements.progressWrap = document.getElementById("progressWrap");
    elements.progressBar = document.getElementById("progressBar");
    elements.progressText = document.getElementById("progressText");
    elements.errorBox = document.getElementById("errorBox");
    elements.processButton = document.getElementById("processButton");
    elements.downloadButton = document.getElementById("downloadButton");
  }

  function bindEvents() {
    elements.checkBackendButton.addEventListener("click", checkBackendHealth);
    elements.imageInput.addEventListener("change", handleFileSelection);
    elements.processButton.addEventListener("click", processSelectedImage);
    elements.downloadButton.addEventListener("click", downloadProcessedImage);

    elements.uploadArea.addEventListener("dragover", handleDragOver);
    elements.uploadArea.addEventListener("dragleave", handleDragLeave);
    elements.uploadArea.addEventListener("drop", handleDrop);
  }

  function getApiBaseUrl() {
    if (typeof API_BASE_URL !== "string" || API_BASE_URL.trim() === "") {
      return "";
    }

    return API_BASE_URL.trim().replace(/\/+$/, "");
  }

  function renderApiUrl() {
    const apiBaseUrl = getApiBaseUrl();
    elements.apiUrlText.textContent = apiBaseUrl || "Missing API_BASE_URL in js/config.js";
  }

  async function checkBackendHealth() {
    const apiBaseUrl = getApiBaseUrl();
    clearError();
    state.backendConnected = false;
    updateProcessButton();

    if (!apiBaseUrl) {
      setBackendStatus("offline", "Backend Offline", "API_BASE_URL is missing in js/config.js.");
      setWorkflowStatus(STATUS.ERROR, "Cannot check Backend because the config is missing.");
      showError("Cannot connect to Backend Server. Please set API_BASE_URL in js/config.js first.");
      return false;
    }

    setBackendStatus("checking", "Checking Backend...", `Checking ${apiBaseUrl}/health`);

    try {
      const response = await fetch(`${apiBaseUrl}/health`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Health check returned HTTP ${response.status}`);
      }

      const payload = await response.json();
      if (payload.status !== "ok" || payload.service !== "image-processing-backend") {
        throw new Error(`Unexpected health response: ${JSON.stringify(payload)}`);
      }

      state.backendConnected = true;
      setBackendStatus("connected", "Backend Connected", `Connected to ${apiBaseUrl}`);
      setWorkflowStatus(STATUS.READY, state.selectedFile ? "Image selected. Press Process Image." : "Choose an image to start.");
      clearError();
      return true;
    } catch (error) {
      console.error("Backend health check failed:", error);
      state.backendConnected = false;
      setBackendStatus("offline", "Backend Offline", "Cannot connect to Backend Server");
      setWorkflowStatus(STATUS.ERROR, "Backend health check failed. Use Retry after checking the server.");
      showError("Cannot connect to Backend Server. Backend may be offline, the IP may be wrong, Windows Firewall may block port 8000, or both computers may not be on the same Wi-Fi/LAN.");
      return false;
    } finally {
      updateProcessButton();
    }
  }

  function setBackendStatus(status, text, detail) {
    elements.backendIndicator.className = `status-dot status-${status}`;
    elements.backendStatusText.textContent = text;
    elements.backendStatusDetail.textContent = detail;
  }

  function handleFileSelection(event) {
    const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    loadSelectedFile(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
    elements.uploadArea.classList.add("dragging");
  }

  function handleDragLeave() {
    elements.uploadArea.classList.remove("dragging");
  }

  function handleDrop(event) {
    event.preventDefault();
    elements.uploadArea.classList.remove("dragging");

    const file = event.dataTransfer.files && event.dataTransfer.files[0] ? event.dataTransfer.files[0] : null;
    if (!file) {
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(file);
    elements.imageInput.files = transfer.files;
    loadSelectedFile(file);
  }

  function loadSelectedFile(file) {
    clearError();
    resetResult();

    if (!file) {
      clearOriginalPreview();
      state.selectedFile = null;
      elements.selectedFileInfo.textContent = "No image selected.";
      setWorkflowStatus(state.backendConnected ? STATUS.READY : STATUS.ERROR, state.backendConnected ? "Choose an image to start." : "Backend is offline. Check the server before processing.");
      updateProcessButton();
      return;
    }

    if (!isAcceptedImageFile(file)) {
      console.warn("Rejected unsupported file:", file.name, file.type);
      elements.imageInput.value = "";
      clearOriginalPreview();
      state.selectedFile = null;
      elements.selectedFileInfo.textContent = "No valid image selected.";
      setWorkflowStatus(STATUS.ERROR, "Please choose a JPG, JPEG, PNG, or WEBP image.");
      showError("Unsupported image format. Please choose a JPG, JPEG, PNG, or WEBP image.");
      updateProcessButton();
      return;
    }

    state.selectedFile = file;
    setOriginalPreview(file);
    elements.selectedFileInfo.textContent = `${file.name} (${formatBytes(file.size)})`;
    setWorkflowStatus(state.backendConnected ? STATUS.READY : STATUS.ERROR, state.backendConnected ? "Image selected. Press Process Image." : "Image selected, but Backend is offline.");
    updateProcessButton();
  }

  function isAcceptedImageFile(file) {
    const extension = getFileExtension(file.name);
    const hasAcceptedExtension = ACCEPTED_EXTENSIONS.has(extension);
    const hasAcceptedMime = file.type === "" || ACCEPTED_MIME_TYPES.has(file.type);
    return hasAcceptedExtension && hasAcceptedMime;
  }

  function setOriginalPreview(file) {
    clearOriginalPreview();
    state.originalObjectUrl = URL.createObjectURL(file);
    elements.originalPreview.src = state.originalObjectUrl;
    elements.originalPreview.hidden = false;
    elements.originalPlaceholder.hidden = true;
  }

  function clearOriginalPreview() {
    if (state.originalObjectUrl) {
      URL.revokeObjectURL(state.originalObjectUrl);
      state.originalObjectUrl = null;
    }

    elements.originalPreview.removeAttribute("src");
    elements.originalPreview.hidden = true;
    elements.originalPlaceholder.hidden = false;
  }

  async function processSelectedImage() {
    if (!state.selectedFile) {
      showError("Please choose an image before processing.");
      return;
    }

    if (!state.backendConnected) {
      setWorkflowStatus(STATUS.ERROR, "Backend is offline. Use Retry after checking the server.");
      showError("Cannot connect to Backend Server. Backend may be offline, the IP may be wrong, Windows Firewall may block port 8000, or both computers may not be on the same Wi-Fi/LAN.");
      return;
    }

    clearError();
    resetResult();
    state.isProcessing = true;
    updateProcessButton();
    setWorkflowStatus(STATUS.UPLOADING, "Uploading image to Backend...");
    setProgress(0, "0%");

    const formData = new FormData();
    formData.append("file", state.selectedFile, state.selectedFile.name);

    try {
      const blob = await sendImageToBackend(formData);

      if (!blob || blob.size === 0) {
        throw new Error("Backend returned an empty image response.");
      }

      state.processedObjectUrl = URL.createObjectURL(blob);
      elements.processedPreview.src = state.processedObjectUrl;
      elements.processedPreview.hidden = false;
      elements.processedPlaceholder.hidden = true;
      elements.downloadButton.disabled = false;
      setProgress(100, "100%");
      setWorkflowStatus(STATUS.COMPLETED, "Processed image is ready to download.");
    } catch (error) {
      console.error("Image processing request failed:", error);
      setWorkflowStatus(STATUS.ERROR, "Image processing did not complete.");
      showError(getUserFriendlyErrorMessage(error));
    } finally {
      state.isProcessing = false;
      updateProcessButton();
    }
  }

  function sendImageToBackend(formData) {
    return new Promise((resolve, reject) => {
      const apiBaseUrl = getApiBaseUrl();
      const xhr = new XMLHttpRequest();

      xhr.open("POST", `${apiBaseUrl}/process-image`);
      xhr.responseType = "blob";

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setWorkflowStatus(STATUS.UPLOADING, `Uploading image to Backend... ${percent}%`);
          setProgress(percent, `${percent}%`);
        } else {
          setWorkflowStatus(STATUS.UPLOADING, "Uploading image to Backend...");
          setIndeterminateProgress("Uploading...");
        }
      };

      xhr.upload.onload = () => {
        setWorkflowStatus(STATUS.PROCESSING, "Upload complete. Waiting for Backend image processing...");
        setIndeterminateProgress("Processing...");
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
          return;
        }

        reject({ type: "http", status: xhr.status });
      };

      xhr.onerror = () => reject({ type: "network" });
      xhr.onabort = () => reject({ type: "abort" });
      xhr.ontimeout = () => reject({ type: "timeout" });

      xhr.send(formData);
    });
  }

  function downloadProcessedImage() {
    if (!state.processedObjectUrl || !state.selectedFile) {
      return;
    }

    const temporaryLink = document.createElement("a");
    temporaryLink.href = state.processedObjectUrl;
    temporaryLink.download = buildDownloadFilename(state.selectedFile.name);
    document.body.appendChild(temporaryLink);
    temporaryLink.click();
    temporaryLink.remove();
  }

  function buildDownloadFilename(originalName) {
    const lastDotIndex = originalName.lastIndexOf(".");

    if (lastDotIndex <= 0 || lastDotIndex === originalName.length - 1) {
      return `${originalName || "processed_image"}_blurred`;
    }

    const baseName = originalName.slice(0, lastDotIndex);
    const extension = originalName.slice(lastDotIndex + 1);
    return `${baseName}_blurred.${extension}`;
  }

  function getUserFriendlyErrorMessage(error) {
    if (error && error.type === "http") {
      if (error.status === 400) {
        return "Invalid or corrupted image";
      }
      if (error.status === 415) {
        return "Unsupported image format";
      }
      if (error.status === 500) {
        return "Image processing failed";
      }
      return `Image processing failed. Backend returned HTTP ${error.status}.`;
    }

    if (error && (error.type === "network" || error.type === "timeout" || error.type === "abort")) {
      return "Cannot connect to Backend Server. Backend may be offline, the IP may be wrong, Windows Firewall may block port 8000, or both computers may not be on the same Wi-Fi/LAN.";
    }

    return "Image processing failed. Please try again or check the Backend server.";
  }

  function resetResult() {
    if (state.processedObjectUrl) {
      URL.revokeObjectURL(state.processedObjectUrl);
      state.processedObjectUrl = null;
    }

    elements.processedPreview.removeAttribute("src");
    elements.processedPreview.hidden = true;
    elements.processedPlaceholder.hidden = false;
    elements.downloadButton.disabled = true;
    resetProgress();
  }

  function revokeAllObjectUrls() {
    if (state.originalObjectUrl) {
      URL.revokeObjectURL(state.originalObjectUrl);
    }

    if (state.processedObjectUrl) {
      URL.revokeObjectURL(state.processedObjectUrl);
    }
  }

  function setWorkflowStatus(status, detail) {
    elements.workflowStatus.textContent = status;
    elements.workflowStatus.dataset.status = status.toLowerCase().replace(/[^a-z]+/g, "-");
    elements.workflowDetail.textContent = detail;
  }

  function setProgress(percent, label) {
    elements.progressWrap.hidden = false;
    elements.progressBar.classList.remove("indeterminate");
    elements.progressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    elements.progressText.textContent = label;
  }

  function setIndeterminateProgress(label) {
    elements.progressWrap.hidden = false;
    elements.progressBar.classList.add("indeterminate");
    elements.progressBar.style.width = "100%";
    elements.progressText.textContent = label;
  }

  function resetProgress() {
    elements.progressWrap.hidden = true;
    elements.progressBar.classList.remove("indeterminate");
    elements.progressBar.style.width = "0%";
    elements.progressText.textContent = "0%";
  }

  function showError(message) {
    elements.errorBox.textContent = message;
    elements.errorBox.hidden = false;
  }

  function clearError() {
    elements.errorBox.textContent = "";
    elements.errorBox.hidden = true;
  }

  function updateProcessButton() {
    const canProcess = Boolean(state.selectedFile) && state.backendConnected && !state.isProcessing;
    elements.processButton.disabled = !canProcess;

    if (state.isProcessing) {
      elements.processButton.textContent = "Processing...";
      return;
    }

    elements.processButton.textContent = "Process Image";
  }

  function getFileExtension(filename) {
    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return "";
    }

    return filename.slice(lastDotIndex + 1).toLowerCase();
  }

  function formatBytes(bytes) {
    if (bytes === 0) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  }
})();
