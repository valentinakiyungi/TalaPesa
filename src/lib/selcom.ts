
export async function initiateSelcomPayment(amount: number, phone: string, loanId: string) {
  // MOCK MODE (remove in production)
  if (process.env.NODE_ENV === 'development') {
    alert(`MOCK: TZS ${amount} payment initiated to ${phone}`);
    return { success: true, transid: 'MOCK123' };
  }

  // REAL API (uncomment in production)
  /*
  const response = await fetch('https://pay.selcom.co.tz/v1/checkout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.SELCOM_API_KEY}` },
    body: JSON.stringify({
      amount,
      msisdn: phone,
      reference: loanId,
      vendor: 'ESNCASH',
    }),
  });
  return response.json();
  */
}