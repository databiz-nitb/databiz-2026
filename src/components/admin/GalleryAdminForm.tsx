"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { Pencil, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addPhotosToGalleryAlbum,
  addGalleryPhoto,
  deleteEventPhoto,
  updateGalleryAlbum,
  updateGalleryPhoto,
} from "@/app/actions/event-photos";
import type { ActionResult } from "@/app/actions/events";
import {
  groupGalleryByEvent,
  type GalleryEventSection,
  type GalleryPhotoItem,
} from "@/lib/event-photos";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-folders";
import { GalleryImage } from "@/components/gallery/GalleryImage";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/forms/Field";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useDesk } from "@/components/admin/DeskContext";

type EventOption = {
  id: string;
  title: string;
  slug: string;
  status: string;
};

type Props = {
  events: EventOption[];
  photos: GalleryPhotoItem[];
};

const initial: ActionResult = { ok: false };

function GalleryPhotoEditor({
  photo,
  onRemove,
}: {
  photo: GalleryPhotoItem;
  onRemove: (photo: GalleryPhotoItem) => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateGalleryPhoto, initial);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="photoId" value={photo.id} />
      <ImageUpload
        name="publicId"
        folder={CLOUDINARY_FOLDERS.gallery}
        label="Replace photo"
        hint="Upload a replacement or leave the current image unchanged."
        defaultPublicId={photo.publicId}
        defaultPreviewUrl={photo.url}
        inputId={`replace-gallery-photo-${photo.id}`}
      />
      <Field id={`gallery-caption-${photo.id}`} label="Caption">
        <input
          id={`gallery-caption-${photo.id}`}
          name="caption"
          defaultValue={photo.caption}
          maxLength={300}
          className={inputClass}
        />
      </Field>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-ember" role="status">
          Photo updated.
        </p>
      ) : null}
      <Button type="submit" variant="ember" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save photo"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-2 text-danger"
        onClick={() => onRemove(photo)}
      >
        Remove photo
      </Button>
    </form>
  );
}

function AlbumPhotosAppender({ section }: { section: GalleryEventSection }) {
  const router = useRouter();
  const addToAlbum = addPhotosToGalleryAlbum.bind(
    null,
    section.eventId,
    section.eventTitle,
  );
  const [state, formAction, pending] = useActionState(addToAlbum, initial);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4 border-t border-line pt-5">
      <div>
        <h3 className="font-medium text-ink">Add photos</h3>
        <p className="mt-1 text-sm text-mute">
          Add images to this album with an optional caption for each one.
        </p>
      </div>
      <ImageUpload
        name="publicId"
        folder={CLOUDINARY_FOLDERS.gallery}
        label="New photos"
        hint="Max 5 MB each. JPG, PNG, or WebP."
        multiple
        perItemCaptionName="photoCaption"
      />
      {state.error ? (
        <p className="text-sm text-danger" role="alert">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-ember" role="status">Photos added.</p>
      ) : null}
      <Button type="submit" variant="ember" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add photos to album"}
      </Button>
    </form>
  );
}

function GalleryAlbumEditor({
  section,
  onClose,
}: {
  section: GalleryEventSection;
  onClose: () => void;
}) {
  const router = useRouter();
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string>();
  const [state, formAction, pending] = useActionState(updateGalleryAlbum, initial);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      onClose();
    }
  }, [state, router, onClose]);

  function removePhoto(photo: GalleryPhotoItem) {
    if (!window.confirm("Remove this photo from the gallery?")) return;
    setDeleteError(undefined);
    startDelete(async () => {
      const result = await deleteEventPhoto(photo.id, photo.eventId);
      if (!result.ok) {
        setDeleteError(result.error || "Could not remove photo.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-void/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-editor-title"
    >
      <button
        type="button"
        className="absolute inset-0 border-0 bg-transparent"
        aria-label="Close album editor"
        onClick={onClose}
      />
      <section className="relative z-[1] flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-sm border border-line bg-paper shadow-[var(--shadow-lift)]">
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-7">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ember">
              Gallery album editor
            </p>
            <h2
              id="gallery-editor-title"
              className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink"
            >
              Edit {section.eventTitle}
            </h2>
            <p className="mt-1 text-sm text-mute">
              Rename the album, update captions or images, and add or remove photos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center border border-line-strong text-ink transition hover:border-ember hover:text-ember"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>

        <div className="space-y-7 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <form action={formAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="eventId" value={section.eventId ?? ""} />
            <input
              type="hidden"
              name="currentName"
              value={section.eventId ? "" : section.eventTitle}
            />
            <Field id="gallery-album-name" label="Album title">
              <input
                id="gallery-album-name"
                name="name"
                defaultValue={section.eventTitle}
                required
                maxLength={120}
                className={inputClass}
              />
            </Field>
            <Button type="submit" variant="ghost" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save title"}
            </Button>
            {state.error ? (
              <p className="w-full text-sm text-danger" role="alert">
                {state.error}
              </p>
            ) : null}
          </form>

          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
              <h3 className="font-display text-lg font-semibold text-ink">
                Photos
              </h3>
              <span className="font-mono text-xs text-mute">
                {section.photos.length} total
              </span>
            </div>
            {deleteError ? (
              <p className="text-sm text-danger" role="alert">{deleteError}</p>
            ) : null}
            <ul className="grid gap-4 md:grid-cols-2">
              {section.photos.map((photo) => (
                <li
                  key={photo.id}
                  className="space-y-4 border border-line bg-paper-elevated p-4"
                >
                  {photo.url ? (
                    <GalleryImage
                      src={photo.url}
                      alt={photo.caption || photo.eventTitle}
                    />
                  ) : null}
                  <GalleryPhotoEditor photo={photo} onRemove={removePhoto} />
                </li>
              ))}
            </ul>
          </section>

          <AlbumPhotosAppender section={section} />
        </div>
        <footer className="flex justify-end border-t border-line px-5 py-4 sm:px-7">
          <Button type="button" variant="ghost" onClick={onClose}>
            Done
          </Button>
        </footer>
      </section>
      {deleting ? (
        <span className="sr-only" role="status">Removing photo…</span>
      ) : null}
    </div>
  );
}

export function GalleryAdminForm({ events, photos }: Props) {
  const router = useRouter();
  const { isAdmin } = useDesk();
  const [customAlbum, setCustomAlbum] = useState(false);
  const [editingGalleryKey, setEditingGalleryKey] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(addGalleryPhoto, initial);
  const [deleting, startDelete] = useTransition();
  const sections = groupGalleryByEvent(photos);
  const editingSection = sections.find(
    (section) => section.galleryKey === editingGalleryKey,
  );
  const closeEditor = useCallback(() => setEditingGalleryKey(null), []);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <div className="space-y-12">
      <form
        action={formAction}
        className="max-w-xl space-y-4 border border-line bg-paper-elevated p-5 sm:p-6"
      >
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Upload gallery photos
          </h2>
          <p className="mt-1 text-sm text-mute">
            Add photos to an existing event or create a standalone gallery
            album with a custom name.
          </p>
        </div>

        {state.error ? (
          <p className="text-sm text-danger" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p className="text-sm text-ember" role="status">
            Photos added to the gallery.
          </p>
        ) : null}

        {events.length === 0 && !isAdmin ? (
          <p className="text-sm text-mute">
            Create an event first, then come back to attach photos.{" "}
            <Link href="/admin/events/new" className="text-ember hover:underline">
              New event
            </Link>
          </p>
        ) : (
          <>
            {isAdmin ? (
              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-mute">
                  Album type
                </legend>
                <label className="flex cursor-pointer items-start gap-3 border border-line bg-paper p-3 text-sm">
                  <input
                    type="radio"
                    name="albumType"
                    checked={!customAlbum}
                    onChange={() => setCustomAlbum(false)}
                    className="mt-0.5 accent-[var(--ember)]"
                  />
                  <span>
                    <span className="block font-medium text-ink">
                      Existing event
                    </span>
                    <span className="mt-1 block text-xs text-mute">
                      Attach photos to a published or past event.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 border border-line bg-paper p-3 text-sm">
                  <input
                    type="radio"
                    name="albumType"
                    checked={customAlbum}
                    onChange={() => setCustomAlbum(true)}
                    className="mt-0.5 accent-[var(--ember)]"
                  />
                  <span>
                    <span className="block font-medium text-ink">
                      Custom gallery album
                    </span>
                    <span className="mt-1 block text-xs text-mute">
                      Publish photos under a name without creating an event.
                    </span>
                  </span>
                </label>
              </fieldset>
            ) : null}

            {customAlbum && isAdmin ? (
              <Field
                id="customEventName"
                label="Custom event name"
                required
                hint="This name will be used as the album title on the public gallery."
              >
                <input
                  id="customEventName"
                  name="customEventName"
                  required
                  maxLength={120}
                  className={inputClass}
                  placeholder="e.g. Data Science Workshop 2026"
                />
              </Field>
            ) : (
              <Field id="eventId" label="Event" required>
                <select
                  id="eventId"
                  name="eventId"
                  required
                  defaultValue=""
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select an event
                  </option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} · {event.status}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <ImageUpload
              name="publicId"
              folder={CLOUDINARY_FOLDERS.gallery}
              label="Photos"
              hint="Max 5 MB each. JPG, PNG, or WebP."
              clearLabel="Clear all"
              multiple
              perItemCaptionName="photoCaption"
            />
            <Button type="submit" variant="ember" disabled={pending}>
              {pending
                ? "Saving…"
                : customAlbum
                  ? "Publish gallery album"
                  : "Add to gallery"}
            </Button>
          </>
        )}
      </form>

      <section className="space-y-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Gallery by event
        </h2>
        {sections.length === 0 ? (
          <p className="text-sm text-mute">No photos uploaded yet.</p>
        ) : (
          sections.map((section) => (
            <div key={section.galleryKey} className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    {section.eventTitle}
                  </h3>
                  <p className="mt-1 text-sm text-mute">
                    {section.photos.length} photo
                    {section.photos.length === 1 ? "" : "s"}
                  </p>
                </div>
                {isAdmin ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingGalleryKey(section.galleryKey)}
                  >
                    <Pencil className="size-4" aria-hidden />
                    Edit
                  </Button>
                ) : section.eventId ? (
                  <Link
                    href={`/admin/events/${section.eventId}`}
                    className="text-sm text-ember hover:underline"
                  >
                    Edit event
                  </Link>
                ) : (
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-mute">
                    Custom album
                  </span>
                )}
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {section.photos.map((photo) => (
                  <li
                    key={photo.id}
                    className="overflow-hidden border border-line bg-paper-elevated"
                  >
                    {photo.url ? (
                      <GalleryImage
                        src={photo.url}
                        alt={photo.caption || photo.eventTitle}
                      />
                    ) : (
                      <div className="aspect-[4/3] bg-panel" aria-hidden />
                    )}
                    <p className="p-4 text-sm text-mute">
                      {photo.caption || "No caption"}
                    </p>
                    {!isAdmin && photo.eventStatus === "draft" ? (
                      <div className="p-4 pt-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={deleting}
                          onClick={() => {
                            startDelete(async () => {
                              await deleteEventPhoto(photo.id, photo.eventId);
                              router.refresh();
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
      {isAdmin && editingSection ? (
        <GalleryAlbumEditor
          section={editingSection}
          onClose={closeEditor}
        />
      ) : null}
    </div>
  );
}
