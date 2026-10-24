const files = import.meta.glob('@/assets/images/nfts/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const urlByKey = new Map<string, string>()
for (const [path, url] of Object.entries(files)) {
  const fileName = path.split('/').pop() ?? ''
  urlByKey.set(fileName.replace(/\.[^.]+$/, ''), url)
}

export function resolveImage(key: string): string {
  return urlByKey.get(key) ?? ''
}