/**
 * Monthly payment of a loan with fixed installments (French amortization).
 * @param {number} amount Borrowed amount
 * @param {number} annualRate Nominal annual rate (TAN), in percent
 * @param {number} months Number of monthly installments
 * @returns {number} the monthly payment
 */
export function monthlyPayment(amount, annualRate, months) {
  if (amount <= 0 || months <= 0) return 0;
  const i = annualRate / 100 / 12;
  if (i === 0) return amount / months;
  return (amount * i) / (1 - (1 + i) ** -months);
}

/**
 * Annual percentage rate (TAEG): the effective annual rate that equals the net amount
 * received (amount minus upfront fee) to the present value of all installments.
 * @param {number} amount Borrowed amount
 * @param {number} payment Monthly payment
 * @param {number} months Number of monthly installments
 * @param {number} fee Upfront fee paid by the customer
 * @returns {number} the APR in percent
 */
export function annualPercentageRate(amount, payment, months, fee = 0) {
  const net = amount - fee;
  if (net <= 0 || payment <= 0 || months <= 0) return 0;
  const presentValue = (rate) => {
    let pv = 0;
    for (let k = 1; k <= months; k += 1) pv += payment / (1 + rate) ** (k / 12);
    return pv;
  };
  // present value decreases as the rate grows, so bisect between 0% and 1000%
  let low = 0;
  let high = 10;
  if (presentValue(low) <= net) return 0;
  for (let n = 0; n < 100; n += 1) {
    const mid = (low + high) / 2;
    if (presentValue(mid) > net) low = mid;
    else high = mid;
  }
  return ((low + high) / 2) * 100;
}

/**
 * Full simulation used by the component.
 * @param {{amount: number, months: number, rate: number, fee: number}} input
 * @returns {{payment: number, interest: number, total: number, apr: number}}
 */
export function simulate({
  amount, months, rate, fee = 0,
}) {
  const payment = monthlyPayment(amount, rate, months);
  const interest = payment * months - amount;
  return {
    payment,
    interest,
    total: payment * months + fee,
    apr: annualPercentageRate(amount, payment, months, fee),
  };
}
