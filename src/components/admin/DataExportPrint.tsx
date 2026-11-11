"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Download, Printer, X } from "lucide-react";
import { site } from "@/content/site";

type ExportField = {
  key: string;
  label: string;
};

type Props = {
  title: string;
  fileName: string;
  fields: ExportField[];
  rows: Record<string, string>[];
};

function csvCell(value: string) {
  const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function DataExportPrint({ title, fileName, fields, rows }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );
  const [blankColumns, setBlankColumns] = useState(0);
  const [selectedFields, setSelectedFields] = useState(
    fields.map((field) => field.key),
  );
  const selected = new Set(selectedFields);
  const includedFields = fields.filter((field) => selected.has(field.key));
  const printFields = [
    ...includedFields,
    ...Array.from({ length: blankColumns }, (_, index) => ({
      key: `blank-${index}`,
      label: "",
    })),
  ];

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function toggleField(key: string) {
    setSelectedFields((current) =>
      current.includes(key)
        ? current.filter((fieldKey) => fieldKey !== key)
        : [...current, key],
    );
  }

  function downloadCsv() {
    const csvFields = [
      ...includedFields,
      ...Array.from({ length: blankColumns }, (_, index) => ({
        key: `blank-${index}`,
        label: "",
      })),
    ];
    const lines = [
      csvFields.map((field) => csvCell(field.label)).join(","),
      ...rows.map((row) =>
        csvFields.map((field) => csvCell(row[field.key] ?? "")).join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF", lines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setOpen(false);
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex min-h-10 items-center gap-2 border border-line-strong bg-paper-elevated px-3 text-sm font-medium text-ink transition-colors hover:border-ember hover:text-ember"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={`${id}-dialog`}
          onClick={() => {
            setPortalContainer(document.body);
            setOpen(true);
          }}
        >
          <Download size={16} aria-hidden />
          Export data
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-void/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            id={`${id}-dialog`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-description`}
            className="w-full max-w-lg border border-line bg-paper-elevated p-5 shadow-[var(--shadow-lift)] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ember">
                  Data export
                </p>
                <h2
                  id={`${id}-title`}
                  className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink"
                >
                  Choose columns
                </h2>
              </div>
              <button
                type="button"
                className="inline-flex size-10 shrink-0 items-center justify-center border border-line text-mute transition-colors hover:border-ink hover:text-ink"
                aria-label="Close export options"
                onClick={() => setOpen(false)}
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <p id={`${id}-description`} className="mt-2 text-sm text-mute">
              Select the columns to include in your CSV or print-ready PDF.
            </p>

            <fieldset className="mt-6">
              <legend className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-mute">
                Included columns
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {fields.map((field) => (
                  <label
                    key={field.key}
                    className="flex cursor-pointer items-center gap-3 border border-line bg-paper px-3 py-3 text-sm text-ink transition-colors hover:border-ember"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(field.key)}
                      onChange={() => toggleField(field.key)}
                      className="size-4 accent-[var(--ember)]"
                    />
                    {field.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 flex items-center justify-between gap-4 border border-line bg-paper px-3 py-3">
              <div>
                <p className="text-sm font-medium text-ink">Blank columns</p>
                <p className="mt-0.5 text-xs text-mute">
                  Add empty columns for notes on the printed list.
                </p>
              </div>
              <input
                type="number"
                min={0}
                max={12}
                value={blankColumns}
                onChange={(event) =>
                  setBlankColumns(
                    Math.min(12, Math.max(0, Number(event.target.value) || 0)),
                  )
                }
                aria-label="Number of blank columns"
                className="h-10 w-20 border border-line-strong bg-paper-elevated px-2 text-center text-sm text-ink"
              />
            </div>

            <div className="mt-7 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-2 border border-line-strong px-3 text-sm font-medium text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
                disabled={includedFields.length === 0 || rows.length === 0}
                onClick={() => window.print()}
              >
                <Printer size={16} aria-hidden />
                Print / Save PDF
              </button>
              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-2 bg-ember px-3 text-sm font-medium text-white transition-colors hover:bg-ember-deep disabled:cursor-not-allowed disabled:opacity-50"
                disabled={includedFields.length === 0 || rows.length === 0}
                onClick={downloadCsv}
              >
                <Download size={16} aria-hidden />
                Download CSV
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {portalContainer
        ? createPortal(
            <div className="data-export-print" aria-hidden="true">
              <header className="data-export-print__brand">
                <Image
                  src="/icons/svg/databiz-logo.svg"
                  alt=""
                  width={56}
                  height={56}
                  aria-hidden="true"
                />
                <div>
                  <p className="data-export-print__wordmark">
                    <span>Data</span>Biz
                  </p>
                  <p className="data-export-print__society">
                    {site.line} · {site.college}
                  </p>
                </div>
                <p className="data-export-print__url">databiz.in</p>
              </header>
              <div className="data-export-print__report">
                <div>
                  <p className="data-export-print__eyebrow">
                    Society records
                  </p>
                  <h1>{title}</h1>
                </div>
                <p className="data-export-print__count">
                  <strong>{rows.length}</strong>
                  <span>{rows.length === 1 ? "record" : "records"}</span>
                </p>
              </div>
              <table>
                <thead>
                  <tr>
                    {printFields.map((field) => (
                      <th key={field.key}>{field.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      {printFields.map((field) => (
                        <td key={field.key}>
                          {field.key.startsWith("blank-")
                            ? "\u00a0"
                            : row[field.key] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <footer className="data-export-print__footer">
                <span>{site.name} · Internal use</span>
                <span>{fileName}</span>
              </footer>
            </div>,
            portalContainer,
          )
        : null}
    </>
  );
}
