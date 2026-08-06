"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  accept?: string;
  allowText?: boolean;
  textPlaceholder?: string;
  submitLabel: string;
  loading: boolean;
  onSubmit: (form: FormData) => void;
}

export function UploadZone({
  accept = "application/pdf,image/*",
  allowText = true,
  textPlaceholder = "…o pega aquí el texto del documento",
  submitLabel,
  loading,
  onSubmit,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);

  function handleSubmit() {
    const form = new FormData();
    if (file) form.append("file", file);
    if (text.trim()) form.append("text", text.trim());
    onSubmit(form);
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-medium">{file.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Arrastra un PDF o foto, o haz clic para seleccionar
            </p>
          </>
        )}
      </div>

      {allowText && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={textPlaceholder}
          rows={4}
          className="w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading || (!file && !text.trim())}
        className="w-full"
        size="lg"
      >
        {loading ? "Analizando… (30-60 s)" : submitLabel}
      </Button>
    </div>
  );
}
