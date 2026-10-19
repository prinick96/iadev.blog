import { countTokens } from 'gpt-tokenizer/model/gpt-5.6-luna' // No tenemos gpt 6 astra iphone max pro ultra todavía

class CalculateTokens {
  static execute(text: string): number {
    return countTokens(text, { disallowedSpecial: new Set<string>() })
  }
}

export default CalculateTokens
