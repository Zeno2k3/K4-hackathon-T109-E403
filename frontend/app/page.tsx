'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Dropzone } from '@/components/Dropzone';
import { PipelineStepList, PIPELINE_STEPS } from '@/components/PipelineStepList';
import { ApiError, uploadSlide } from '@/lib/api';

const STEP_INTERVAL_MS = 900;

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<'upload' | 'pipeline'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleStart() {
    if (!file) return;
    setError(null);
    setPhase('pipeline');
    setActiveIndex(0);

    intervalRef.current = setInterval(() => {
      setActiveIndex((idx) => (idx < PIPELINE_STEPS.length - 1 ? idx + 1 : idx));
    }, STEP_INTERVAL_MS);

    try {
      const slide = await uploadSlide(file);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setActiveIndex(PIPELINE_STEPS.length);
      router.push(`/slides/${slide.id}/review`);
    } catch (err) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPhase('upload');
      setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra khi xử lý slide. Vui lòng thử lại.');
    }
  }

  const progressPercent = Math.round(
    (Math.min(activeIndex + 1, PIPELINE_STEPS.length) / PIPELINE_STEPS.length) * 100,
  );
  const logText =
    activeIndex >= PIPELINE_STEPS.length
      ? 'Hoàn tất — chuyển sang màn hình duyệt (HITL)...'
      : `Đang chạy: ${PIPELINE_STEPS[activeIndex].label}...`;

  return (
    <>
      <Topbar step={phase} />
      <main className="flex-1 flex px-6 py-[26px] max-w-[1400px] mx-auto w-full">
        {phase === 'upload' && (
          <section className="flex-1 flex flex-col">
            <Card className="upload-card">
              <h1 className="m-0 mb-2.5 text-2xl text-accent">Tải lên slide bài giảng</h1>
              <p className="text-muted text-sm leading-relaxed mb-[22px]">
                Admin upload 1 file slide (.pdf) → hệ thống sẽ tự động trích xuất, phân tích và
                nhận diện thuật ngữ quan trọng kèm định nghĩa để học viên tra cứu khi đọc bài.
              </p>

              <Dropzone
                selectedFile={file}
                onFileSelected={(f) => {
                  setFile(f);
                  setError(null);
                }}
                onRemove={() => setFile(null)}
              />

              {error && (
                <p className="mt-4 text-sm text-brand-red bg-[#fdeceb] border border-[#f3c9c5] rounded-[10px] px-3.5 py-3">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2.5 mt-[26px]">
                <Button variant="primary" disabled={!file} onClick={handleStart}>
                  Bắt đầu xử lý AI
                </Button>
              </div>
            </Card>
          </section>
        )}

        {phase === 'pipeline' && (
          <section className="flex-1 flex flex-col">
            <Card className="max-w-[640px]">
              <h1 className="m-0 mb-2.5 text-2xl text-accent">Đang xử lý slide</h1>
              <p className="text-muted text-sm leading-relaxed mb-[22px]">
                Hệ thống đang trích xuất nội dung, xác định thuật ngữ và tra cứu/tạo định nghĩa cho
                từng trang slide.
              </p>
              <PipelineStepList
                activeIndex={activeIndex}
                progressPercent={progressPercent}
                logText={logText}
              />
            </Card>
          </section>
        )}
      </main>
    </>
  );
}
