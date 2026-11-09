import LifeBoardElement from '@/ui/assets/posts/el-juego-de-la-vida/Board/LifeBoardElement'

class CompleteGameElement extends LifeBoardElement {
  constructor() {
    super('life-complete-game-template', 'glider')
  }
}

if (!customElements.get('life-complete-game')) {
  customElements.define('life-complete-game', CompleteGameElement)
}
