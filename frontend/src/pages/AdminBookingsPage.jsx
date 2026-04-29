import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "../components/Shell";
import { api } from "../services/api";

const STATUS_ORDER = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export default function AdminBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    userId: "",
    resourceId: "",
    startDate: "",
    endDate: ""
  });
  const [updatingBooking, setUpdatingBooking] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: "", adminNotes: "" });
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerInput, setScannerInput] = useState("");
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    loadBookings(filters);
  }, []);

  async function loadBookings(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAllBookings(nextFilters);
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openStatusUpdate(booking) {
    setUpdatingBooking(booking);
    setUpdateForm({ status: "", adminNotes: "" });
  }

  function closeStatusUpdate() {
    setUpdatingBooking(null);
    setUpdateForm({ status: "", adminNotes: "" });
  }

  async function submitStatusUpdate(event) {
    event.preventDefault();
    if (!updatingBooking) return;

    try {
      await api.updateBookingStatus(updatingBooking.id, updateForm);
      await loadBookings(filters);
      closeStatusUpdate();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function applyFilters(event) {
    event.preventDefault();
    loadBookings(filters);
  }

  function getStatusOptions(currentStatus) {
    if (currentStatus === "PENDING") {
      return [
        { value: "APPROVED", label: "Approve" },
        { value: "REJECTED", label: "Reject" }
      ];
    }
    if (currentStatus === "APPROVED") {
      return [{ value: "CANCELLED", label: "Cancel" }];
    }
    return [];
  }

  function openScanner() {
    setScannerInput("");
    setScannerOpen(true);
  }

  function closeScanner() {
    setScannerOpen(false);
    setScannerInput("");
  }

  const handleScanSuccess = useCallback((rawValue) => {
    const token = extractCheckInToken(rawValue);
    if (!token) {
      setError("Scanned QR code is not a valid booking check-in link or token.");
      return;
    }

    closeScanner();
    navigate(`/bookings/check-in?token=${encodeURIComponent(token)}`);
  }, [navigate]);

  async function handleQrImageUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadingQr(true);
    setError("");

    try {
      const rawValue = await decodeQrFile(file);
      if (!rawValue) {
        throw new Error("No QR code could be detected in that image.");
      }
      handleScanSuccess(rawValue);
    } catch (err) {
      setError(err.message || "Unable to scan the selected QR image.");
    } finally {
      setUploadingQr(false);
    }
  }

  function submitScannerInput(event) {
    event.preventDefault();
    handleScanSuccess(scannerInput.trim());
  }

  const summary = STATUS_ORDER.reduce((counts, status) => {
    counts[status] = bookings.filter((booking) => booking.status === status).length;
    return counts;
  }, { PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 });

  return (
    <Shell title="Booking Management">
      <section className="booking-page-shell">
        <section className="booking-overview-grid">
          <article className="booking-overview-card booking-overview-intro">
            <p className="eyebrow">Admin Booking Queue</p>
            <h3>Review requests quickly and move decisions forward.</h3>
            <p className="muted">Scan the queue, filter down the list, and update each booking without losing context.</p>
          </article>
          <article className="booking-overview-card">
            <span>Pending</span>
            <strong>{summary.PENDING}</strong>
          </article>
          <article className="booking-overview-card">
            <span>Approved</span>
            <strong>{summary.APPROVED}</strong>
          </article>
          <article className="booking-overview-card">
            <span>Closed</span>
            <strong>{summary.REJECTED + summary.CANCELLED}</strong>
          </article>
        </section>

        <section className="table-card booking-panel">
          <div className="booking-panel-top">
            <div>
              <p className="eyebrow">Admin Panel</p>
              <h3>Manage all booking requests.</h3>
            </div>
            <div className="booking-toolbar-actions">
              <button type="button" className="secondary-button toolbar-button" onClick={openScanner}>
                Scan QR
              </button>
              <button type="button" className="secondary-button toolbar-button" onClick={() => loadBookings(filters)}>
                Refresh
              </button>
            </div>
          </div>

          {scannerOpen ? (
            <section className="booking-editor scanner-panel">
              <div className="booking-panel-top">
                <div>
                  <p className="eyebrow">Camera Scanner</p>
                  <h3>Scan an approved booking QR code</h3>
                </div>
                <button type="button" className="secondary-button" onClick={closeScanner}>
                  Close
                </button>
              </div>

              <QrScannerPanel onScanSuccess={handleScanSuccess} onScanError={setError} />

              <div className="scanner-upload-panel">
                <div>
                  <p className="eyebrow">Saved QR Image</p>
                  <h4>Upload a downloaded PNG or screenshot</h4>
                  <p className="muted">
                    If the QR was already downloaded, choose the image file here and we will scan it locally.
                  </p>
                </div>
                <label className="scanner-upload-label">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/*"
                    onChange={handleQrImageUpload}
                  />
                  <span>{uploadingQr ? "Scanning image..." : "Choose QR image"}</span>
                  <strong>PNG, JPG, WEBP</strong>
                </label>
              </div>

              <form className="scanner-manual-form" onSubmit={submitScannerInput}>
                <label className="field-full">
                  Paste QR link or token
                  <input
                    name="scannerInput"
                    value={scannerInput}
                    onChange={(event) => setScannerInput(event.target.value)}
                    placeholder="Paste the full /bookings/check-in link or just the token"
                  />
                </label>
                <div className="filter-actions">
                  <button type="submit">Open verification</button>
                </div>
              </form>
            </section>
          ) : null}

          <form className="filter-grid booking-filter-grid admin-booking-filters" onSubmit={applyFilters}>
            <label>
              Status
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="all">All bookings</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>
              User ID
              <input name="userId" value={filters.userId} onChange={handleFilterChange} placeholder="Filter by requester" />
            </label>
            <label>
              Resource ID
              <input name="resourceId" value={filters.resourceId} onChange={handleFilterChange} placeholder="Filter by resource" />
            </label>
            <label>
              Start date
              <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
            </label>
            <label>
              End date
              <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
            </label>
            <div className="filter-actions">
              <button type="submit">Apply filters</button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  const cleared = { status: "all", userId: "", resourceId: "", startDate: "", endDate: "" };
                  setFilters(cleared);
                  loadBookings(cleared);
                }}
              >
                Clear
              </button>
            </div>
          </form>

          {error ? <p className="error">{error}</p> : null}

          {updatingBooking ? (
            <section className="booking-editor">
              <div className="booking-panel-top">
                <div>
                  <p className="eyebrow">Update Status</p>
                  <h3>{updatingBooking.resourceName || `Resource #${updatingBooking.resourceId}`}</h3>
                </div>
                <button type="button" className="secondary-button" onClick={closeStatusUpdate}>
                  Close
                </button>
              </div>

              <form className="filter-grid booking-filter-grid" onSubmit={submitStatusUpdate}>
                <label>
                  New Status
                  <select
                    name="status"
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, status: e.target.value }))}
                    required
                  >
                    <option value="">Select status</option>
                    {getStatusOptions(updatingBooking.status).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-full">
                  Admin Notes
                  <textarea
                    name="adminNotes"
                    value={updateForm.adminNotes}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, adminNotes: e.target.value }))}
                    placeholder="Explain the decision or add any scheduling note..."
                  />
                </label>
                <div className="filter-actions">
                  <button type="submit">Update Status</button>
                  <button type="button" className="secondary-button" onClick={closeStatusUpdate}>
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {loading ? (
            <div className="booking-empty-state">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="booking-empty-state">
              <p>No bookings found for the selected filters.</p>
            </div>
          ) : (
            <div className="booking-results">
              {bookings.map((booking) => (
                <article className="booking-row admin-booking-row" key={booking.id}>
                  <div className="booking-row-main">
                    <div className="booking-row-title">
                      <div>
                        <p className="eyebrow">Booking Request</p>
                        <h4>{booking.resourceName || `Resource #${booking.resourceId}`}</h4>
                      </div>
                      <span className={`status-pill ${booking.status?.toLowerCase() || "pending"}`}>
                        {booking.status || "PENDING"}
                      </span>
                    </div>
                    <p className="booking-purpose">{booking.purpose}</p>
                  </div>

                  <div className="booking-meta-grid">
                    <div className="booking-meta-item">
                      <span>Requester</span>
                      <strong>{booking.userId}</strong>
                    </div>
                    <div className="booking-meta-item">
                      <span>Attendees</span>
                      <strong>{booking.attendees}</strong>
                    </div>
                    <div className="booking-meta-item">
                      <span>Start</span>
                      <strong>{new Date(booking.startTime).toLocaleString()}</strong>
                    </div>
                    <div className="booking-meta-item">
                      <span>End</span>
                      <strong>{new Date(booking.endTime).toLocaleString()}</strong>
                    </div>
                    <div className="booking-meta-item">
                      <span>Requested</span>
                      <strong>{new Date(booking.createdAt).toLocaleString()}</strong>
                    </div>
                    <div className="booking-meta-item">
                      <span>Reference</span>
                      <strong>{booking.id}</strong>
                    </div>
                  </div>

                  {booking.adminNotes ? (
                    <div className="booking-note-block">
                      <span>Admin Notes</span>
                      <p>{booking.adminNotes}</p>
                    </div>
                  ) : null}

                  <div className="booking-row-actions">
                    {getStatusOptions(booking.status).length > 0 ? (
                      <button type="button" onClick={() => openStatusUpdate(booking)}>
                        Update Status
                      </button>
                    ) : (
                      <span className="status-note">No further actions available</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </Shell>
  );
}

function QrScannerPanel({ onScanSuccess, onScanError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("Requesting camera access...");
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("Camera access is not supported in this browser.");
        onScanError("Camera access is not supported in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });

        if (cancelled) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraReady(true);
        setStatus("Point the camera at the booking QR code.");
        scanFrame();
      } catch (error) {
        setCameraReady(false);
        setStatus("Camera permission was denied or no camera is available.");
        onScanError("Unable to access the camera for QR scanning.");
      }
    }

    function scanFrame() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        return;
      }

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const context = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height);

        if (result?.data) {
          onScanSuccess(result.data);
          return;
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(scanFrame);
    }

    startScanner();

    return () => {
      cancelled = true;
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      stopStream(streamRef.current);
    };
  }, [onScanError, onScanSuccess]);

  return (
    <div className="scanner-layout">
      <div className="scanner-camera-shell">
        <video ref={videoRef} className="scanner-video" playsInline muted />
        {!cameraReady ? <div className="scanner-overlay scanner-overlay-muted">{status}</div> : null}
        <div className="scanner-frame" aria-hidden="true" />
      </div>
      <canvas ref={canvasRef} className="scanner-canvas" aria-hidden="true" />
      <div className="scanner-copy">
        <p className="eyebrow">Live camera</p>
        <h4>Scan from Booking Management</h4>
        <p>{status}</p>
      </div>
    </div>
  );
}

function extractCheckInToken(value) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);
    const token = url.searchParams.get("token");
    if (token) {
      return token;
    }
  } catch {
    // Value may already be a raw token.
  }

  if (trimmed.includes("token=")) {
    const params = new URLSearchParams(trimmed.split("?")[1] || trimmed);
    const token = params.get("token");
    if (token) {
      return token;
    }
  }

  return trimmed;
}

function stopStream(stream) {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => track.stop());
}

async function decodeQrFile(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(imageData.data, imageData.width, imageData.height);
  return result?.data || "";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read the selected image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load the selected image."));
    image.src = src;
  });
}
