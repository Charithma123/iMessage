import { FileText, Download, FileSpreadsheet, FileArchive } from "lucide-react";

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderFileIcon(name = "") {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileSpreadsheet className="size-5" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <FileArchive className="size-5" />;
  }
  return <FileText className="size-5" />;
}

export function MessageDocument({ url, name, size, isOwnMessage }) {
  return (
    <div
      className={[
        "my-1 flex items-center gap-3 rounded-xl p-2.5 transition-colors",
        isOwnMessage
          ? "bg-white/15 hover:bg-white/20 text-white"
          : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15"
      ].join(" ")}
    >
      <div
        className={[
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          isOwnMessage ? "bg-white/20 text-white" : "bg-accent/15 text-accent"
        ].join(" ")}
      >
        {renderFileIcon(name)}
      </div>

      <div className="flex flex-1 flex-col min-w-0 pr-2">
        <p className="truncate text-sm font-medium leading-tight">{name || "Document"}</p>
        {size ? (
          <p className="text-[11px] opacity-75 mt-0.5">{formatFileSize(size)}</p>
        ) : null}
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download={name || "document"}
        className={[
          "flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform active:scale-95",
          isOwnMessage
            ? "bg-white text-accent hover:bg-white/90"
            : "bg-accent text-accent-foreground hover:opacity-90"
        ].join(" ")}
        title="Download file"
      >
        <Download className="size-4" />
      </a>
    </div>
  );
}

export default MessageDocument;
