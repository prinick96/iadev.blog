import type { Size, Viewport } from '@/ui/pages/Architecture/components/ArchitectureDiagram/types'

export function fitViewport(bounds: Viewport, size: Size): Viewport {
  const aspectRatio = Math.max(1, size.width) / Math.max(1, size.height)
  const width = Math.max(1, bounds.width, Math.max(1, bounds.height) * aspectRatio)
  const height = width / aspectRatio

  return {
    x: bounds.x + (bounds.width - width) / 2,
    y: bounds.y + (bounds.height - height) / 2,
    width,
    height,
  }
}
