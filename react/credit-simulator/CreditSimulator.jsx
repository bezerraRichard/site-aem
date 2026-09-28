import { useId, useMemo, useState } from 'react';
import { simulate } from './finance.js';

const currency = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
const percent = new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * A range slider paired with a number input, so the value can be dragged or typed.
 */
function RangeField({
  label, unit, value, min, max, step, format, onChange,
}) {
  const id = useId();
  const [draft, setDraft] = useState(null);

  const commit = (raw) => {
    const parsed = parseFloat(String(raw).replace(',', '.'));
    setDraft(null);
    if (!Number.isNaN(parsed)) onChange(clamp(Math.round(parsed / step) * step, min, max));
  };

  return (
    <div className="credit-simulator-field">
      <div className="credit-simulator-field-header">
        <label htmlFor={`${id}-input`}>{label}</label>
        <span className="credit-simulator-field-input">
          <input
            id={`${id}-input`}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            value={draft ?? value}
            onInput={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(e.target.value); }}
          />
          <span aria-hidden="true">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        aria-valuetext={format(value)}
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(e) => onChange(Number(e.target.value))}
      />
      <div className="credit-simulator-range-limits" aria-hidden="true">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

/**
 * Personal loan simulator: pick amount and term, see the monthly payment and costs.
 */
export default function CreditSimulator({
  title,
  rate,
  fee,
  amount: amountLimits,
  term: termLimits,
  ctaText,
  ctaLink,
  disclaimer,
}) {
  const [amount, setAmount] = useState(amountLimits.initial);
  const [months, setMonths] = useState(termLimits.initial);
  const result = useMemo(() => simulate({
    amount, months, rate, fee,
  }), [amount, months, rate, fee]);

  return (
    <div className="credit-simulator-app">
      <div className="credit-simulator-inputs">
        {title && <h2 className="credit-simulator-title">{title}</h2>}
        <RangeField
          label="Montante"
          unit="€"
          value={amount}
          min={amountLimits.min}
          max={amountLimits.max}
          step={amountLimits.step}
          format={(v) => currency.format(v)}
          onChange={setAmount}
        />
        <RangeField
          label="Prazo"
          unit="meses"
          value={months}
          min={termLimits.min}
          max={termLimits.max}
          step={termLimits.step}
          format={(v) => `${v} meses`}
          onChange={setMonths}
        />
      </div>

      <div className="credit-simulator-result" aria-live="polite">
        <p className="credit-simulator-payment-label">Prestação mensal</p>
        <p className="credit-simulator-payment">{currency.format(result.payment)}</p>
        <dl>
          <div>
            <dt>TAN</dt>
            <dd>{`${percent.format(rate)}%`}</dd>
          </div>
          <div>
            <dt>TAEG</dt>
            <dd>{`${percent.format(result.apr)}%`}</dd>
          </div>
          <div>
            <dt>Total de juros</dt>
            <dd>{currency.format(result.interest)}</dd>
          </div>
          {fee > 0 && (
            <div>
              <dt>Comissão de abertura</dt>
              <dd>{currency.format(fee)}</dd>
            </div>
          )}
          <div>
            <dt>Montante total a pagar (MTIC)</dt>
            <dd>{currency.format(result.total)}</dd>
          </div>
        </dl>
        {ctaText && ctaLink && (
          <p className="button-wrapper">
            <a className="button primary" href={ctaLink}>{ctaText}</a>
          </p>
        )}
      </div>

      {disclaimer && <p className="credit-simulator-disclaimer">{disclaimer}</p>}
    </div>
  );
}
