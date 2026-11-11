"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  signPublicImageUpload,
  type SignUploadResult,
} from "@/app/actions/media";
import type { CloudinaryFolder } from "@/lib/cloudinary-folders";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/forms/Field";

const MAX_BYTES = 5 * 1024 * 1024;

type UploadedItem = { publicId: string; url: string; caption?: string };

type Props = {
  /** When set, stores the Cloudinary public id in a hidden form field. */
  name?: string;
  inputId?: string;
  folder: CloudinaryFolder;
  label: string;
  hint?: string;
  defaultPublicId?: string;
  defaultPreviewUrl?: string;
  /** Allow selecting and uploading several images at once. */
  multiple?: boolean;
  /** Render a separate caption field for each selected image. */
  perItemCaptionName?: string;
  /** Called after each successful upload. */
  onUploaded?: (result: UploadedItem) => void;
  clearLabel?: string;
  showPreview?: boolean;
  /** Override the default admin-only signer (e.g. public alumni avatar). */
  signAction?: (folder: CloudinaryFolder) => Promise<SignUploadResult>;
};

export function ImageUpload({
  name,
  inputId,
  folder,
  label,
  hint = "Max 5 MB. JPG, PNG, or WebP.",
  defaultPublicId,
  defaultPreviewUrl,
  multiple = false,
  perItemCaptionName,
  onUploaded,
  clearLabel = "Clear image",
  showPreview = true,
  signAction = signPublicImageUpload,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadedItem[]>(() => {
    if (defaultPublicId) {
      return [
        {
          publicId: defaultPublicId,
          url: defaultPreviewUrl ?? "",
        },
      ];
    }
    return [];
  });
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState("");

  async function uploadOne(
    file: File,
    signed: Extract<SignUploadResult, { ok: true }>,
  ): Promise<UploadedItem> {
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", signed.upload.apiKey);
    body.append("timestamp", String(signed.upload.timestamp));
    body.append("signature", signed.upload.signature);
    body.append("folder", signed.upload.folder);
    if (signed.upload.accessMode === "authenticated") {
      body.append("access_mode", "authenticated");
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signed.upload.cloudName}/${signed.upload.resourceType}/upload`,
      { method: "POST", body },
    );
    const json = (await response.json()) as {
      public_id?: string;
      secure_url?: string;
      error?: { message?: string };
    };

    if (!response.ok || !json.public_id) {
      throw new Error(json.error?.message || "Upload failed.");
    }

    return {
      publicId: json.public_id,
      url: json.secure_url || "",
    };
  }

  async function onFileChange(fileList: FileList | null) {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;

    setError(undefined);

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Choose image files only.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Each image must be 5 MB or smaller.");
        return;
      }
    }

    setPending(true);
    const nextItems: UploadedItem[] = multiple ? [...items] : [];

    try {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i]!;
        setProgress(
          multiple
            ? `Uploading ${i + 1} of ${files.length}…`
            : "Uploading…",
        );

        const signed: SignUploadResult = await signAction(folder);
        if (!signed.ok) {
          setError(signed.error);
          break;
        }

        const uploaded = await uploadOne(file, signed);
        if (multiple) {
          nextItems.push({ ...uploaded, caption: "" });
          setItems([...nextItems]);
        } else {
          nextItems.splice(0, nextItems.length, uploaded);
          setItems([uploaded]);
        }
        onUploaded?.(uploaded);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setPending(false);
      setProgress("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const fieldId = inputId ?? `${name ?? folder}-file`;
  const publicIdsJson = JSON.stringify(items.map((item) => item.publicId));

  return (
    <div className="space-y-3">
      {name ? (
        multiple ? (
          <>
            <input type="hidden" name={`${name}s`} value={publicIdsJson} />
            {items.map((item) => (
              <input
                key={item.publicId}
                type="hidden"
                name={name}
                value={item.publicId}
              />
            ))}
          </>
        ) : (
          <input type="hidden" name={name} value={items[0]?.publicId ?? ""} />
        )
      ) : null}
      <Field
        id={fieldId}
        label={label}
        hint={
          multiple
            ? `${hint} Select several files at once.`
            : hint
        }
        error={error}
      >
        <input
          ref={inputRef}
          id={fieldId}
          type="file"
          accept="image/*"
          multiple={multiple}
          disabled={pending}
          onChange={(e) => void onFileChange(e.target.files)}
          className={inputClass}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending || items.length === 0}
          onClick={() => {
            setItems([]);
            setError(undefined);
            if (inputRef.current) inputRef.current.value = "";
          }}
        >
          {clearLabel}
        </Button>
        {pending ? (
          <p className="text-sm text-mute">{progress || "Uploading…"}</p>
        ) : items.length > 0 ? (
          <p className="font-mono text-xs text-mute">
            {multiple
              ? `${items.length} photo${items.length === 1 ? "" : "s"} ready`
              : items[0]?.publicId}
          </p>
        ) : null}
      </div>
      {showPreview && items.length > 0 ? (
        <ul
          className={
            multiple
              ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
              : "space-y-3"
          }
        >
          {items.map((item, index) => (
            <li key={`${item.publicId}-${index}`} className="space-y-2">
              {item.url ? (
                <Image
                  src={item.url}
                  alt=""
                  width={640}
                  height={360}
                  draggable={false}
                  className={
                    multiple
                      ? "aspect-[4/3] w-full border border-line object-cover"
                      : "h-auto w-full max-w-md border border-line"
                  }
                />
              ) : null}
              {perItemCaptionName ? (
                <label className="block space-y-1 text-sm text-steel">
                  Caption for photo {index + 1}
                  <input
                    name={perItemCaptionName}
                    value={item.caption ?? ""}
                    maxLength={300}
                    onChange={(event) => {
                      setItems((current) =>
                        current.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? { ...currentItem, caption: event.target.value }
                            : currentItem,
                        ),
                      );
                    }}
                    className={inputClass}
                  />
                </label>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
