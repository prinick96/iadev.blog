import LifeBoardElement from '@/ui/assets/posts/el-juego-de-la-vida/Board/LifeBoardElement'

class PatternGridElement extends LifeBoardElement {
  constructor() {
    super('life-pattern-grid-template', 'glider')
  }
}

if (!customElements.get('life-pattern-grid')) {
  customElements.define('life-pattern-grid', PatternGridElement)
}
