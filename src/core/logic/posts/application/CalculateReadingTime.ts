class CalculateReadingTime {
  static execute(text: string): number {
    const wordCount = text.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*/gu)?.length ?? 0

    return Math.ceil(wordCount / 200)
  }
}

export default CalculateReadingTime
