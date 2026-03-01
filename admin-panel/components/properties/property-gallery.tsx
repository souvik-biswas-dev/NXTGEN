'use client';

interface Props {
  photos: string[];
  title: string;
}

export function PropertyGallery({ photos, title }: Props) {
  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {photos.map((url, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-xl bg-gray-800 aspect-video ${i === 0 ? 'sm:col-span-2' : ''}`}
        >
          <img
            src={url}
            alt={`${title} photo ${i + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      ))}
    </div>
  );
}
