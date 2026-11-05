export type Point = {
  x: number
  y: number
}

export type Size = {
  width: number
  height: number
}

export type Viewport = Point & Size

export type ZoomLimits = {
  min_width: number
  max_width: number
}

export type DiagramSource = {
  path: string
  line: number
  end_line?: number
}

export type DiagramNode = {
  id: string
  label: string
  sublabel: string
  tag: string
  x: number
  y: number
  width: number
  height: number
  sources: readonly DiagramSource[]
}

export type DiagramConnection = {
  id: string
  from: string
  to: string
  label: string
  path: string
  label_x: number
  label_y: number
  emphasis: boolean
}

export type DiagramView = {
  id: string
  label: string
  focus: readonly string[]
  note: string
}

export type Diagram = {
  revision: string
  bounds: Viewport
  nodes: readonly DiagramNode[]
  connections: readonly DiagramConnection[]
  views: readonly DiagramView[]
}
