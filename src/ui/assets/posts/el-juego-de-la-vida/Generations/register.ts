import LifeBoardElement from '@/ui/assets/posts/el-juego-de-la-vida/Board/LifeBoardElement'

class GenerationsElement extends LifeBoardElement {
  constructor() {
    super('life-generations-template', 'blinker')
  }
}

if (!customElements.get('life-generations')) {
  customElements.define('life-generations', GenerationsElement)
}
