// lib/calculations.ts
// Financial calculation functions for real estate investment analysis

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  purchase_price: number;
  current_value: number;
  down_payment?: number;
  loan_amount?: number;
  interest_rate?: number;
  monthly_rent: number;
  monthly_expenses: number;
  monthly_cash_flow?: number;
  annual_noi?: number;
  cap_rate?: number;
  roi?: number;
  status: 'analyzing' | 'acquired' | 'passed' | 'sold';
  created_at: string;
}

export interface PortfolioMetrics {
  totalProperties: number;
  totalValue: number;
  avgCapRate: number;
  monthlyCashFlow: number;
  totalROI: number;
  propertiesAnalyzed: number;
}

/**
 * Calculate Net Operating Income (NOI)
 * NOI = Annual Rental Income - Annual Operating Expenses
 */
export function calculateNOI(property: Property): number {
  const annualRent = property.monthly_rent * 12;
  const annualExpenses = property.monthly_expenses * 12;
  return annualRent - annualExpenses;
}

/**
 * Calculate Capitalization Rate (Cap Rate)
 * Cap Rate = (NOI / Property Value) × 100
 * Indicates the rate of return on a real estate investment
 */
export function calculateCapRate(property: Property): number {
  const noi = calculateNOI(property);
  if (property.current_value === 0) return 0;
  return (noi / property.current_value) * 100;
}

/**
 * Calculate Monthly Cash Flow
 * Cash Flow = Monthly Rent - Monthly Expenses - Mortgage Payment
 */
export function calculateMonthlyCashFlow(property: Property): number {
  let mortgagePayment = 0;

  // Calculate mortgage payment if loan exists
  if (property.loan_amount && property.interest_rate) {
    const monthlyRate = property.interest_rate / 100 / 12;
    const numberOfPayments = 30 * 12; // 30-year loan

    if (monthlyRate > 0) {
      mortgagePayment = property.loan_amount *
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }
  }

  return property.monthly_rent - property.monthly_expenses - mortgagePayment;
}

/**
 * Calculate Annual Cash Flow
 */
export function calculateAnnualCashFlow(property: Property): number {
  return calculateMonthlyCashFlow(property) * 12;
}

/**
 * Calculate Cash-on-Cash Return
 * CoC Return = (Annual Cash Flow / Total Cash Invested) × 100
 */
export function calculateCashOnCashReturn(property: Property): number {
  const annualCashFlow = calculateAnnualCashFlow(property);
  const cashInvested = property.down_payment || property.purchase_price;

  if (cashInvested === 0) return 0;
  return (annualCashFlow / cashInvested) * 100;
}

/**
 * Calculate Total Return on Investment (ROI)
 * ROI = ((Current Value - Purchase Price + Cumulative Cash Flow) / Purchase Price) × 100
 */
export function calculateROI(property: Property): number {
  if (property.purchase_price === 0) return 0;

  const appreciation = property.current_value - property.purchase_price;
  const annualCashFlow = calculateAnnualCashFlow(property);

  // Estimate years owned (simplified - use created_at in real implementation)
  const yearsOwned = 1;
  const cumulativeCashFlow = annualCashFlow * yearsOwned;

  return ((appreciation + cumulativeCashFlow) / property.purchase_price) * 100;
}

/**
 * Calculate Gross Rent Multiplier (GRM)
 * GRM = Property Price / Annual Rental Income
 * Lower is better (indicates faster payback)
 */
export function calculateGRM(property: Property): number {
  const annualRent = property.monthly_rent * 12;
  if (annualRent === 0) return 0;
  return property.purchase_price / annualRent;
}

/**
 * Calculate Debt Service Coverage Ratio (DSCR)
 * DSCR = NOI / Annual Debt Service
 * Lenders typically want DSCR > 1.25
 */
export function calculateDSCR(property: Property): number {
  const noi = calculateNOI(property);

  if (!property.loan_amount || !property.interest_rate) return 0;

  const monthlyRate = property.interest_rate / 100 / 12;
  const numberOfPayments = 30 * 12;

  if (monthlyRate === 0) return 0;

  const monthlyMortgage = property.loan_amount *
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  const annualDebtService = monthlyMortgage * 12;

  if (annualDebtService === 0) return 0;
  return noi / annualDebtService;
}

/**
 * Calculate portfolio-wide metrics from array of properties
 */
export function calculatePortfolioMetrics(properties: Property[]): PortfolioMetrics {
  if (properties.length === 0) {
    return {
      totalProperties: 0,
      totalValue: 0,
      avgCapRate: 0,
      monthlyCashFlow: 0,
      totalROI: 0,
      propertiesAnalyzed: 0,
    };
  }

  const totalValue = properties.reduce((sum, p) => sum + p.current_value, 0);
  const monthlyCashFlow = properties.reduce((sum, p) => sum + calculateMonthlyCashFlow(p), 0);

  // Calculate average cap rate (weighted by property value)
  const weightedCapRateSum = properties.reduce((sum, p) => {
    return sum + (calculateCapRate(p) * p.current_value);
  }, 0);
  const avgCapRate = totalValue > 0 ? weightedCapRateSum / totalValue : 0;

  // Calculate portfolio ROI
  const totalPurchasePrice = properties.reduce((sum, p) => sum + p.purchase_price, 0);
  const totalAppreciation = totalValue - totalPurchasePrice;
  const annualCashFlow = monthlyCashFlow * 12;
  const totalROI = totalPurchasePrice > 0
    ? ((totalAppreciation + annualCashFlow) / totalPurchasePrice) * 100
    : 0;

  // Count properties with status 'analyzing'
  const propertiesAnalyzed = properties.filter(p => p.status === 'analyzing').length;

  return {
    totalProperties: properties.length,
    totalValue,
    avgCapRate,
    monthlyCashFlow,
    totalROI,
    propertiesAnalyzed,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Determine property performance rating
 */
export function getPropertyRating(property: Property): {
  score: number;
  label: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  color: string;
} {
  const capRate = calculateCapRate(property);
  const roi = calculateROI(property);
  const cashFlow = calculateMonthlyCashFlow(property);

  // Scoring logic
  let score = 0;

  // Cap rate scoring (0-40 points)
  if (capRate >= 10) score += 40;
  else if (capRate >= 8) score += 30;
  else if (capRate >= 6) score += 20;
  else if (capRate >= 4) score += 10;

  // ROI scoring (0-30 points)
  if (roi >= 20) score += 30;
  else if (roi >= 15) score += 20;
  else if (roi >= 10) score += 10;

  // Cash flow scoring (0-30 points)
  if (cashFlow >= 500) score += 30;
  else if (cashFlow >= 300) score += 20;
  else if (cashFlow >= 100) score += 10;
  else if (cashFlow > 0) score += 5;

  // Determine label and color
  let label: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  let color: string;

  if (score >= 80) {
    label = 'Excellent';
    color = 'green';
  } else if (score >= 60) {
    label = 'Good';
    color = 'blue';
  } else if (score >= 40) {
    label = 'Fair';
    color = 'yellow';
  } else {
    label = 'Poor';
    color = 'red';
  }

  return { score, label, color };
}

