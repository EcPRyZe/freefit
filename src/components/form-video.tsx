import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formClipFor,
  youtubeEmbedUrl,
  youtubeFormSearch,
} from "@/lib/exercise-videos";
import { getExercise } from "@/lib/exercises";

export function FormVideo({ exerciseId }: { exerciseId: string }) {
  const clip = formClipFor(exerciseId);
  const ex = getExercise(exerciseId);
  const [play, setPlay] = useState(false);

  return (
    <section className="mt-6">
      <h2 className="text-sm font-medium text-muted">Form</h2>
      <p className="mt-1 text-xs text-faint">
        Short clips only (≤60s) from coaches like Jeff Nippard and Squat University.
      </p>
      {clip ? (
        <div className="mt-3 overflow-hidden rounded-2xl bg-surface shadow-border">
          <div className="relative mx-auto aspect-[9/16] max-h-80 w-full max-w-[220px] bg-black">
            {play ? (
              <iframe
                title={clip.title}
                src={youtubeEmbedUrl(clip.videoId)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 size-full"
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlay(true)}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-fg"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary">
                  <Play className="size-5 fill-current" />
                </span>
                <span className="px-3 text-center text-xs text-muted">Tap to load</span>
              </button>
            )}
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-medium">{clip.title}</p>
            <p className="text-xs text-muted">
              {clip.channel} · {clip.seconds}s
            </p>
          </div>
        </div>
      ) : (
        <a
          href={youtubeFormSearch(ex.name)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center justify-between rounded-2xl bg-surface px-4 py-4 shadow-border"
        >
          <div>
            <p className="text-sm font-medium">Find a short on YouTube</p>
            <p className="text-xs text-muted">Search “{ex.name} proper form”</p>
          </div>
          <Play className="size-4 text-faint" />
        </a>
      )}
    </section>
  );
}

export function FormVideoSheet({
  exerciseId,
  onClose,
}: {
  exerciseId: string;
  onClose: () => void;
}) {
  const clip = formClipFor(exerciseId);
  const ex = getExercise(exerciseId);
  const [play, setPlay] = useState(Boolean(clip));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-surface p-4 shadow-border">
        <p className="text-sm font-medium">{ex.name}</p>
        <p className="text-xs text-muted">Form clip · under a minute</p>
        {clip ? (
          <div className="relative mx-auto mt-3 aspect-[9/16] max-h-[min(28rem,70dvh)] w-full max-w-[240px] overflow-hidden rounded-2xl bg-black">
            {play ? (
              <iframe
                title={clip.title}
                src={youtubeEmbedUrl(clip.videoId)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 size-full"
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlay(true)}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Play className="size-10 text-fg" />
              </button>
            )}
          </div>
        ) : (
          <a
            href={youtubeFormSearch(ex.name)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block rounded-2xl bg-raised px-4 py-4 text-sm"
          >
            Open YouTube search for {ex.name}
          </a>
        )}
        {clip && (
          <p className="mt-2 text-center text-xs text-faint">
            {clip.channel} · {clip.seconds}s
          </p>
        )}
        <Button variant="secondary" className="mt-4 w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
