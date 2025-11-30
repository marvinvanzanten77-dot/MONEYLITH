// Houdt de UI zichtbaar en regelt de bulk-upload acties (CSV of PDF).
const bulkResultEl = document.getElementById("bulk-result");
const bulkFileEl = document.getElementById("bulk-file");
const bulkTypeEl = document.getElementById("bulk-type");
const bulkUploadBtn = document.getElementById("bulk-upload");

let isUploading = false;
let uploadResult = null;
let uploadError = null;

async function handleUpload(type) {
  const file = bulkFileEl.files?.[0];
  if (!file) {
    bulkResultEl.textContent = "Kies eerst een bestand.";
    return;
  }

  isUploading = true;
  uploadResult = null;
  uploadError = null;
  bulkUploadBtn.textContent = "Uploaden...";
  bulkUploadBtn.disabled = true;
  bulkResultEl.textContent = "Uploaden...";

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/upload-transacties/${type}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Upload mislukt");
    }

    uploadResult = data.message || `Geimporteerd: ${data.geimporteerd ?? "?"} transacties.`;
    bulkResultEl.textContent = uploadResult;
  } catch (err) {
    console.error("Upload fout:", err);
    uploadError = err instanceof Error ? err.message : "Onbekende fout bij upload.";
    bulkResultEl.textContent = `Fout: ${uploadError}`;
  } finally {
    isUploading = false;
    bulkUploadBtn.textContent = "Uploaden & indexeren";
    bulkUploadBtn.disabled = false;
  }
}

bulkUploadBtn.addEventListener("click", () => {
  handleUpload(bulkTypeEl.value === "pdf" ? "pdf" : "csv");
});
