function calculateTotal(priceCents: number, quantity: number): number {
  return priceCents * quantity;
}

const total = calculateTotal(1999, 3);
console.log(`Total: ${total} cents`);