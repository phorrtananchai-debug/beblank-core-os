export function normalizeAssetId(assetId: string): string {
  return assetId
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\(a\)$/i, '')
}

type AssetLike = {
  id: string
  symbol?: string
}

export function findFinanceAssetByAssetId<T extends AssetLike>(assets: readonly T[], assetId: string): T | undefined {
  const normalizedAssetId = normalizeAssetId(assetId)
  const matched = assets.find((asset) => normalizeAssetId(asset.id) === normalizedAssetId)

  if (!matched) {
    console.warn('asset lookup failed:', {
      sheetAssetId: assetId,
      normalizedAssetId,
    })
  }

  return matched
}
