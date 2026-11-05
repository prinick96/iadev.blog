import type { Point, Viewport, ZoomLimits } from '@/ui/pages/Architecture/components/ArchitectureDiagram/types'

export function zoomViewport(viewport: Viewport, factor: number, anchor: Point, limits: ZoomLimits): Viewport {
  if (!Number.isFinite(factor) || factor <= 0) {
    return { ...viewport }
  }

  const width = Math.min(limits.max_width, Math.max(limits.min_width, viewport.width / factor))
  const scale = width / viewport.width

  return {
    x: anchor.x - (anchor.x - viewport.x) * scale,
    y: anchor.y - (anchor.y - viewport.y) * scale,
    width,
    height: viewport.height * scale,
  }
}
