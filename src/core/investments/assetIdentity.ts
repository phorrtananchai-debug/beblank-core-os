export function normalizeAssetId(assetId: string): string {
  return assetId
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\(a\)$/i, '')
}

const ASSET_ID_ALIASES: Record<string, string> = {
  cash: 'cash-usd-dime',
}

type AssetLike = {
  id: string
  symbol?: string
}

export function findFinanceAssetByAssetId<T extends AssetLike>(assets: readonly T[], assetId: string): T | undefined {
  const normalizedAssetId = normalizeAssetId(assetId)
  const resolvedAssetId = ASSET_ID_ALIASES[normalizedAssetId] ?? normalizedAssetId
  const matched = assets.find((asset) => normalizeAssetId(asset.id) === resolvedAssetId)

  if (!matched) {
    console.warn('asset lookup failed:', {
      sheetAssetId: assetId,
      normalizedAssetId,
    })
  }

  return matched
}
