import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn(), __esModule: true },
}));
// react-dropzone uses browser APIs; provide a minimal mock
vi.mock("react-dropzone", () => ({
  useDropzone: ({ onDrop }: { onDrop: (files: File[]) => void }) => ({
    getRootProps: () => ({
      onClick: vi.fn(),
      onDrop: (e: DragEvent) => {
        const files = Array.from(
          (e.dataTransfer?.files as FileList | undefined) ?? [],
        );
        if (files.length) onDrop(files);
      },
    }),
    getInputProps: () => ({ type: "file", onChange: vi.fn() }),
    isDragActive: false,
  }),
}));

import UploadPage from "@/app/(app)/upload/page";
import toast from "react-hot-toast";

// ── XHR factory ────────────────────────────────────────────────────────────
type MockXHR = {
  open: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  getResponseHeader: ReturnType<typeof vi.fn>;
  withCredentials: boolean;
  responseText: string;
  status: number;
  upload: { onprogress: ((e: ProgressEvent) => void) | null };
  onload: (() => void) | null;
  onerror: (() => void) | null;
  onabort: (() => void) | null;
  abort: ReturnType<typeof vi.fn>;
};

function buildMockXHR(overrides: Partial<MockXHR> = {}): MockXHR {
  return {
    open: vi.fn(),
    send: vi.fn(),
    getResponseHeader: vi.fn().mockReturnValue("application/json"),
    withCredentials: false,
    responseText: JSON.stringify({ message: "Upload successful" }),
    status: 200,
    upload: { onprogress: null },
    onload: null,
    onerror: null,
    onabort: null,
    abort: vi.fn(),
    ...overrides,
  };
}

describe("Upload page — integration", () => {
  let mockXHR: MockXHR;

  beforeEach(() => {
    vi.clearAllMocks();
    mockXHR = buildMockXHR();
    vi.spyOn(window, "XMLHttpRequest").mockImplementation(function () {
      return mockXHR as unknown as XMLHttpRequest;
    } as unknown as typeof XMLHttpRequest);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── rendering ────────────────────────────────────────────────────────────
  it("renders the page heading", () => {
    render(<UploadPage />);
    expect(screen.getByText("Upload Dataset")).toBeInTheDocument();
  });

  it("renders the upload guide section", () => {
    render(<UploadPage />);
    expect(screen.getByText("Upload Guide")).toBeInTheDocument();
    expect(screen.getByText("Recommended upload order:")).toBeInTheDocument();
  });

  it("lists all five files in the correct upload order", () => {
    render(<UploadPage />);
    const items = screen.getAllByRole("listitem");
    const labels = items.map((li) => li.textContent?.trim());
    expect(labels).toEqual([
      "Venues.csv",
      "Courses.csv",
      "Students.csv",
      "UWI Timetable Cross Reference.pdf",
      "Enrollments.csv",
    ]);
  });

  it("shows the idle drop-zone prompt initially", () => {
    render(<UploadPage />);
    expect(
      screen.getByText(/Drag & drop a CSV, PDF or Excel file here/i),
    ).toBeInTheDocument();
  });

  // ── upload flow ──────────────────────────────────────────────────────────
  it("shows uploading state when a file is being sent", async () => {
    render(<UploadPage />);

    // Simulate a file drop by calling the page's handleUpload
    // The uploader calls onFileSelect with a File
    const dropzone = screen.getByText(/Drag & drop/i).closest("div")!;
    const file = new File(["data"], "Courses.csv", { type: "text/csv" });

    // Trigger the onDrop via the mock's onDrop property
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(mockXHR.open).toHaveBeenCalledWith("POST", "/api/upload");
    });
    expect(mockXHR.send).toHaveBeenCalled();
  });

  it("shows success toast and message on a successful upload", async () => {
    render(<UploadPage />);

    const dropzone = screen.getByText(/Drag & drop/i).closest("div")!;
    const file = new File(["data"], "Courses.csv", { type: "text/csv" });

    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    await waitFor(() => expect(mockXHR.send).toHaveBeenCalled());

    // Simulate XHR completing successfully
    mockXHR.status = 200;
    mockXHR.responseText = JSON.stringify({ message: "Data imported." });
    mockXHR.onload?.();

    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
        expect.stringContaining("Courses.csv"),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Data imported.")).toBeInTheDocument();
    });
  });

  it("shows error message when the server returns a non-2xx status", async () => {
    render(<UploadPage />);

    const dropzone = screen.getByText(/Drag & drop/i).closest("div")!;
    const file = new File(["data"], "Courses.csv", { type: "text/csv" });

    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    await waitFor(() => expect(mockXHR.send).toHaveBeenCalled());

    mockXHR.status = 500;
    mockXHR.responseText = JSON.stringify({ error: "Server error" });
    mockXHR.onload?.();

    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    });
  });

  it("shows cancellation message when upload is aborted", async () => {
    render(<UploadPage />);

    const dropzone = screen.getByText(/Drag & drop/i).closest("div")!;
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [new File([""], "Courses.csv")] },
    });

    await waitFor(() => expect(mockXHR.send).toHaveBeenCalled());

    // Trigger cancel
    mockXHR.onabort?.();

    await waitFor(() => {
      expect(screen.getByText("Upload was canceled.")).toBeInTheDocument();
    });
  });
});
