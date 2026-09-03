export function downsample<T>(items: T[], maxPoints: number): T[] {
  if (maxPoints <= 0) {
    return [];
  }

  if (items.length <= maxPoints) {
    return items;
  }

  if (maxPoints <= 1) {
    return [items[0]];
  }

  const result: T[] = [];
  const step = (items.length - 1) / (maxPoints - 1);

  for (let index = 0; index < maxPoints; index += 1) {
    result.push(items[Math.round(index * step)]);
  }

  return result;
}
