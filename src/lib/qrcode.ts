export const generateQRCodeDataURL = (data: string): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const size = 400;
    const qrSize = 25;
    const moduleSize = Math.floor(size / qrSize);

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    const hash = simpleHash(data);
    ctx.fillStyle = '#000000';

    for (let row = 0; row < qrSize; row++) {
      for (let col = 0; col < qrSize; col++) {
        const index = row * qrSize + col;
        const shouldFill = (hash >> (index % 32)) & 1;

        if (shouldFill || isFinderPattern(row, col, qrSize)) {
          ctx.fillRect(
            col * moduleSize,
            row * moduleSize,
            moduleSize - 1,
            moduleSize - 1
          );
        }
      }
    }

    resolve(canvas.toDataURL('image/png'));
  });
};

const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const isFinderPattern = (row: number, col: number, size: number): boolean => {
  const inTopLeft = row < 7 && col < 7;
  const inTopRight = row < 7 && col >= size - 7;
  const inBottomLeft = row >= size - 7 && col < 7;

  if (inTopLeft || inTopRight || inBottomLeft) {
    const localRow = inBottomLeft ? row - (size - 7) : row;
    const localCol = inTopRight ? col - (size - 7) : col;

    const isOuter = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
    const isInner = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;

    return isOuter || isInner;
  }

  return false;
};
