// app/api/property/analyze/route.ts
// Main property analysis endpoint - orchestrates all data sources
import { NextRequest, NextResponse } from 'next/server';

interface PropertyDetails {
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt?: number;
  propertyType?: string;
  lotSize?: number;
}

interface TaxData {
  assessedValue?: number;
  taxAmount?: number;
  taxYear?: number;
}

interface AttomData {
  propertyDetails: PropertyDetails;
  taxData: TaxData;
  salesHistory: unknown[];
  usingMockData?: boolean;
}

interface RentcastData {
  marketRent: number;
  comps: unknown[];
  usingMockData?: boolean;
}

interface ManualPropertyData {
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt?: number;
  purchasePrice?: number;
  currentValue: number;
  monthlyRent?: number;
  annualTax?: number;
}

interface PropertyAnalysis {
  address: string;
  propertyDetails: unknown;
  taxData: unknown;
  salesHistory: unknown;
  rentalComps: unknown;
  marketRent: number | null;
  aiAnalysis: string;
  dealScore: number;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'pass';
  usingMockData?: boolean;
  dataWarning?: string;
  usingManualData?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { address, city, state, zip, manualData } = await request.json();

    if (!address || !city || !state) {
      return NextResponse.json(
        { error: 'Address, city, and state are required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Analyzing property: ${address}, ${city}, ${state}`);

    // Check if manual data is provided
    if (manualData) {
      console.log('📝 Using manual property data provided by user');
      return handleManualDataAnalysis(address, city, state, manualData);
    }

    // Step 1: Get property details from ATTOM API
    const attomData = await fetchAttomData(address, city, state, zip);

    // Step 2: Get rental comps from RentCast
    const rentcastData = await fetchRentcastData(address, city, state, zip);

    // Step 3: Generate AI analysis with Claude
    const aiAnalysis = await generateAIAnalysis({
      address,
      attomData,
      rentcastData
    });

    // Step 4: Calculate deal score
    const dealScore = calculateDealScore(attomData, rentcastData);

    // Step 5: Generate recommendation
    const recommendation = generateRecommendation(dealScore, aiAnalysis);

    // Check if using mock data
    const usingMockData = attomData.usingMockData || rentcastData.usingMockData;
    const dataWarning = usingMockData
      ? '⚠️ Using placeholder data - This property may be outside the US, or API keys are not configured. Data shown is for demonstration purposes only and is not accurate.'
      : undefined;

    const analysis: PropertyAnalysis = {
      address: `${address}, ${city}, ${state}`,
      propertyDetails: attomData.propertyDetails,
      taxData: attomData.taxData,
      salesHistory: attomData.salesHistory,
      rentalComps: rentcastData.comps,
      marketRent: rentcastData.marketRent,
      aiAnalysis: aiAnalysis,
      dealScore,
      recommendation,
      usingMockData,
      dataWarning
    };

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error analyzing property:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze property',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Handle manual data analysis (skip APIs, use user-provided data)
async function handleManualDataAnalysis(
  address: string,
  city: string,
  state: string,
  manualData: ManualPropertyData
) {
  try {
    const fullAddress = `${address}, ${city}, ${state}`;

    // Convert manual data to property details format
    const propertyDetails = {
      beds: manualData.beds,
      baths: manualData.baths,
      sqft: manualData.sqft,
      yearBuilt: manualData.yearBuilt,
      propertyType: 'User Provided'
    };

    const taxData = {
      assessedValue: manualData.currentValue,
      taxAmount: manualData.annualTax,
    };

    // Generate AI analysis with manual data
    const aiAnalysis = await generateAIAnalysisFromManualData({
      address: fullAddress,
      manualData,
      propertyDetails
    });

    // Calculate deal score from manual data
    const dealScore = calculateDealScoreFromManualData(manualData);

    // Generate recommendation
    const recommendation = generateRecommendation(dealScore, aiAnalysis);

    const analysis: PropertyAnalysis = {
      address: fullAddress,
      propertyDetails,
      taxData,
      salesHistory: [],
      rentalComps: [],
      marketRent: manualData.monthlyRent || null,
      aiAnalysis,
      dealScore,
      recommendation,
      usingMockData: false, // User provided real data
      usingManualData: true,
      dataWarning: undefined
    };

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error analyzing manual property data:', error);
    throw error;
  }
}

// Fetch property data from ATTOM API
async function fetchAttomData(address: string, city: string, state: string, zip?: string) {
  const ATTOM_API_KEY = process.env.ATTOM_API_KEY;

  if (!ATTOM_API_KEY) {
    console.warn('ATTOM_API_KEY not configured - using mock data');
    return {
      propertyDetails: { beds: 3, baths: 2, sqft: 1800, yearBuilt: 2010 },
      taxData: { assessedValue: 350000, taxAmount: 4200 },
      salesHistory: [],
      usingMockData: true
    };
  }

  try {
    // ATTOM API endpoint for property details
    const response = await fetch(
      `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=${encodeURIComponent(address)}&address2=${encodeURIComponent(city + ', ' + state + ' ' + (zip || ''))}`,
      {
        headers: {
          'apikey': ATTOM_API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('ATTOM API error:', await response.text());
      throw new Error(`ATTOM API returned ${response.status}`);
    }

    const data = await response.json();
    const property = data.property?.[0];

    return {
      propertyDetails: {
        beds: property?.building?.rooms?.beds,
        baths: property?.building?.rooms?.bathstotal,
        sqft: property?.building?.size?.livingsize,
        yearBuilt: property?.summary?.yearbuilt,
        propertyType: property?.summary?.proptype,
        lotSize: property?.lot?.lotsize1
      },
      taxData: {
        assessedValue: property?.assessment?.assessed?.assdttlvalue,
        taxAmount: property?.assessment?.tax?.taxamt,
        taxYear: property?.assessment?.tax?.taxyear
      },
      salesHistory: property?.sale || []
    };

  } catch (error) {
    console.error('Error fetching ATTOM data:', error);
    // Return mock data on error
    return {
      propertyDetails: { beds: 3, baths: 2, sqft: 1800, yearBuilt: 2010 },
      taxData: { assessedValue: 350000, taxAmount: 4200 },
      salesHistory: [],
      usingMockData: true
    };
  }
}

// Fetch rental data from RentCast API
async function fetchRentcastData(address: string, city: string, state: string, zip?: string) {
  const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY;

  if (!RENTCAST_API_KEY || RENTCAST_API_KEY === 'your_rentcast_key_here') {
    console.warn('RENTCAST_API_KEY not configured - using mock data');
    return {
      marketRent: 2400,
      comps: [
        { address: '123 Similar St', rent: 2300, distance: 0.2 },
        { address: '456 Nearby Ave', rent: 2500, distance: 0.3 }
      ],
      usingMockData: true
    };
  }

  try {
    const fullAddress = `${address}, ${city}, ${state} ${zip || ''}`;

    // RentCast API endpoint for rent estimate
    const response = await fetch(
      `https://api.rentcast.io/v1/avm/rent/long-term?address=${encodeURIComponent(fullAddress)}`,
      {
        headers: {
          'X-Api-Key': RENTCAST_API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('RentCast API error:', await response.text());
      throw new Error(`RentCast API returned ${response.status}`);
    }

    const data = await response.json();

    return {
      marketRent: data.rent || 2400,
      comps: data.comparables || []
    };

  } catch (error) {
    console.error('Error fetching RentCast data:', error);
    // Return mock data on error
    return {
      marketRent: 2400,
      comps: [
        { address: '123 Similar St', rent: 2300, distance: 0.2 },
        { address: '456 Nearby Ave', rent: 2500, distance: 0.3 }
      ],
      usingMockData: true
    };
  }
}

// Generate AI analysis with Claude
async function generateAIAnalysis(data: { address: string; attomData: unknown; rentcastData: unknown }) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not configured - using generic analysis');
    return 'This property shows moderate investment potential based on market conditions.';
  }

  try {
    const prompt = `You are a real estate investment analyst. Analyze this property:

Address: ${data.address}

Property Details:
${JSON.stringify(data.attomData, null, 2)}

Rental Market Data:
${JSON.stringify(data.rentcastData, null, 2)}

Provide a concise investment analysis (3-4 sentences) covering:
1. Deal quality (good/bad value compared to market)
2. Key strengths and concerns
3. Clear recommendation (Strong Buy, Buy, Hold, or Pass)

Keep it professional but conversational.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', await response.text());
      throw new Error(`Claude API returned ${response.status}`);
    }

    const result = await response.json();
    return result.content[0].text;

  } catch (error) {
    console.error('Error generating AI analysis:', error);
    return 'This property shows moderate investment potential. Consider the local market conditions and your investment goals when making a decision.';
  }
}

// Calculate deal score (0-100)
function calculateDealScore(attomData: AttomData, rentcastData: RentcastData): number {
  let score = 50; // Start at neutral

  // Scoring logic (simplified)
  const assessedValue = attomData.taxData?.assessedValue || 0;
  const marketRent = rentcastData.marketRent || 0;
  const annualRent = marketRent * 12;

  // Basic cap rate check
  if (assessedValue > 0 && marketRent > 0) {
    const estimatedExpenses = annualRent * 0.35; // 35% expense ratio
    const noi = annualRent - estimatedExpenses;
    const capRate = (noi / assessedValue) * 100;

    // Score based on cap rate
    if (capRate >= 10) score += 30;
    else if (capRate >= 8) score += 20;
    else if (capRate >= 6) score += 10;
    else if (capRate >= 4) score += 5;
    else score -= 10;
  }

  // Year built bonus (newer = better)
  const yearBuilt = attomData.propertyDetails?.yearBuilt || 0;
  const age = new Date().getFullYear() - yearBuilt;
  if (age < 10) score += 10;
  else if (age < 20) score += 5;
  else if (age > 50) score -= 5;

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

// Generate recommendation based on score and AI analysis
function generateRecommendation(score: number, aiAnalysis: string): 'strong_buy' | 'buy' | 'hold' | 'pass' {
  const lowerAnalysis = aiAnalysis.toLowerCase();

  // Check AI analysis for strong signals
  if (lowerAnalysis.includes('strong buy') || lowerAnalysis.includes('excellent')) {
    return 'strong_buy';
  }
  if (lowerAnalysis.includes('pass') || lowerAnalysis.includes('avoid')) {
    return 'pass';
  }

  // Use score-based logic
  if (score >= 80) return 'strong_buy';
  if (score >= 65) return 'buy';
  if (score >= 45) return 'hold';
  return 'pass';
}

// Generate AI analysis from manual data
async function generateAIAnalysisFromManualData(data: {
  address: string;
  manualData: ManualPropertyData;
  propertyDetails: PropertyDetails;
}) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  console.log('🔑 ANTHROPIC_API_KEY present?', !!ANTHROPIC_API_KEY);
  console.log('📊 Manual data:', JSON.stringify(data.manualData, null, 2));

  if (!ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not configured - using generic analysis');
    return 'This property shows moderate investment potential based on the data provided. Consider your investment goals and local market conditions.';
  }

  console.log('🤖 Calling Claude API for manual data analysis...');

  try {
    const prompt = `You are a real estate investment analyst. Analyze this property based on user-provided data:

Address: ${data.address}

Property Details:
- ${data.manualData.beds} bed, ${data.manualData.baths} bath
- ${data.manualData.sqft} sqft
${data.manualData.yearBuilt ? `- Built ${data.manualData.yearBuilt}` : ''}
${data.manualData.purchasePrice ? `- Purchase: $${data.manualData.purchasePrice.toLocaleString()}` : ''}
- Current Value: $${data.manualData.currentValue.toLocaleString()}
${data.manualData.monthlyRent && data.manualData.monthlyRent > 0 ? `- Monthly Rent: $${data.manualData.monthlyRent.toLocaleString()}` : '- Property: Owner Occupied (not rented)'}
${data.manualData.annualTax ? `- Annual Tax: $${data.manualData.annualTax.toLocaleString()}` : ''}

Provide a clean, professional analysis with:

**Summary:** One sentence overview of the deal

**Key Metrics:**
- Price per sqft analysis
- Appreciation (if purchase price provided)
${data.manualData.monthlyRent && data.manualData.monthlyRent > 0 ? '- Cap rate estimate' : ''}

**Strengths:** (2-3 bullet points)

**Considerations:** (2-3 bullet points)

**Recommendation:** Clear verdict (Strong Buy / Buy / Hold / Pass) with 1-sentence reasoning

Keep it concise and actionable. Focus on what IS provided, not what's missing.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error (manual data):', response.status, errorText);
      throw new Error(`Claude API returned ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Claude API success for manual data! Response length:', result.content[0].text.length);
    return result.content[0].text;

  } catch (error) {
    console.error('❌ Error generating AI analysis from manual data:', error);
    return 'This property shows moderate investment potential based on the data provided. Consider the local market conditions and your investment goals when making a decision.';
  }
}

// Calculate deal score from manual data
function calculateDealScoreFromManualData(manualData: ManualPropertyData): number {
  let score = 50; // Start at neutral

  const currentValue = manualData.currentValue;
  const monthlyRent = manualData.monthlyRent || 0;
  const annualRent = monthlyRent * 12;

  // Cap rate scoring (if rent data provided)
  if (monthlyRent > 0 && currentValue > 0) {
    const estimatedExpenses = annualRent * 0.35; // 35% expense ratio
    const noi = annualRent - estimatedExpenses;
    const capRate = (noi / currentValue) * 100;

    if (capRate >= 10) score += 30;
    else if (capRate >= 8) score += 20;
    else if (capRate >= 6) score += 10;
    else if (capRate >= 4) score += 5;
    else if (capRate > 0) score += 2;
  }

  // Price per square foot analysis
  if (manualData.sqft > 0 && currentValue > 0) {
    const pricePerSqft = currentValue / manualData.sqft;

    // These are rough benchmarks - adjust based on market
    if (pricePerSqft < 150) score += 15; // Great value
    else if (pricePerSqft < 200) score += 10; // Good value
    else if (pricePerSqft < 300) score += 5; // Fair value
    else if (pricePerSqft > 400) score -= 10; // Expensive
  }

  // Year built bonus (newer = better, if provided)
  if (manualData.yearBuilt) {
    const age = new Date().getFullYear() - manualData.yearBuilt;
    if (age < 10) score += 10;
    else if (age < 20) score += 5;
    else if (age > 50) score -= 5;
  }

  // Purchase price vs current value (if both provided)
  if (manualData.purchasePrice && currentValue > manualData.purchasePrice) {
    const appreciation = ((currentValue - manualData.purchasePrice) / manualData.purchasePrice) * 100;
    if (appreciation >= 20) score += 15; // Strong appreciation
    else if (appreciation >= 10) score += 10;
    else if (appreciation >= 5) score += 5;
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}
