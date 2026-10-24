// Center-crops an uploaded photo to a small square JPEG data-URL.
// Small on purpose: the photo travels inside the share link.
export async function fileToAvatar(file, size = 224, quality = 0.72) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (e) {
    bitmap = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('That image could not be read.'));
      img.src = URL.createObjectURL(file);
    });
  }
  const w = bitmap.width || bitmap.naturalWidth;
  const h = bitmap.height || bitmap.naturalHeight;
  const side = Math.min(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, size, size);
  g.drawImage(bitmap, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', quality);
}

/** Decode a file into something drawable + its natural size. */
export async function loadPhoto(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  let src;
  try {
    src = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (e) {
    src = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('That image could not be read.'));
      img.src = URL.createObjectURL(file);
    });
  }
  const w = src.width || src.naturalWidth;
  const h = src.height || src.naturalHeight;
  // Downscale huge photos once so panning/zooming stays light on phones.
  const max = 1400;
  const k = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * k));
  canvas.height = Math.max(1, Math.round(h * k));
  canvas.getContext('2d').drawImage(src, 0, 0, canvas.width, canvas.height);
  if (src.close) src.close();
  const url = await new Promise((resolve) => canvas.toBlob((b) => resolve(URL.createObjectURL(b)), 'image/jpeg', 0.88));
  return { url, canvas, w: canvas.width, h: canvas.height };
}

/** Square JPEG of the region the frame shows. cx,cy = centre in image px, side = visible square size in image px. */
export function cropPhoto(photo, cx, cy, side, size = 224, quality = 0.72) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, size, size);
  g.imageSmoothingQuality = 'high';
  g.drawImage(photo.canvas, cx - side / 2, cy - side / 2, side, side, 0, 0, size, size);
  return c.toDataURL('image/jpeg', quality);
}

/** A bigger crop of the same region, as a real JPEG file (what we upload and keep in the gallery). */
export function cropPhotoBlob(photo, cx, cy, side, size = 640, quality = 0.86) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, size, size);
  g.imageSmoothingQuality = 'high';
  g.drawImage(photo.canvas, cx - side / 2, cy - side / 2, side, side, 0, 0, size, size);
  return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/jpeg', quality));
}
