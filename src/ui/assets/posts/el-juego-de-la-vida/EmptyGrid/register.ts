import LifeBoardElement from '@/ui/assets/posts/el-juego-de-la-vida/Board/LifeBoardElement'

class EmptyGridElement extends LifeBoardElement {
  constructor() {
    super('life-empty-grid-template')
  }
}

if (!customElements.get('life-empty-grid')) {
  customElements.define('life-empty-grid', EmptyGridElement)
}
