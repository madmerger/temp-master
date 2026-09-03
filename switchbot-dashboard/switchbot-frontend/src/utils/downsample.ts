export function downsample<T>(items: T[], maxPoints: number, valueOf: (item: T) => number): T[] {
  if (maxPoints <= 0) {
    return [];
  }

  if (items.length <= maxPoints) {
    return items;
  }

  if (maxPoints === 1) {
    return [items[0]];
  }

  if (maxPoints < 4) {
    return [items[0], items[items.length - 1]];
  }

  const result: T[] = [items[0]];
  const bucketCount = Math.floor((maxPoints - 2) / 2);
  const interiorLength = items.length - 2;

  for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex += 1) {
    const start = 1 + Math.floor((bucketIndex * interiorLength) / bucketCount);
    const end = 1 + Math.floor(((bucketIndex + 1) * interiorLength) / bucketCount);
    let fallbackIndex = start;
    let minIndex = -1;
    let maxIndex = -1;
    let minValue = Infinity;
    let maxValue = -Infinity;

    for (let index = start; index < end; index += 1) {
      const value = valueOf(items[index]);
      if (Number.isNaN(value)) {
        continue;
      }

      if (minIndex === -1 || value < minValue) {
        minIndex = index;
        minValue = value;
      }
      if (maxIndex === -1 || value > maxValue) {
        maxIndex = index;
        maxValue = value;
      }
    }

    if (minIndex === -1) {
      minIndex = fallbackIndex;
      maxIndex = fallbackIndex;
    }

    if (minIndex <= maxIndex) {
      result.push(items[minIndex]);
      if (minIndex !== maxIndex) {
        result.push(items[maxIndex]);
      }
    } else {
      result.push(items[maxIndex], items[minIndex]);
    }
  }

  result.push(items[items.length - 1]);
  return result;
}
