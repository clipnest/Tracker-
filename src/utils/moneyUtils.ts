export const paisoToRupees = (paise: number): number => Math.floor(paise / 100);

export const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100);

export const formatRupees = (paise: number): string => {
  const rupees = Math.floor(paise / 100);
  return '\u20b9' + rupees.toLocaleString('en-IN');
};

export const formatRupeesDecimal = (paise: number): string => {
  const rupees = paise / 100;
  return '\u20b9' + rupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export const parseCurrency = (input: string): number => {
  const num = parseFloat(input.replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num <= 0) return 0;
  return rupeesToPaise(num);
};
