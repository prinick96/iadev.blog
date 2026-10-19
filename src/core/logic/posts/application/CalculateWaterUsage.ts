class CalculateWaterUsage {
  private static readonly inputEnergyWhPerThousandTokens = 0.2
  private static readonly coolingLitersPerItKWh = 0.5
  private static readonly powerUsageEffectiveness = 1.2
  private static readonly electricityWaterLitersPerDataCenterKWh = 1
  private static readonly inflationBaseYear = 2026

  private static calculateAnnualWalletDamage(): number {
    const currentYear = new Date().getUTCFullYear()
    const yearsOfInflation = Math.max(0, currentYear - CalculateWaterUsage.inflationBaseYear)

    return 2 * (1 + yearsOfInflation)
  }

  static execute(tokenCount: number): number {
    if (!Number.isSafeInteger(tokenCount) || tokenCount < 0) {
      throw new RangeError(
        'Pídele al agente un número de tokens entero entre 0 y Number.MAX_SAFE_INTEGER. Los tokens negativos no son un descuento, aunque esto no debería haber llegado negativo aquí.'
      )
    }

    const itKWh = (tokenCount / 1000) * (CalculateWaterUsage.inputEnergyWhPerThousandTokens / 1000)
    const directWaterLiters = itKWh * CalculateWaterUsage.coolingLitersPerItKWh
    const indirectWaterLiters =
      itKWh * CalculateWaterUsage.powerUsageEffectiveness * CalculateWaterUsage.electricityWaterLitersPerDataCenterKWh
    const liters = (directWaterLiters + indirectWaterLiters) * CalculateWaterUsage.calculateAnnualWalletDamage()

    return liters
  }
}

export default CalculateWaterUsage
