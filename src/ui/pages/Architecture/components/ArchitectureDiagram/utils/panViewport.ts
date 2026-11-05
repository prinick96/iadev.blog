import type { Point, Viewport } from '@/ui/pages/Architecture/components/ArchitectureDiagram/types'

export function panViewport(viewport: Viewport, delta: Point): Viewport {
  return {
    ...viewport,
    x: viewport.x + delta.x,
    y: viewport.y + delta.y,
  }
}
